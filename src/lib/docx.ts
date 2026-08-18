import {
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  TabStopType,
  TextRun,
} from "docx";
import type { Resume } from "./types";
import { formatRange, exportStem, cleanUrl } from "./date";
import { effectiveSections, headingFor, citePublication } from "../templates/shared";
import { hydrateResume } from "./storage";
import { t } from "./safe";
import { marginsForTheme, mmToTwip } from "./pageLayout";

export { Packer };

const FONT = "Arial";

const PAGE_TWIPS: Record<Resume["theme"]["pageSize"], { width: number; height: number }> = {
  a4: { width: 11906, height: 16838 },
  letter: { width: 12240, height: 15840 },
};

function hex(c: string): string {
  const m = c.replace(/^#/, "").toUpperCase();
  if (/^[0-9A-F]{6}$/.test(m)) return m;
  if (/^[0-9A-F]{3}$/.test(m)) return `${m[0]}${m[0]}${m[1]}${m[1]}${m[2]}${m[2]}`;
  return "1D2130";
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
  return parts.join(" | ");
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

function entryOrg(org: string, loc?: string): Paragraph | null {
  const runs: TextRun[] = [];
  if (org.trim()) runs.push(new TextRun({ text: org, italics: true, size: 21, color: "3A362F" }));
  if (loc?.trim()) runs.push(new TextRun({ text: (runs.length ? "  |  " : "") + loc, size: 20, color: "5C574D" }));
  if (!runs.length) return null;
  return new Paragraph({ spacing: { after: 60 }, children: runs });
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
          out.push(entryOrg(j.company && j.role && j.company.toLowerCase() !== j.role.toLowerCase() ? j.company : "", j.location));
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
  resume = hydrateResume(resume);
  const theme = resume.theme;
  const page = PAGE_TWIPS[theme?.pageSize] ?? PAGE_TWIPS.a4;
  const m = marginsForTheme(theme);
  const margin = {
    top: mmToTwip(m.top),
    right: mmToTwip(m.right),
    bottom: mmToTwip(m.bottom),
    left: mmToTwip(m.left),
  };
  const right = page.width - margin.left - margin.right;
  const c = resume.contact;
  const accent = hex(theme?.accent || "#1d2130");

  const header: Paragraph[] = [];
  if (t(c.fullName)) {
    header.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({ text: t(c.fullName), bold: true, size: 44, font: FONT })],
      }),
    );
  }
  if (t(c.title)) {
    header.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: t(c.title), size: 22, color: accent, font: FONT })],
      }),
    );
  }
  const contact = contactLine(resume);
  if (contact) {
    header.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: contact, size: 20, color: "4A463E", font: FONT })] }));
  }

  const body = header.concat(...buildSections(resume, accent, right).filter((p): p is Paragraph => p !== null));

  return new Document({
    title: exportStem(resume.contact),
    styles: {
      default: {
        document: {
          run: { font: FONT, size: 22, color: "23211C" },
          paragraph: { spacing: { line: 260, after: 60 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: { size: { width: page.width, height: page.height }, margin },
        },
        children: body,
      },
    ],
  });
}

export async function exportDocx(resume: Resume): Promise<void> {
  resume = hydrateResume(resume);
  const doc = buildResumeDocx(resume);
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
