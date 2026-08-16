import {
  AlignmentType,
  BorderStyle,
  Document,
  HorizontalPositionRelativeFrom,
  ImageRun,
  Packer,
  Paragraph,
  TabStopType,
  TextRun,
  TextWrappingType,
  VerticalPositionRelativeFrom,
} from "docx";
import type { Resume } from "./types";
import { formatRange, exportStem, cleanUrl } from "./date";
import { effectiveSections, headingFor, citePublication, PAGE_DIMS } from "../templates/shared";
import { coerceResume } from "./coerceResume";
import { t } from "./safe";

export { Packer };

const SERIF = "Times New Roman";

const PAGE_TWIPS: Record<Resume["theme"]["pageSize"], { width: number; height: number }> = {
  a4: { width: 11906, height: 16838 },
  letter: { width: 12240, height: 15840 },
};

const MARGIN = 1080;

function hex(c: string): string {
  return c.replace(/^#/, "").toUpperCase();
}

function tabRun(right: number, children: TextRun[]): Paragraph {
  return new Paragraph({ tabStops: [{ type: TabStopType.RIGHT, position: right }], children });
}

function cleanText(s: string): string {
  return t(s).replace(/\u2019/g, "'");
}

function contactLine(resume: Resume): string {
  const c = resume.contact;
  const parts: string[] = [];
  if (t(c.phone)) parts.push(t(c.phone));
  if (t(c.email)) parts.push(t(c.email));
  const loc = [t(c.city), t(c.country)].filter(Boolean).join(", ");
  if (loc) parts.push(loc);
  if (t(c.linkedin)) parts.push(cleanUrl(c.linkedin));
  if (t(c.github)) parts.push(cleanUrl(c.github));
  if (t(c.website)) parts.push(cleanUrl(c.website));
  return parts.join("  ·  ");
}

function sectionHeading(text: string, accent: string): Paragraph {
  return new Paragraph({
    spacing: { before: 280, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 8, color: hex(accent), space: 4 },
    },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 18, color: hex(accent), characterSpacing: 40 })],
  });
}

function entryRole(role: string, dates: string, right: number): Paragraph {
  return tabRun(right, [
    new TextRun({ text: role, bold: true, size: 22 }),
    new TextRun({ text: "\t" + dates, size: 20, color: "5C574D" }),
  ]);
}

function entryOrg(org: string, loc?: string): Paragraph {
  const runs: TextRun[] = [];
  if (org.trim()) runs.push(new TextRun({ text: org, italics: true, size: 21, color: "3A362F" }));
  if (loc?.trim()) runs.push(new TextRun({ text: (runs.length ? "  ·  " : "") + loc, size: 20, color: "5C574D" }));
  return new Paragraph({ spacing: { after: 60 }, children: runs.length ? runs : [] });
}

function bullets(items: string[]): Paragraph[] {
  return (items ?? [])
    .map((b) => t(b))
    .filter(Boolean)
    .map(
      (b) =>
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 40 },
          children: [new TextRun({ text: cleanText(b), size: 21 })],
        }),
    );
}

