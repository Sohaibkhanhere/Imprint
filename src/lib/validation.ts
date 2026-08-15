import type { Resume } from "./types";
import { FIRST_PERSON, VAGUE_WORDS, WEAK_STARTERS, allVerbs, BANNED_PHRASES } from "./verbs";
import { t } from "./safe";

export type IssueSeverity = "error" | "warning" | "info";

export interface HealthIssue {
  id: string;
  severity: IssueSeverity;
  section: string;
  message: string;
  hint?: string;
}

function countWords(s: string): number {
  return t(s).split(/\s+/).filter(Boolean).length;
}

function hasNumber(s: string): boolean {
  return /\d/.test(s);
}

function parseMonth(v: string): { y: number; m: number } | null {
  const m = /(\d{4})-(\d{2})/.exec(v);
  if (m) return { y: +m[1], m: +m[2] };
  const y = /(\d{4})/.exec(v);
  if (y) return { y: +y[1], m: 1 };
  return null;
}

export function runHealthChecks(r: Resume, pageCount: number): HealthIssue[] {
  const issues: HealthIssue[] = [];

  if (!t(r.contact?.fullName)) issues.push({ id: "c1", severity: "warning", section: "Contact", message: "Full name is missing.", hint: "Your name appears at the top of every template." });
  if (!t(r.contact?.phone)) issues.push({ id: "c2", severity: "error", section: "Contact", message: "Phone number is missing.", hint: "Recruiters expect a direct phone number." });
  if (!t(r.contact?.email)) issues.push({ id: "c3", severity: "error", section: "Contact", message: "Email address is missing." });
  if (t(r.contact?.email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t(r.contact.email))) issues.push({ id: "c4", severity: "error", section: "Contact", message: "Email address doesn't look valid." });

  const summaryIsEmpty = r.useObjective ? !t(r.objective) : !t(r.summary);
  if (summaryIsEmpty) issues.push({ id: "s1", severity: "error", section: "Summary", message: r.useObjective ? "Objective is empty." : "Professional summary is empty.", hint: "2–4 sentences: who you are, years of experience, top strengths." });
  else {
    const words = countWords(r.useObjective ? r.objective : r.summary);
    if (words > 60) issues.push({ id: "s2", severity: "warning", section: "Summary", message: "Summary is long (" + words + " words).", hint: "Keep it 2–4 sentences, roughly 30–55 words." });
  }

  let verbTally = new Map<string, number>();
  let quantifiedCount = 0;
  let bulletTotal = 0;

  for (const job of r.experience ?? []) {
    if (!t(job.role) && !t(job.company)) continue;
    if (!(job.bullets ?? []).length) issues.push({ id: "e0-" + job.id, severity: "error", section: "Experience", message: "\u201c" + (job.role || "Untitled role") + "\u201d has no bullet points.", hint: "Add 3–5 achievement-focused bullets using the bullet formula." });
    for (const b of job.bullets ?? []) {
      bulletTotal++;
      const wc = countWords(b);
      if (wc > 25) issues.push({ id: "e1-" + job.id, severity: "warning", section: "Experience", message: "A bullet in \u201c" + (job.role || job.company) + "\u201d is " + wc + " words.", hint: "Keep bullets to 1–2 lines (about 12–22 words)." });
      const lower = b.toLowerCase();
      for (const w of WEAK_STARTERS) {
        if (new RegExp(`^${w}\\b`).test(lower)) {
          issues.push({ id: "e2-" + job.id, severity: "warning", section: "Experience", message: "A bullet starts with a weak phrase (\u201c" + w + "\u201d).", hint: "Lead with a strong action verb instead." });
          break;
        }
      }
      if (FIRST_PERSON.test(b)) issues.push({ id: "e3-" + job.id, severity: "warning", section: "Experience", message: "A bullet uses a first-person pronoun (I/my/me).", hint: "Resumes are written in implied first person — drop the pronoun." });
      if (hasNumber(b)) quantifiedCount++;
      const verb = allVerbs().find((v) => new RegExp(`^${v}\\b`, "i").test(t(b)));
      if (!verb) continue;
      verbTally.set(verb, (verbTally.get(verb) ?? 0) + 1);
      if (verbTally.get(verb)! >= 3) issues.push({ id: "e4-" + job.id, severity: "warning", section: "Experience", message: "\u201c" + verb + "\u201d is used 3+ times across the resume.", hint: "Vary your verbs from the action-verb bank." });
    }
  }

  if (bulletTotal > 0 && quantifiedCount === 0) issues.push({ id: "e5", severity: "warning", section: "Experience", message: "No work-experience bullet contains a number.", hint: "Quantify at least 2–3 bullets (%, $, time saved, volume)." });
  else if (bulletTotal > 0 && quantifiedCount / bulletTotal < 0.5) issues.push({ id: "e6", severity: "info", section: "Experience", message: "Fewer than half of bullets are quantified (" + quantifiedCount + "/" + bulletTotal + ").", hint: "Aim for 50%+ with numbers or scope indicators." });

  const skillCount = (r.skills ?? []).reduce((n, g) => n + (g.skills ?? []).length, 0);
  if (skillCount < 5) issues.push({ id: "k1", severity: "warning", section: "Skills", message: "Only " + skillCount + " skills listed.", hint: "Aim for 8–15 skills." });
  if (skillCount > 20) issues.push({ id: "k2", severity: "info", section: "Skills", message: skillCount + " skills listed.", hint: "Trim to the 8–15 most relevant; group them if over 10." });

  if ((r.education ?? []).length > 0) {
    for (const e of r.education) {
      if (e.gpa && parseFloat(e.gpa) > 0 && parseFloat(e.gpa) < 3.5) issues.push({ id: "d1", severity: "info", section: "Education", message: "GPA " + e.gpa + " is below 3.5.", hint: "Consider dropping GPA unless it's a strength (3.5+)." });
    }
  }

  const gaps = dateGaps(r);
  for (const g of gaps) {
    issues.push({ id: "gap-" + g.from + "-" + g.to, severity: "info", section: "Experience", message: "Employment gap of " + g.months + " months between " + g.from + " and " + g.to + ".", hint: "Address briefly: freelance work, study, or consider the functional format." });
  }

  for (const p of r.publications ?? []) {
    if (!t(p.title) || !t(p.venue)) issues.push({ id: "pub-" + p.id, severity: "warning", section: "Publications", message: "A publication is missing its title or venue." });
  }

  const { photoUrl: _photo, ...contactRest } = r.contact ?? {};
  const text = JSON.stringify({ ...r, contact: { ...contactRest, photoUrl: "" } }).toLowerCase();
  for (const bp of BANNED_PHRASES) {
    if (text.includes(bp)) issues.push({ id: "ban-" + bp, severity: "info", section: "General", message: "\u201cReferences available upon request\u201d is outdated.", hint: "Omit it — list named references or nothing." });
  }
  for (const w of VAGUE_WORDS) {
    if (text.includes(w)) issues.push({ id: "vague-" + w, severity: "info", section: "General", message: "Vague filler detected: \u201c" + w + "\u201d.", hint: "Replace with concrete evidence or remove." });
  }

  const maxPages = r.theme?.maxPages ?? 1;
  if (r.meta?.type !== "cv" && r.meta?.type !== "executive" && pageCount > maxPages) {
    issues.push({ id: "pg1", severity: "error", section: "General", message: "Resume is " + pageCount + " page(s).", hint: "This type should fit " + maxPages + " page" + (maxPages > 1 ? "s" : "") + ". Tighten spacing, trim older bullets, or reduce content." });
  } else if (pageCount > 2) {
    issues.push({ id: "pg2", severity: "warning", section: "General", message: "Resume is " + pageCount + " pages.", hint: "Even for CV/executive, aim for a tight, complete document." });
  }

  return issues;
}

