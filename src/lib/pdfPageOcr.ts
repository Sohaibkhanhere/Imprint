import jpeg from "jpeg-js";
import { createWorker, PSM } from "tesseract.js";

function findAll(hay: Uint8Array, needle: number[]): number[] {
  const out: number[] = [];
  outer: for (let i = 0; i <= hay.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    out.push(i);
  }
  return out;
}

function extractPdfJpegs(bytes: Uint8Array): Uint8Array[] {
  const out: Uint8Array[] = [];
  const jpegStarts = findAll(bytes, [0xff, 0xd8, 0xff]);
  const jpegEnds = findAll(bytes, [0xff, 0xd9]);
  for (const start of jpegStarts) {
    const end = jpegEnds.find((e) => e > start + 8000);
    if (end == null) continue;
    const slice = bytes.subarray(start, end + 2);
    if (slice.length < 20_000 || slice.length > 8_000_000) continue;
    out.push(slice);
  }
  return out.sort((a, b) => b.length - a.length).slice(0, 2);
}

function meanLuminance(data: Uint8Array | Uint8ClampedArray): number {
  let sum = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 16) {
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    n++;
  }
  return n ? sum / n : 255;
}

function binarizeResumePixels(data: Uint8Array | Uint8ClampedArray, darkPage: boolean) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    const ink = darkPage ? sat > 42 || lum > 68 : lum < 158 || sat > 55;
    const v = ink ? 0 : 255;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 255;
  }
}

function prepareCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  binarizeResumePixels(img.data, meanLuminance(img.data) < 118);
  ctx.putImageData(img, 0, 0);
}

function jpegToOcrBlob(bytes: Uint8Array): Blob | Buffer {
  const decoded = jpeg.decode(bytes, { useTArray: true, formatAsRGBA: true });
  binarizeResumePixels(decoded.data, meanLuminance(decoded.data) < 118);
  const encoded = jpeg.encode({ data: decoded.data, width: decoded.width, height: decoded.height }, 88);
  return typeof Buffer !== "undefined" ? Buffer.from(encoded.data) : new Blob([encoded.data], { type: "image/jpeg" });
}

async function renderPdfPage(page: {
  getViewport: (opts: { scale: number }) => { width: number; height: number };
  render: (opts: { canvas: HTMLCanvasElement; canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<unknown> };
}): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale: 2.2 });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(viewport.width));
  canvas.height = Math.max(1, Math.round(viewport.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not draw the PDF page.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  prepareCanvas(canvas);
  return canvas;
}

type OcrLine = { text: string; x0: number; y0: number; x1: number; y1: number };

function collectOcrLines(data: {
  blocks?: Array<{ paragraphs?: Array<{ lines?: Array<{ text?: string; bbox?: { x0: number; y0: number; x1: number; y1: number } }> }> }> | null;
  text?: string;
}): OcrLine[] {
  const lines: OcrLine[] = [];
  for (const block of data.blocks ?? []) {
    for (const para of block.paragraphs ?? []) {
      for (const line of para.lines ?? []) {
        const text = (line.text || "").replace(/\s+/g, " ").trim();
        if (!text || /^estimating resolution/i.test(text)) continue;
        const b = line.bbox;
        lines.push({
          text,
          x0: b?.x0 ?? 0,
          y0: b?.y0 ?? 0,
          x1: b?.x1 ?? 0,
          y1: b?.y1 ?? 0,
        });
      }
    }
  }
  return lines;
}

function layoutOcrLines(items: OcrLine[], pageWidth: number): string {
  if (!items.length) return "";
  const mid = pageWidth / 2;
  const full: OcrLine[] = [];
  const left: OcrLine[] = [];
  const right: OcrLine[] = [];
  for (const it of items) {
    const cx = (it.x0 + it.x1) / 2;
    const span = it.x1 - it.x0;
    if (span > pageWidth * 0.55 || (it.x0 < pageWidth * 0.12 && it.x1 > pageWidth * 0.7)) full.push(it);
    else if (cx < mid - 8) left.push(it);
    else right.push(it);
  }
  const byY = (a: OcrLine, b: OcrLine) => a.y0 - b.y0 || a.x0 - b.x0;
  full.sort(byY);
  left.sort(byY);
  right.sort(byY);
  const colTop = Math.min(left[0]?.y0 ?? Infinity, right[0]?.y0 ?? Infinity);
  const colBot = Math.max(left[left.length - 1]?.y1 ?? 0, right[right.length - 1]?.y1 ?? 0);
  const before = full.filter((l) => l.y1 <= colTop + 6);
  const after = full.filter((l) => l.y0 >= colBot - 6);
  const midFull = full.filter((l) => !before.includes(l) && !after.includes(l));
  const ordered = [...before, ...left, ...right, ...midFull, ...after];
  return ordered.map((l) => l.text).join("\n");
}

const OCR_HEADS: [string, string][] = [
  ["profile", "Profile"],
  ["summary", "Summary"],
  ["objective", "Objective"],
  ["education", "Education"],
  ["experience", "Experience"],
  ["skills", "Skills"],
  ["skill", "Skills"],
  ["projects", "Projects"],
  ["project", "Projects"],
  ["certifications", "Certifications"],
  ["languages", "Languages"],
  ["awards", "Awards"],
  ["achievements", "Awards"],
  ["volunteer", "Volunteer"],
];

function editDist(a: string, b: string): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 2) return 9;
  const row = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) row[j] = j;
  for (let i = 1; i <= a.length; i++) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cur = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = cur;
    }
  }
  return row[b.length];
}

