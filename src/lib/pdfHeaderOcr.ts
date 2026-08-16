import jpeg from "jpeg-js";
import { createWorker, PSM } from "tesseract.js";

type Raster = { mime: "image/jpeg" | "image/png"; bytes: Uint8Array };

const EMAIL_HINT = /[\w.+-]+@[\w-]+\.[A-Za-z]{2,}/;
const PHONE_HINT = /(?:\+92[-\s]?|0)3\d{2}[-\s]?\d{7}|\+\d{1,3}[\s-]?\d{7,12}/;
const CONTACT_LABEL = /\b(address|phone|email|e-?mail|mobile|linkedin)\b/i;

function findAll(hay: Uint8Array, needle: number[]): number[] {
  const out: number[] = [];
  outer: for (let i = 0; i <= hay.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    out.push(i);
  }
  return out;
}

function extractPdfRasters(bytes: Uint8Array): Raster[] {
  const out: Raster[] = [];
  const jpegStarts = findAll(bytes, [0xff, 0xd8, 0xff]);
  const jpegEnds = findAll(bytes, [0xff, 0xd9]);
  for (const start of jpegStarts) {
    const end = jpegEnds.find((e) => e > start + 2000);
    if (end == null) continue;
    const slice = bytes.subarray(start, end + 2);
    if (slice.length < 8000 || slice.length > 900_000) continue;
    out.push({ mime: "image/jpeg", bytes: slice });
  }
  const pngStarts = findAll(bytes, [0x89, 0x50, 0x4e, 0x47]);
  const iendMark = [0x49, 0x45, 0x4e, 0x44];
  for (const start of pngStarts) {
    const iend = findAll(bytes.subarray(start), iendMark)[0];
    if (iend == null) continue;
    const end = start + iend + 8;
    const slice = bytes.subarray(start, end);
    if (slice.length < 8000 || slice.length > 900_000) continue;
    out.push({ mime: "image/png", bytes: slice });
  }
  return out.sort((a, b) => b.bytes.length - a.bytes.length);
}

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function thresholdScale(data: Uint8Array, width: number, height: number, threshold: number, factor: number): {
  data: Uint8Array;
  width: number;
  height: number;
} {
  const bw = new Uint8Array(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    const light = luminance(data[i], data[i + 1], data[i + 2]) >= threshold;
    const ink = light ? 0 : 255;
    bw[i] = ink;
    bw[i + 1] = ink;
    bw[i + 2] = ink;
    bw[i + 3] = 255;
  }
  const nw = width * factor;
  const nh = height * factor;
  const out = new Uint8Array(nw * nh * 4);
  for (let y = 0; y < nh; y++) {
    for (let x = 0; x < nw; x++) {
      const si = (Math.floor(y / factor) * width + Math.floor(x / factor)) * 4;
      const di = (y * nw + x) * 4;
      out[di] = bw[si];
      out[di + 1] = bw[si + 1];
      out[di + 2] = bw[si + 2];
      out[di + 3] = 255;
    }
  }
  return { data: out, width: nw, height: nh };
}

function isBannerLike(width: number, height: number): boolean {
  if (width < 480 || height < 70 || height > 520) return false;
  return width / height >= 2;
}

function tidyOcrText(raw: string): string {
  return raw
    .replace(/\r/g, "")
    .replace(/\.[^\S\n]+(?=[a-z0-9._%+-]*@)/gi, ".")
    .replace(/([a-z])[^\S\n]+([a-z0-9._%+-]*@)/gi, "$1.$2")
    .replace(/([A-Z][a-z]+)\.([a-z][\w.+-]*@)/g, "$1\n$2")
    .replace(/@gmaill?\s*com/gi, "@gmail.com")
    .replace(/@gsmail\s*com/gi, "@gmail.com")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l && !/^estimating resolution/i.test(l))
    .join("\n")
    .trim();
}

function ocrLooksUseful(s: string): boolean {
  return EMAIL_HINT.test(s) || PHONE_HINT.test(s) || CONTACT_LABEL.test(s);
}

async function decodeJpeg(bytes: Uint8Array): Promise<{ width: number; height: number; data: Uint8Array } | null> {
  try {
    return jpeg.decode(bytes, { useTArray: true, formatAsRGBA: true });
  } catch {
    return null;
  }
}

/**
 * Designed PDFs (Word/Canva banners) often paint name/phone/email as a JPEG.
 * Run only when the text layer is missing contact — not for image-only scans.
 */
export async function ocrPdfHeaderImages(pdfBytes: Uint8Array): Promise<string> {
  const rasters = extractPdfRasters(pdfBytes).filter((r) => r.mime === "image/jpeg").slice(0, 3);
  if (!rasters.length) return "";

  const prepared: Uint8Array[] = [];
  for (const raster of rasters) {
    const decoded = await decodeJpeg(raster.bytes);
    if (!decoded || !isBannerLike(decoded.width, decoded.height)) continue;
    for (const threshold of [180, 150]) {
      const scaled = thresholdScale(decoded.data, decoded.width, decoded.height, threshold, 3);
      const encoded = jpeg.encode({ data: scaled.data, width: scaled.width, height: scaled.height }, 90);
      prepared.push(encoded.data);
    }
  }
  if (!prepared.length) return "";

  const worker = await createWorker("eng", 1, { logger: () => undefined });
  try {
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
    let best = "";
    for (const bytes of prepared) {
      const image = typeof Buffer !== "undefined" ? Buffer.from(bytes) : new Blob([bytes], { type: "image/jpeg" });
      const { data } = await worker.recognize(image as File);
      const text = tidyOcrText(data.text || "");
      if (!ocrLooksUseful(text)) continue;
      if (EMAIL_HINT.test(text) && PHONE_HINT.test(text)) return text;
      if (text.length > best.length) best = text;
    }
    return best;
  } finally {
    await worker.terminate();
  }
}

export function pdfTextMissingContact(text: string): boolean {
  return !EMAIL_HINT.test(text) || !PHONE_HINT.test(text);
}
