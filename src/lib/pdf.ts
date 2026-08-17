import type { Resume } from "../lib/types";
import { exportStem } from "./date";
import { captureSheetJpeg, sheetPageSize } from "./captureSheet";
import { hydrateResume } from "./storage";

const PRINT_STYLE_ID = "rs-print-style";

export function applyPageStyle(size: "a4" | "letter") {
  let style = document.getElementById(PRINT_STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = PRINT_STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = `@page { size: ${size === "a4" ? "A4" : "Letter"}; margin: 0; }`;
}

const PAGE_PT = {
  a4: { w: 595.28, h: 841.89 },
  letter: { w: 612, h: 792 },
};

function jpegPdf(jpeg: Uint8Array, imgW: number, imgH: number, pageW: number, pageH: number): Uint8Array {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets = [0];
  let pos = 0;
  const push = (part: string | Uint8Array) => {
    const bytes = typeof part === "string" ? enc.encode(part) : part;
    chunks.push(bytes);
    pos += bytes.length;
  };
  const obj = (body: string | Uint8Array[]) => {
    offsets.push(pos);
    if (typeof body === "string") push(body);
    else body.forEach(push);
  };

  push("%PDF-1.4\n");
  obj("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  obj("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  obj(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW.toFixed(2)} ${pageH.toFixed(2)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`,
  );
  obj([
    enc.encode(
      `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
    ),
    jpeg,
    enc.encode("\nendstream\nendobj\n"),
  ]);
  const content = `q\n${pageW.toFixed(2)} 0 0 ${pageH.toFixed(2)} 0 0 cm\n/Im0 Do\nQ\n`;
  const contentBytes = enc.encode(content);
  obj(`5 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n${content}endstream\nendobj\n`);

  const xrefPos = pos;
  const pad = (n: number) => String(n).padStart(10, "0");
  let xref = `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) xref += `${pad(offsets[i])} 00000 n \n`;
  push(xref);
  push(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`);

  const out = new Uint8Array(pos);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.length;
  }
  return out;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function exportPdf(resume: Resume): Promise<void> {
  resume = hydrateResume(resume);
  applyPageStyle(resume.theme.pageSize);
  const sheet = document.querySelector(".resume-sheet") as HTMLElement | null;
  if (!sheet) {
    throw new Error("The proof sheet is not on screen yet. Open the proof pane, then export PDF.");
  }
  const dims = sheetPageSize(resume.theme.pageSize);
  const jpeg = await captureSheetJpeg(sheet, dims.width, dims.height);
  const page = PAGE_PT[resume.theme.pageSize === "letter" ? "letter" : "a4"];
  const bytes = jpegPdf(jpeg.data, jpeg.width, jpeg.height, page.w, page.h);
  const { attachResumePayload } = await import("./resumePayload");
  const packed = attachResumePayload(bytes, resume);
  downloadBlob(new Blob([packed], { type: "application/pdf" }), `${exportStem(resume.contact)}.pdf`);
}
