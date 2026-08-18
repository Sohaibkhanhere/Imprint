import type { Resume } from "./types";
import { hydrateResume } from "./storage";
import { formatRange } from "./date";

const START = "%QD-RESUME-1";
const END = "%QD-RESUME-END";

function bytesToBase64(bytes: Uint8Array): string {
  const chunk = 0x8000;
  let bin = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64.replace(/\s+/g, ""));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function attachResumePayload(pdf: Uint8Array, resume: Resume): Uint8Array {
  const json = JSON.stringify(resume);
  const b64 = bytesToBase64(new TextEncoder().encode(json));
  const wrapped = b64.match(/.{1,76}/g)?.join("\n") ?? b64;
  const extra = new TextEncoder().encode(`\n${START}\n${wrapped}\n${END}\n`);
  const out = new Uint8Array(pdf.length + extra.length);
  out.set(pdf);
  out.set(extra, pdf.length);
  return out;
}

export function readResumePayload(pdf: Uint8Array): Resume | null {
  const ascii = new TextDecoder("latin1").decode(pdf);
  const from = ascii.lastIndexOf(START);
  const to = ascii.lastIndexOf(END);
  if (from < 0 || to < 0 || to <= from) return null;
  const b64 = ascii.slice(from + START.length, to).replace(/[^A-Za-z0-9+/=]/g, "");
  if (b64.length < 16) return null;
  try {
    const json = new TextDecoder().decode(base64ToBytes(b64));
    const parsed = JSON.parse(json) as unknown;
    const resume = hydrateResume(parsed);
    if (!(resume.contact.fullName || "").trim() && !(resume.summary || "").trim() && resume.experience.length === 0) {
      return null;
    }
    return resume;
  } catch {
    return null;
  }
}

export function resumeToLabeledText(resume: Resume): string {
  const c = resume.contact;
  const lines: string[] = [];
  const push = (...xs: string[]) => {
    for (const x of xs) {
      const t = (x || "").replace(/\s+/g, " ").trim();
      if (t) lines.push(t);
    }
  };

  push(c.fullName, c.title, c.phone, c.email);
  push([c.city, c.country].filter(Boolean).join(", "));
  push(c.linkedin, c.website, c.github, c.portfolioUrl);
  for (const s of c.socials ?? []) push(s.label, s.url);

  const blurb = resume.useObjective ? resume.objective : resume.summary;
  if (blurb.trim()) {
    push(resume.useObjective ? "Objective" : "Summary");
    push(blurb);
  }

  if (resume.experience.length) {
    push("Experience");
    for (const j of resume.experience) {
      const dates = formatRange(j.startDate, j.endDate, j.present);
      push([j.role, j.company, dates].filter(Boolean).join(" | "));
      if (j.location) push(j.location);
      if (j.descriptor) push(j.descriptor);
      for (const b of j.bullets ?? []) push(`• ${b}`);
    }
  }

  if (resume.education.length) {
    push("Education");
    for (const e of resume.education) {
      push([e.degree, e.field].filter(Boolean).join(" "));
      push([e.institution, formatRange(e.startDate, e.endDate, false)].filter(Boolean).join(" | "));
      if (e.location) push(e.location);
      if (e.gpa) push(`GPA ${e.gpa}`);
    }
  }

  if (resume.skills.some((g) => (g.skills ?? []).length)) {
    push("Skills");
    for (const g of resume.skills) {
      const items = (g.skills ?? []).filter(Boolean);
      if (!items.length) continue;
      push(g.name ? `${g.name}: ${items.join(", ")}` : items.join(", "));
    }
  }

  if (resume.projects.length) {
    push("Projects");
    for (const p of resume.projects) {
      push(p.name);
      if (p.description) push(p.description);
      if (p.tech) push(p.tech);
      if (p.link) push(p.link);
    }
  }

  if (resume.certifications.length) {
    push("Certifications");
    for (const x of resume.certifications) push([x.name, x.issuer, x.year].filter(Boolean).join(" | "));
  }

  if (resume.languages.length) {
    push("Languages");
    for (const x of resume.languages) push([x.name, x.level].filter(Boolean).join(" — "));
  }

  if (resume.awards.length) {
    push("Awards");
    for (const x of resume.awards) push([x.title, x.org, x.year].filter(Boolean).join(" | "));
  }

  if (resume.volunteer.length) {
    push("Volunteer");
    for (const v of resume.volunteer) {
      push([v.title, v.org, formatRange(v.startDate, v.endDate, v.present)].filter(Boolean).join(" | "));
      for (const b of v.bullets ?? []) push(`• ${b}`);
    }
  }

  return lines.join("\n");
}