function dateGaps(r: Resume): { from: string; to: string; months: number }[] {
  const jobs = (r.experience ?? [])
    .filter((j) => t(j.role) || t(j.company))
    .map((j) => ({ start: j.startDate, end: j.present ? null : j.endDate, label: j.role || j.company }));
  const ordered = jobs
    .filter((j) => j.start && parseMonth(j.start))
    .sort((a, b) => {
      const pa = parseMonth(a.start)!;
      const pb = parseMonth(b.start)!;
      return pa.y - pb.y || pa.m - pb.m;
    });

  const out: { from: string; to: string; months: number }[] = [];
  for (let i = 0; i < ordered.length - 1; i++) {
    const cur = ordered[i];
    const next = ordered[i + 1];
    if (!cur.end) continue;
    const end = parseMonth(cur.end);
    const startNext = parseMonth(next.start);
    if (!end || !startNext) continue;
    const gap = startNext.y * 12 + (startNext.m ?? 1) - (end.y * 12 + (end.m ?? 1));
    if (gap >= 6) out.push({ from: cur.end, to: next.start, months: gap });
  }
  return out;
}

export function computeScore(issues: HealthIssue[]): number {
  const weights: Record<IssueSeverity, number> = { error: 12, warning: 6, info: 2 };
  const penalty = issues.reduce((n, i) => n + weights[i.severity], 0);
  return Math.max(20, Math.min(100, 100 - penalty));
}