function buildSections(resume: Resume, accent: string, right: number): (Paragraph | null)[] {
  const out: (Paragraph | null)[] = [];
  for (const key of effectiveSections(resume)) {
    out.push(sectionHeading(headingFor(key, resume), accent));
    switch (key) {
      case "summary":
        out.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: cleanText(resume.summary), size: 21 })] }));
        break;
      case "objective":
        out.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: cleanText(resume.objective), size: 21 })] }));
        break;
      case "experience":
        resume.experience.forEach((j) => {
          out.push(entryRole(j.role || j.company, formatRange(j.startDate, j.endDate, j.present), right));
          out.push(entryOrg(j.company, j.location));
          out.push(...bullets(j.bullets));
        });
        break;
      case "education":
        resume.education.forEach((e) => {
          const deg = [e.degree.trim(), e.field.trim()].filter(Boolean).join(", ");
          out.push(entryRole(deg || e.institution, formatRange(e.startDate, e.endDate, false), right));
          out.push(entryOrg(e.institution, e.location));
          const extras = [e.gpa.trim() ? "GPA " + e.gpa.trim() : "", e.honors.trim()].filter(Boolean);
          if (extras.length) out.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: extras.join("  ·  "), size: 20, color: "5C574D" })] }));
          if (e.thesis.trim()) out.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "Thesis: " + e.thesis.trim(), size: 20, color: "5C574D" })] }));
        });
        break;
      case "skills":
        resume.skills.forEach((g) => {
          const list = g.skills.filter((s) => s.trim()).map((s) => s.trim());
          if (!list.length) return;
          out.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [new TextRun({ text: (g.name ? g.name + ": " : "") + list.join(", "), size: 21 })],
            }),
          );
        });
        break;
      case "projects":
        resume.projects.forEach((p) => {
          out.push(entryRole(p.name, "", right));
          const desc: TextRun[] = [];
          if (p.tech.trim()) desc.push(new TextRun({ text: p.tech.trim(), italics: true, size: 20, color: "5C574D" }));
          if (p.link.trim()) desc.push(new TextRun({ text: (desc.length ? "  ·  " : "") + cleanUrl(p.link), size: 20, color: "4A463E" }));
          if (desc.length) out.push(new Paragraph({ spacing: { after: 40 }, children: desc }));
          if (p.description.trim()) out.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: cleanText(p.description), size: 21 })] }));
        });
        break;
      case "certifications":
        resume.certifications.forEach((c) => {
          const parts = [c.name.trim(), c.issuer.trim(), c.year.trim()].filter(Boolean);
          out.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: parts.join("  ·  "), size: 21 })] }));
        });
        break;
      case "languages":
        resume.languages.forEach((l) => {
          out.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [new TextRun({ text: l.name.trim() }), new TextRun({ text: l.level ? "  ·  " + l.level : "", size: 20, color: "5C574D" })],
            }),
          );
        });
        break;
      case "volunteer":
        resume.volunteer.forEach((v) => {
          out.push(entryRole(v.title || v.org, formatRange(v.startDate, v.endDate, v.present), right));
          out.push(entryOrg(v.org, v.location));
          out.push(...bullets(v.bullets));
        });
        break;
      case "publications":
        resume.publications.forEach((p) => {
          out.push(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: citePublication(p, resume.theme?.citationFormat ?? "apa"), size: 21 })] }));
        });
        break;
      case "awards":
        resume.awards.forEach((a) => {
          out.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [
                new TextRun({ text: a.title.trim(), bold: true, size: 21 }),
                new TextRun({ text: "  ·  " + [a.org.trim(), a.year.trim()].filter(Boolean).join(", "), size: 20, color: "5C574D" }),
              ],
            }),
          );
        });
        break;
      case "teaching":
        resume.teaching.forEach((t) => {
          out.push(entryRole(t.role || t.course, formatRange(t.startDate, t.endDate, false), right));
          out.push(entryOrg(t.institution, t.location));
          out.push(...bullets(t.bullets));
        });
        break;
      case "grants":
        resume.grants.forEach((g) => {
          const amt = g.amount.trim() ? (g.amount.trim().match(/^\d/) ? "$" + g.amount.trim() : g.amount.trim()) : "";
          out.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [
                new TextRun({ text: g.name.trim(), bold: true, size: 21 }),
                new TextRun({ text: "  ·  " + [g.funder.trim(), amt, g.year.trim()].filter(Boolean).join(", "), size: 20, color: "5C574D" }),
              ],
            }),
          );
          if (g.description.trim()) out.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: cleanText(g.description), size: 20, color: "3A362F" })] }));
        });
        break;
      case "presentations":
        resume.presentations.forEach((p) => {
          out.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [
                new TextRun({ text: p.title.trim(), italics: true, size: 21 }),
                new TextRun({ text: "  ·  " + [p.event.trim(), p.year.trim(), p.location.trim()].filter(Boolean).join(", "), size: 20, color: "5C574D" }),
              ],
            }),
          );
        });
        break;
      case "affiliations":
        resume.affiliations.forEach((a) => {
          out.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [
                new TextRun({ text: a.name.trim() }),
                new TextRun({ text: "  ·  " + [a.role.trim(), a.years.trim()].filter(Boolean).join(", "), size: 20, color: "5C574D" }),
              ],
            }),
          );
        });
        break;
      case "references":
        resume.references.forEach((r) => {
          out.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [
                new TextRun({ text: r.name.trim(), bold: true, size: 21 }),
                new TextRun({ text: "  ·  " + [r.title.trim(), r.org.trim(), r.email.trim(), r.phone.trim()].filter(Boolean).join(", "), size: 20, color: "5C574D" }),
              ],
            }),
          );
        });
        break;
      case "portfolio":
        out.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: cleanUrl(resume.contact.portfolioUrl), size: 21 })] }));
        break;
      case "extras":
        (resume.extras ?? [])
          .filter((d) => t(d.label) && t(d.value))
          .forEach((d) => {
            out.push(
              new Paragraph({
                spacing: { after: 40 },
                children: [
                  new TextRun({ text: t(d.label) + ": ", bold: true, size: 21 }),
                  new TextRun({ text: t(d.value), size: 21 }),
                ],
              }),
            );
          });
        break;
      default:
        break;
    }
  }
  return out;
}

