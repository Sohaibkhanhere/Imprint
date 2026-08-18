import type { Resume } from "../lib/types";
import { exportStem, cleanUrl } from "./date";
import { captureSheetJpeg, sheetPageSize } from "./captureSheet";
import { hydrateResume } from "./storage";
import { contactItems, safeHref } from "./href";
import { t } from "./safe";

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

type PdfLink = { x1: number; y1: number; x2: number; y2: number; uri: string };

function pdfEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function jpegPdf(
  pages: { jpeg: Uint8Array; imgW: number; imgH: number; links: PdfLink[] }[],
  pageW: number,
  pageH: number,
): Uint8Array {
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

  type Plan = { pageNo: number; imgNo: number; contentNo: number; annotNos: number[] };
  let next = 3;
  const plans: Plan[] = pages.map((page) => {
    const pageNo = next++;
    const imgNo = next++;
    const contentNo = next++;
    const annotNos = page.links.map(() => next++);
    return { pageNo, imgNo, contentNo, annotNos };
  });

  const kids = plans.map((p) => `${p.pageNo} 0 R`).join(" ");
  push("%PDF-1.4\n");
  obj("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  obj(`2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>\nendobj\n`);
  pages.forEach((page, i) => {
    const plan = plans[i];
    const annots =
      plan.annotNos.length > 0 ? ` /Annots [${plan.annotNos.map((n) => `${n} 0 R`).join(" ")}]` : "";
    obj(
      `${plan.pageNo} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW.toFixed(2)} ${pageH.toFixed(2)}] /Resources << /XObject << /Im0 ${plan.imgNo} 0 R >> >> /Contents ${plan.contentNo} 0 R${annots} >>\nendobj\n`,
    );
    obj([
      enc.encode(
        `${plan.imgNo} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${page.imgW} /Height ${page.imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >>\nstream\n`,
      ),
      page.jpeg,
      enc.encode("\nendstream\nendobj\n"),
    ]);
    const content = `q\n${pageW.toFixed(2)} 0 0 ${pageH.toFixed(2)} 0 0 cm\n/Im0 Do\nQ\n`;
    obj(`${plan.contentNo} 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`);
    page.links.forEach((link, j) => {
      const n = plan.annotNos[j];
      obj(
        `${n} 0 obj\n<< /Type /Annot /Subtype /Link /Rect [${link.x1.toFixed(2)} ${link.y1.toFixed(2)} ${link.x2.toFixed(2)} ${link.y2.toFixed(2)}] /Border [0 0 0] /H /I /A << /S /URI /URI (${pdfEscape(link.uri)}) >> >>\nendobj\n`,
      );
    });
  });

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

export function visibleResumeSheets(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(".resume-sheet:not(.resume-sheet-measure)")];
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

function resumeNeedles(resume: Resume): { needle: string; href: string }[] {
  const out: { needle: string; href: string }[] = [];
  const add = (needle: string, href: string | null) => {
    const text = t(needle);
    if (!text || !href || text.length < 3) return;
    if (out.some((x) => x.needle === text && x.href === href)) return;
    out.push({ needle: text, href });
  };
  const c = resume.contact;
  for (const item of contactItems(c)) add(item.text, item.href ?? null);
  add(c.email, safeHref(c.email, "email"));
  add(c.phone, safeHref(c.phone, "phone"));
  add(c.linkedin, safeHref(c.linkedin, "url"));
  add(cleanUrl(c.linkedin), safeHref(c.linkedin, "url"));
  add(c.github, safeHref(c.github, "url"));
  add(cleanUrl(c.github), safeHref(c.github, "url"));
  add(c.website, safeHref(c.website, "url"));
  add(cleanUrl(c.website), safeHref(c.website, "url"));
  add(c.portfolioUrl, safeHref(c.portfolioUrl, "url"));
  add(cleanUrl(c.portfolioUrl), safeHref(c.portfolioUrl, "url"));
  for (const p of resume.projects ?? []) {
    add(p.link, safeHref(p.link, "url"));
    add(cleanUrl(p.link), safeHref(p.link, "url"));
  }
  for (const p of resume.publications ?? []) {
    add(p.url, safeHref(p.url, "url"));
    add(cleanUrl(p.url), safeHref(p.url, "url"));
  }
  for (const r of resume.references ?? []) {
    add(r.email, safeHref(r.email, "email"));
    add(r.phone, safeHref(r.phone, "phone"));
  }
  out.sort((a, b) => b.needle.length - a.needle.length);
  return out;
}

function toPdfRect(rect: DOMRect, sheet: DOMRect, pageW: number, pageH: number): PdfLink | null {
  const left = Math.max(rect.left, sheet.left);
  const top = Math.max(rect.top, sheet.top);
  const right = Math.min(rect.right, sheet.right);
  const bottom = Math.min(rect.bottom, sheet.bottom);
  if (right - left < 3 || bottom - top < 3) return null;
  const x1 = ((left - sheet.left) / sheet.width) * pageW;
  const x2 = ((right - sheet.left) / sheet.width) * pageW;
  const yTop = ((top - sheet.top) / sheet.height) * pageH;
  const yBot = ((bottom - sheet.top) / sheet.height) * pageH;
  return { x1, y1: pageH - yBot, x2, y2: pageH - yTop, uri: "" };
}

function collectSheetLinks(sheet: HTMLElement, resume: Resume, pageW: number, pageH: number): PdfLink[] {
  const sheetRect = sheet.getBoundingClientRect();
  if (!sheetRect.width || !sheetRect.height) return [];
  const links: PdfLink[] = [];
  const push = (rect: DOMRect, uri: string) => {
    const box = toPdfRect(rect, sheetRect, pageW, pageH);
    if (!box) return;
    links.push({ ...box, uri });
  };

  for (const a of sheet.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    const uri = safeHref(a.getAttribute("href") || "");
    if (!uri) continue;
    for (const rect of [...a.getClientRects()]) push(rect, uri);
  }

  const needles = resumeNeedles(resume);
  if (!needles.length) return links;
  const walker = document.createTreeWalker(sheet, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  for (const node of nodes) {
    if (node.parentElement?.closest("a[href]")) continue;
    const text = node.data;
    if (!text.trim()) continue;
    const used = new Set<number>();
    for (const item of needles) {
      const needle = item.needle;
      let from = 0;
      const lower = text.toLowerCase();
      const find = needle.toLowerCase();
      while (from <= text.length - needle.length) {
        const at = lower.indexOf(find, from);
        if (at < 0) break;
        let overlap = false;
        for (let i = at; i < at + needle.length; i++) {
          if (used.has(i)) {
            overlap = true;
            break;
          }
        }
        if (!overlap) {
          try {
            const range = document.createRange();
            range.setStart(node, at);
            range.setEnd(node, at + needle.length);
            for (const rect of [...range.getClientRects()]) push(rect, item.href);
            for (let i = at; i < at + needle.length; i++) used.add(i);
          } catch {
            /* ignore */
          }
        }
        from = at + needle.length;
      }
    }
  }
  return links;
}

export async function exportPdf(resume: Resume): Promise<void> {
  resume = hydrateResume(resume);
  applyPageStyle(resume.theme.pageSize);
  const sheets = visibleResumeSheets();
  if (!sheets.length) {
    throw new Error("The proof sheet is not on screen yet. Open the proof pane, then export PDF.");
  }
  const dims = sheetPageSize(resume.theme.pageSize);
  const page = PAGE_PT[resume.theme.pageSize === "letter" ? "letter" : "a4"];
  const images = [];
  for (const sheet of sheets) {
    const links = collectSheetLinks(sheet, resume, page.w, page.h);
    const jpeg = await captureSheetJpeg(sheet, dims.width, dims.height);
    images.push({ jpeg: jpeg.data, imgW: jpeg.width, imgH: jpeg.height, links });
  }
  const bytes = jpegPdf(images, page.w, page.h);
  const { attachResumePayload } = await import("./resumePayload");
  const packed = attachResumePayload(bytes, resume);
  downloadBlob(new Blob([packed], { type: "application/pdf" }), `${exportStem(resume.contact)}.pdf`);
}