function canonHeadingToken(tok: string): string | null {
  const w = tok.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length < 4) return null;
  for (const [canon, label] of OCR_HEADS) {
    if (w === canon) return label;
    const allow = canon.length >= 8 ? 2 : 1;
    if (editDist(w, canon) <= allow) return label;
  }
  return null;
}

function explodeHeadings(text: string): string {
  return text
    .split("\n")
    .flatMap((line) => {
      const parts = line.split(/\s+/).filter(Boolean);
      if (!parts.length) return [];
      const out: string[] = [];
      let buf: string[] = [];
      const flush = () => {
        if (buf.length) out.push(buf.join(" "));
        buf = [];
      };
      for (let i = 0; i < parts.length; i++) {
        if (/^work$/i.test(parts[i]) && /^experienc/i.test(parts[i + 1] || "")) {
          flush();
          out.push("Experience");
          i++;
          continue;
        }
        const head = canonHeadingToken(parts[i]);
        if (head) {
          flush();
          out.push(head);
          continue;
        }
        buf.push(parts[i]);
      }
      flush();
      return out;
    })
    .join("\n");
}

function repairOcrContact(text: string): string {
  let t = text
    .replace(/(\w)\s*[@＠]\s*(\w)/g, "$1@$2")
    .replace(/@\s*gmaill?\s*\.?\s*com\b/gi, "@gmail.com")
    .replace(/@\s*gsmail\s*\.?\s*com\b/gi, "@gmail.com")
    .replace(/@\s*([a-z0-9-]+)\s*\.\s*(com|org|net|io|pk|dev)\b/gi, "@$1.$2")
    .replace(/\b([a-z0-9._%+-]{3,})\s+gmail\.com\b/gi, "$1@gmail.com")
    .replace(/\b([a-z0-9._%+-]{3,})gmail\.com\b/gi, "$1@gmail.com")
    .replace(/\bO(3\d{2}[-\s]?\d{7})\b/g, "0$1")
    .replace(/\b(\+92|0)\s*3[\sOIl0]*(\d{2})\s*[-\s]?(\d{7})\b/g, "$13$2$3");
  if (!/[\w.+-]+@[\w-]+\.[A-Za-z]{2,}/.test(t)) {
    const packed = t.replace(/\s+/g, "");
    const mail = packed.match(/[A-Za-z0-9._%+-]{3,}@(?:gmail|yahoo|outlook|hotmail|icloud)\.com/i);
    if (mail) t = `${mail[0]}\n${t}`;
  }
  if (!/(?:\+92[-\s]?|0)3\d{2}[-\s]?\d{7}/.test(t)) {
    const digits = t.replace(/[Oo]/g, "0").replace(/[Il]/g, "1").replace(/[^\d+]/g, "");
    const pk = digits.match(/(?:92)?0?3\d{9}/);
    if (pk) {
      const n = pk[0].replace(/^92/, "0").replace(/^3/, "03");
      t = `${n}\n${t}`;
    }
  }
  return t;
}

function tidyOcrText(raw: string): string {
  return explodeHeadings(repairOcrContact(raw.replace(/\r/g, "")))
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l && !/^estimating resolution/i.test(l))
    .join("\n")
    .trim();
}

async function recognizeLaidOut(worker: Awaited<ReturnType<typeof createWorker>>, canvas: HTMLCanvasElement): Promise<string> {
  const { data } = await worker.recognize(canvas, {}, { text: true, blocks: true });
  const laid = layoutOcrLines(collectOcrLines(data), canvas.width);
  return tidyOcrText(laid || data.text || "");
}

/**
 * Resume Maker PDFs (and scans) are a full-page image with no text layer.
 * Render or decode that image and read it with OCR.
 */
export async function ocrPdfPages(
  doc: { numPages: number; getPage: (n: number) => Promise<any> },
  pdfBytes: Uint8Array,
): Promise<string> {
  const worker = await createWorker("eng", 1, { logger: () => undefined });
  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      preserve_interword_spaces: "1",
      user_defined_dpi: "220",
    });
    const pages: string[] = [];
    const limit = Math.min(doc.numPages || 1, 2);
    if (typeof document !== "undefined") {
      for (let i = 1; i <= limit; i++) {
        const page = await doc.getPage(i);
        const canvas = await renderPdfPage(page);
        let text = await recognizeLaidOut(worker, canvas);
        const stripH = Math.round(canvas.height * 0.16);
        if (stripH > 40) {
          const strip = document.createElement("canvas");
          strip.width = canvas.width;
          strip.height = stripH;
          const sctx = strip.getContext("2d");
          if (sctx) {
            sctx.drawImage(canvas, 0, 0, canvas.width, stripH, 0, 0, canvas.width, stripH);
            await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
            const top = tidyOcrText((await worker.recognize(strip)).data.text || "");
            await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
            const needMail = /@/.test(top) && !/@/.test(text);
            const needPhone = /(?:\+92|0)3\d{2}/.test(top.replace(/\s/g, "")) && !/(?:\+92|0)3\d{2}/.test(text.replace(/\s/g, ""));
            if (top && (needMail || needPhone)) {
              text = `${top}\n${text}`;
            }
          }
        }
        if (text) pages.push(text);
      }
    } else {
      for (const jpegBytes of extractPdfJpegs(pdfBytes).slice(0, limit)) {
        const image = jpegToOcrBlob(jpegBytes);
        const { data } = await worker.recognize(image as File);
        const text = tidyOcrText(data.text || "");
        if (text) pages.push(text);
      }
    }
    return pages.join("\n\n").trim();
  } finally {
    await worker.terminate();
  }
}