export function buildResumeDocx(resume: Resume): Document {
  resume = coerceResume(resume);
  const theme = resume.theme;
  const page = PAGE_TWIPS[theme?.pageSize] ?? PAGE_TWIPS.a4;
  const right = page.width - MARGIN * 2;
  const c = resume.contact;
  const accent = hex(theme?.accent || "#1d2130");

  const header: Paragraph[] = [];
  if (t(c.fullName)) {
    header.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [new TextRun({ text: t(c.fullName), bold: true, size: 44 })],
      }),
    );
  }
  if (t(c.title)) {
    header.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [new TextRun({ text: t(c.title).toUpperCase(), size: 20, color: accent, characterSpacing: 60 })],
      }),
    );
  }
  const contact = contactLine(resume);
  if (contact) {
    header.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: contact, size: 20, color: "4A463E" })] }));
  }

  const body = header.concat(...buildSections(resume, accent, right).filter((p): p is Paragraph => p !== null));

  return new Document({
    styles: {
      default: {
        document: {
          run: { font: SERIF, size: 22, color: "23211C" },
          paragraph: { spacing: { line: 260, after: 60 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: { size: { width: page.width, height: page.height }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } },
        },
        children: body,
      },
    ],
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        window.clearTimeout(timer);
        reject(err);
      },
    );
  });
}

function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  return Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          }),
    ),
  ).then(() => undefined);
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not encode the Word page image."));
        return;
      }
      void blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)), reject);
    }, "image/png");
  });
}

async function captureSheetPages(sheet: HTMLElement, pageW: number, pageH: number): Promise<Uint8Array[]> {
  const host = document.createElement("div");
  host.setAttribute("data-docx-capture", "true");
  host.style.cssText = "position:absolute;left:-200vw;top:0;pointer-events:none;";
  const clone = sheet.cloneNode(true) as HTMLElement;
  clone.style.transform = "none";
  clone.style.width = `${pageW}px`;
  clone.style.maxWidth = `${pageW}px`;
  clone.style.height = `${pageH}px`;
  clone.style.minHeight = `${pageH}px`;
  clone.style.maxHeight = `${pageH}px`;
  clone.style.overflow = "hidden";
  clone.style.margin = "0";
  clone.style.boxShadow = "none";
  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    await document.fonts.ready;
    await waitForImages(clone);
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

    const { toCanvas } = await import("html-to-image");
    const source = await withTimeout(
      toCanvas(clone, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
        skipAutoScale: true,
        width: pageW,
        height: pageH,
        canvasWidth: Math.round(pageW * 2),
        canvasHeight: Math.round(pageH * 2),
        style: { transform: "none", width: `${pageW}px`, height: `${pageH}px`, overflow: "hidden" },
        filter: (node) => !node.classList?.contains("no-print"),
        onImageErrorHandler: () => undefined,
      }),
      20000,
      "Word export timed out while capturing the proof sheet.",
    );

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = Math.round(pageW * 2);
    pageCanvas.height = Math.round(pageH * 2);
    const ctx = pageCanvas.getContext("2d");
    if (!ctx) throw new Error("Could not draw Word pages.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(source, 0, 0, pageCanvas.width, pageCanvas.height);
    return [await canvasToPng(pageCanvas)];
  } finally {
    host.remove();
  }
}

function buildVisualDocx(resume: Resume, pngPages: Uint8Array[]): Document {
  const theme = resume.theme;
  const page = PAGE_TWIPS[theme?.pageSize] ?? PAGE_TWIPS.a4;
  const dims = PAGE_DIMS[theme?.pageSize] ?? PAGE_DIMS.a4;
  const imgW = Math.floor(dims.width);
  const imgH = Math.floor(dims.height);
  const name = t(resume.contact?.fullName) || "Resume";

  return new Document({
    title: exportStem(resume.contact),
    sections: pngPages.map((data, i) => ({
      properties: {
        page: {
          size: { width: page.width, height: page.height },
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
        },
      },
      children: [
        new Paragraph({
          spacing: { before: 0, after: 0 },
          children: [
            new ImageRun({
              type: "png",
              data,
              transformation: { width: imgW, height: imgH },
              floating: {
                horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 0 },
                verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: 0 },
                wrap: { type: TextWrappingType.NONE },
                behindDocument: false,
                allowOverlap: true,
              },
              altText: { title: name, description: `${name} page ${i + 1}`, name },
            }),
          ],
        }),
      ],
    })),
  });
}

export async function exportDocx(resume: Resume): Promise<void> {
  resume = coerceResume(resume);
  const sheet = document.querySelector(".resume-sheet") as HTMLElement | null;
  if (!sheet) {
    throw new Error("The proof sheet is not on screen yet. Open the proof pane, then export Word.");
  }

  const dims = PAGE_DIMS[resume.theme?.pageSize] ?? PAGE_DIMS.a4;
  const pngPages = await captureSheetPages(sheet, dims.width, dims.height);
  if (!pngPages.length) throw new Error("Could not capture the resume for Word export.");

  const doc = buildVisualDocx(resume, pngPages);
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = exportStem(resume.contact) + ".docx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
