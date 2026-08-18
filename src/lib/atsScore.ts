import type { Resume, SectionKey, VisibilityKey } from "./types";
import { FIRST_PERSON, BANNED_PHRASES, VERB_BANK, WEAK_STARTERS } from "./verbs";
import { t } from "./safe";
import { cleanUrl } from "./date";
import { tailorResume } from "./jdTailor";
import { improveBullet } from "./improveBullet";
import { getTemplate, themePatchForAtsSafe } from "../templates/registry";

export interface AtsCheck {
  id: string;
  label: string;
  hint: string;
  pass: boolean;
  weight: number;
  auto: boolean;
}

const PII_RE = /\b(cnic|nic|b-?form|father|date of birth|d\.?o\.?b\.?|marital|religion|passport|gender|blood group|national id|nationality)\b/i;
const RATING_FIND = /[●○■□★☆▪▫◉◎]|\(\s*\d+\s*\/\s*\d+\s*\)/;
const RATING_ALL = /[●○■□★☆▪▫◉◎]|\(\s*\d+\s*\/\s*\d+\s*\)/g;
const ATS_WEAK = [
  "responsible for",
  "duties included",
  "duties include",
  "was involved in",
  "was responsible for",
  "in charge of",
  "tasked with",
  "participated in",
];

function yearOf(v: string): number {
  const m = /(19|20)\d{2}/.exec(t(v));
  return m ? Number(m[0]) : 0;
}

function jobBullets(r: Resume): string[] {
  return (r.experience ?? []).flatMap((j) => (j.bullets ?? []).map((b) => t(b)).filter(Boolean));
}

export function isPiiLabel(label: string): boolean {
  return PII_RE.test(t(label));
}

export function hasSkillRatings(r: Resume): boolean {
  return (r.skills ?? []).some((g) => (g.skills ?? []).some((s) => RATING_FIND.test(s)));
}

export function isReverseChrono(r: Resume): boolean {
  const jobs = (r.experience ?? []).filter((j) => t(j.role) || t(j.company));
  if (jobs.length < 2) return true;
  const keys = jobs.map((j) => (j.present ? 9999 : yearOf(j.endDate) || yearOf(j.startDate)));
  for (let i = 0; i < keys.length - 1; i++) {
    if (keys[i] && keys[i + 1] && keys[i] < keys[i + 1]) return false;
  }
  return true;
}

export function atsChecks(r: Resume): AtsCheck[] {
  const c = r.contact ?? {};
  const email = t(c.email);
  const jobs = (r.experience ?? []).filter((j) => t(j.role) || t(j.company));
  const bullets = jobBullets(r);
  const skillCount = (r.skills ?? []).reduce((n, g) => n + (g.skills ?? []).filter((s) => t(s) && !RATING_FIND.test(s)).length, 0);
  const hasEdu = (r.education ?? []).some((e) => t(e.institution) || t(e.degree));
  const hasCert = (r.certifications ?? []).some((x) => t(x.name));
  const summary = t(r.useObjective ? r.objective : r.summary);
  const summaryWords = summary.split(/\s+/).filter(Boolean).length;
  const hasDates = jobs.every((j) => t(j.startDate) || t(j.endDate) || j.present);
  const quantified = bullets.filter((b) => /\d/.test(b)).length;
  const firstPerson = [summary, ...bullets].some((b) => FIRST_PERSON.test(b));
  const blob = JSON.stringify({ summary: r.summary, objective: r.objective, bullets }).toLowerCase();
  const banned = BANNED_PHRASES.some((p) => blob.includes(p));
  const extrasOn = r.visibility?.extras !== false;
  const pii = extrasOn && (r.extras ?? []).some((e) => isPiiLabel(e.label) && t(e.value));
  const vis = r.visibility ?? {};
  const coreHidden =
    (jobs.length > 0 && vis.experience === false) ||
    ((hasEdu || hasCert) && vis.education === false) ||
    (skillCount > 0 && vis.skills === false);

  return [
    {
      id: "name",
      label: "Full name as text",
      hint: "ATS reads the name field, not a photo.",
      pass: t(c.fullName).length >= 2,
      weight: 8,
      auto: false,
    },
    {
      id: "email",
      label: "Professional email",
      hint: "Use a valid email with no extra spaces.",
      pass: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      weight: 10,
      auto: true,
    },
    {
      id: "phone",
      label: "Phone with country code",
      hint: "Include a direct number ATS can store.",
      pass: t(c.phone).replace(/\D/g, "").length >= 7,
      weight: 8,
      auto: true,
    },
    {
      id: "location",
      label: "City and country",
      hint: "City + country is the international contact standard. Skip street address.",
      pass: t(c.city).length >= 2 && t(c.country).length >= 2,
      weight: 6,
      auto: false,
    },
    {
      id: "summary",
      label: "Professional summary",
      hint: "2 to 4 sentences (about 30 to 55 words) with role keywords.",
      pass: summaryWords >= 18 && summaryWords <= 70,
      weight: 8,
      auto: true,
    },
    {
      id: "job",
      label: "Job title and company",
      hint: "Each role needs a title and company name as text, not abbreviations only.",
      pass: jobs.some((j) => t(j.role) && t(j.company)),
      weight: 10,
      auto: false,
    },
    {
      id: "dates",
      label: "Start and end dates",
      hint: "Every job needs dates, or Present, so ATS can order your history.",
      pass: jobs.length > 0 && hasDates,
      weight: 8,
      auto: false,
    },
    {
      id: "chrono",
      label: "Newest role first",
      hint: "International ATS expects reverse-chronological work history.",
      pass: isReverseChrono(r),
      weight: 4,
      auto: true,
    },
    {
      id: "bullets",
      label: "Achievement bullets",
      hint: "At least three work bullets, written as selectable text.",
      pass: bullets.length >= 3,
      weight: 6,
      auto: false,
    },
    {
      id: "numbers",
      label: "Quantified results",
      hint: "Add a real number (%, $, time, volume). Improve ATS will not invent one.",
      pass: quantified >= 1,
      weight: 6,
      auto: false,
    },
    {
      id: "skills",
      label: "Plain-text skills",
      hint: "List 5+ skills as words. No rating bars or stars.",
      pass: skillCount >= 5 && !hasSkillRatings(r),
      weight: 8,
      auto: true,
    },
    {
      id: "edu",
      label: "Education or certification",
      hint: "Use the standard Education or Certifications heading.",
      pass: hasEdu || hasCert,
      weight: 4,
      auto: false,
    },
    {
      id: "linkedin",
      label: "Clean LinkedIn URL",
      hint: "linkedin.com/in/name with no tracking parameters.",
      pass: /linkedin\.com\/in\//i.test(cleanUrl(c.linkedin)) || t(c.linkedin).length > 4,
      weight: 4,
      auto: true,
    },
    {
      id: "voice",
      label: "Implied first person",
      hint: "Drop I, my, me, we. ATS and recruiters expect implied first person.",
      pass: bullets.length > 0 && !firstPerson,
      weight: 4,
      auto: true,
    },
    {
      id: "banned",
      label: "No outdated phrases",
      hint: "Remove References available upon request.",
      pass: !banned,
      weight: 4,
      auto: true,
    },
    {
      id: "pii",
      label: "No personal ID fields",
      hint: "International ATS: hide CNIC, father name, date of birth, marital status.",
      pass: !pii,
      weight: 4,
      auto: true,
    },
    {
      id: "visible",
      label: "Core sections visible",
      hint: "Experience, Education, and Skills must not be hidden.",
      pass: !coreHidden,
      weight: 2,
      auto: true,
    },
  ];
}

export function computeAtsScore(r: Resume): number {
  return evaluateAts(r).score;
}

export const ATS_DISCLAIMER =
  "ATS software varies by employer. This is an ATS Compatibility Score for guidance, not a guarantee of parsing or interviews.";

export type AtsRiskLevel = "high" | "medium" | "low";

export interface AtsRisk {
  level: AtsRiskLevel;
  label: string;
  fix: string;
}

export interface AtsDimension {
  id: string;
  label: string;
  score: number;
  note?: string;
}

export interface AtsReport {
  score: number;
  checks: AtsCheck[];
  dimensions: AtsDimension[];
  risks: AtsRisk[];
  disclaimer: string;
}

function clamp98(n: number): number {
  return Math.max(0, Math.min(98, Math.round(n)));
}

function weighted(checks: AtsCheck[], ids: string[]): number {
  const subset = checks.filter((c) => ids.includes(c.id));
  if (!subset.length) return 80;
  const total = subset.reduce((n, c) => n + c.weight, 0) || 1;
  const got = subset.reduce((n, c) => n + (c.pass ? c.weight : 0), 0);
  return (got / total) * 100;
}

const SINGLE_COL = new Set([
  "classic",
  "modern-minimal",
  "executive",
  "academic-cv",
  "entry-level",
  "compact",
  "classic-serif",
]);

function layoutPenalty(r: Resume): { penalty: number; label: string; reasons: string[] } {
  const key = r.theme?.template ?? "classic";
  const tp = getTemplate(key);
  const atsOn = Boolean(r.theme?.atsSafe);
  let raw = 0;
  const reasons: string[] = [];
  if (!SINGLE_COL.has(key)) {
    raw += 18;
    reasons.push("multi-column or creative structure");
  }
  if (tp.photo) {
    raw += 12;
    reasons.push("photo layout");
  }
  if (tp.dark) {
    raw += 10;
    reasons.push("dark or low-contrast design");
  }
  if (!tp.atsSafeVariant) {
    raw += 12;
    reasons.push("designed template");
  }
  const penalty = atsOn ? Math.round(raw * 0.3) : raw;
  return { penalty, label: tp.label, reasons };
}

export function evaluateAts(r: Resume): AtsReport {
  const checks = atsChecks(r);
  const bullets = jobBullets(r);
  const photo = t(r.contact?.photoUrl).length > 8;
  const designed = !r.theme?.atsSafe;
  const jd = t(r.target?.jobDescription);
  const hasJd = jd.length > 40;
  const layout = layoutPenalty(r);

  const risks: AtsRisk[] = [];
  if (layout.penalty >= 20 && designed) {
    risks.push({
      level: layout.penalty >= 36 ? "high" : "medium",
      label: `${layout.label} is harder for ATS parsers`,
      fix: `This layout uses ${layout.reasons.join(", ")}. Turn on ATS Safe to flatten it, or pick Classic for the safest structure.`,
    });
  } else if (layout.penalty >= 8 && !designed) {
    risks.push({
      level: "low",
      label: `${layout.label} still has some parser risk`,
      fix: "ATS Safe is flattening this layout. Classic, Minimal, or Compact stay the safest structures.",
    });
  }
  if (photo && designed) {
    risks.push({
      level: "medium",
      label: "Profile photo in a designed layout",
      fix: "Turn on ATS Safe so the photo is not the only way a parser sees your name and contact.",
    });
  }
  if (hasSkillRatings(r)) {
    risks.push({
      level: "high",
      label: "Skill bars or star ratings",
      fix: "List skills as words. Improve ATS can strip rating symbols.",
    });
  }
  const extrasOn = r.visibility?.extras !== false;
  if (extrasOn && (r.extras ?? []).some((e) => isPiiLabel(e.label) && t(e.value))) {
    risks.push({
      level: "medium",
      label: "Personal ID fields visible",
      fix: "Hide CNIC, father name, date of birth, and similar fields unless the target country requires them.",
    });
  }
  if (!t(r.contact?.fullName) || !t(r.contact?.email)) {
    risks.push({
      level: "high",
      label: "Name or email missing as text",
      fix: "Put name and email in Contents so they are selectable text, not only in a graphic.",
    });
  }
  const fancyBullet = bullets.some((b) => /^[▪▸►●★☆◼]/.test(b));
  if (fancyBullet) {
    risks.push({
      level: "low",
      label: "Decorative bullet symbols",
      fix: "Improve ATS converts these to plain text. Templates already render standard bullets.",
    });
  }
  const counts = new Map<string, number>();
  for (const w of bullets.join(" ").toLowerCase().split(/[^a-z0-9+#]+/)) {
    if (w.length < 5) continue;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  const stuffed = [...counts.entries()].filter(([, n]) => n >= 6).sort((a, b) => b[1] - a[1]);
  if (stuffed.length) {
    risks.push({
      level: "low",
      label: "Possible keyword stuffing",
      fix: `"${stuffed[0][0]}" appears ${stuffed[0][1]} times. Keep the employer's wording where it is true, and do not repeat a term unnaturally.`,
    });
  }
  if (!risks.length) {
    risks.push({
      level: "low",
      label: "No high-risk parsing issues found",
      fix: "Keep headings standard and add a job description to score keyword match.",
    });
  }

  let jobMatch = 72;
  let jobNote = "Paste a job description in Tailor to a job to score this.";
  if (hasJd) {
    const report = tailorResume(r, jd);
    jobMatch = report.coverage;
    jobNote = `${report.matchedKeywords.length} matched, ${report.partialKeywords.length} partial, ${report.missingKeywords.length} missing. Missing terms are not auto-inserted.`;
  }

  const parsing = 96 - layout.penalty;
  const structure = weighted(checks, ["job", "edu", "summary", "visible", "chrono"]);
  const keywords = weighted(checks, ["skills", "summary", "bullets"]);
  const skills = weighted(checks, ["skills"]);
  const experience = weighted(checks, ["job", "dates", "bullets", "numbers", "chrono"]);
  const formatting = Math.max(42, (designed ? 90 - layout.penalty : 94 - Math.round(layout.penalty * 0.45)) * (hasSkillRatings(r) ? 0.7 : 1));
  const readability = weighted(checks, ["voice", "banned", "summary"]);
  const file = t(r.contact?.fullName) && t(r.contact?.email) ? 96 : 55;
  const content = weighted(checks, ["numbers", "voice", "banned", "pii"]);

  const dimensions: AtsDimension[] = [
    { id: "A", label: "Parsing safety", score: clamp98(parsing), note: `${layout.label}${layout.reasons.length ? ` · ${layout.reasons.join(", ")}` : ""}` },
    { id: "B", label: "Section structure", score: clamp98(structure) },
    { id: "C", label: "Keyword presence", score: clamp98(keywords) },
    { id: "D", label: "Job description match", score: clamp98(jobMatch), note: jobNote },
    { id: "E", label: "Skills match", score: clamp98(skills) },
    { id: "F", label: "Experience relevance", score: clamp98(experience) },
    { id: "G", label: "Formatting consistency", score: clamp98(formatting) },
    { id: "H", label: "Readability", score: clamp98(readability) },
    { id: "I", label: "File compatibility", score: clamp98(file), note: "PDF and Word export as selectable text, not a scan." },
    { id: "J", label: "Content quality", score: clamp98(content) },
  ];

  const weights = hasJd
    ? { A: 22, B: 10, C: 8, D: 12, E: 8, F: 10, G: 10, H: 6, I: 8, J: 6 }
    : { A: 28, B: 12, C: 8, D: 0, E: 10, F: 12, G: 12, H: 6, I: 6, J: 6 };
  let wsum = 0;
  let ssum = 0;
  for (const d of dimensions) {
    const w = weights[d.id as keyof typeof weights] ?? 0;
    wsum += w;
    ssum += d.score * w;
  }
  const score = clamp98(ssum / (wsum || 1));

  return { score, checks, dimensions, risks, disclaimer: ATS_DISCLAIMER };
}

export function stripFirstPerson(text: string): string {
  let out = t(text);
  if (!out) return out;
  out = out.replace(/^(i|we)\s+/i, "");
  out = out.replace(/\b(i|we|my|our|me|us|myself)\b/gi, "");
  out = out.replace(/\s{2,}/g, " ").replace(/\s+([,.;:])/g, "$1").trim();
  if (!out) return t(text);
  return out.charAt(0).toUpperCase() + out.slice(1);
}

export function stripWeakOpener(text: string): string {
  let out = t(text);
  const weak = [...ATS_WEAK, ...WEAK_STARTERS];
  for (const w of weak) {
    const re = new RegExp(`^${w}\\b\\s*`, "i");
    if (re.test(out)) {
      out = out.replace(re, "").replace(/^[,:\s]+/, "");
      break;
    }
  }
  if (!out) return t(text);
  return out.charAt(0).toUpperCase() + out.slice(1);
}

export function stripBanned(text: string): string {
  let out = t(text);
  for (const p of BANNED_PHRASES) {
    out = out.replace(new RegExp(p, "ig"), "");
  }
  return out.replace(/\s{2,}/g, " ").replace(/^[\s,.;:-]+|[\s,.;:-]+$/g, "").trim();
}

export function cleanSkillName(s: string): string {
  return t(s).replace(RATING_ALL, "").replace(/\s{2,}/g, " ").trim();
}

export function titleCaseName(name: string): string {
  const raw = t(name);
  if (raw.length < 4 || raw !== raw.toUpperCase()) return raw;
  return raw
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

function unshout(value: string): string {
  const raw = t(value);
  if (!raw || raw !== raw.toUpperCase()) return raw;
  if (!raw.includes(" ") && raw.length <= 5) return raw;
  return titleCaseName(raw);
}

function endSentence(value: string): string {
  const out = t(value);
  if (!out) return out;
  if (/[.!?]$/.test(out)) return out;
  return `${out}.`;
}

type ImproveListener = (result: AtsImproveResult) => void;
const improveListeners = new Set<ImproveListener>();

export function onAtsImprove(listener: ImproveListener): () => void {
  improveListeners.add(listener);
  return () => improveListeners.delete(listener);
}

export function cleanContactLink(url: string): string {
  const raw = t(url).replace(/[?&#].*$/, "");
  return cleanUrl(raw);
}

const ATS_ORDER: SectionKey[] = [
  "contact",
  "summary",
  "experience",
  "education",
  "skills",
  "certifications",
  "projects",
  "languages",
  "volunteer",
  "awards",
  "publications",
  "teaching",
  "grants",
  "presentations",
  "affiliations",
  "portfolio",
  "references",
  "extras",
];

const ACRONYM_EXPAND: { re: RegExp; full: string; already: string }[] = [
  { re: /\bSEO\b/, full: "Search Engine Optimization (SEO)", already: "search engine optimization" },
  { re: /\bAPI\b/, full: "Application Programming Interface (API)", already: "application programming interface" },
  { re: /\bCRM\b/, full: "Customer Relationship Management (CRM)", already: "customer relationship management" },
  { re: /\bKPI\b/, full: "Key Performance Indicator (KPI)", already: "key performance indicator" },
];

function expandAcronymsOnce(text: string): string {
  let out = t(text);
  const lower = out.toLowerCase();
  for (const row of ACRONYM_EXPAND) {
    if (!row.re.test(out)) continue;
    if (lower.includes(row.already)) continue;
    out = out.replace(row.re, row.full);
  }
  return out;
}

function polishLine(text: string): string {
  const stripped = t(text).replace(/^[•▪▸►●○★☆◼◻]\s*/, "");
  return stripBanned(stripWeakOpener(stripFirstPerson(stripped)));
}

function hasBankVerb(text: string): boolean {
  const first = t(text).split(/\s+/)[0]?.replace(/[^a-zA-Z]/g, "") ?? "";
  if (!first) return false;
  return VERB_BANK.some((c) => c.verbs.some((v) => v.toLowerCase() === first.toLowerCase()));
}

function hadWeakOpener(text: string): boolean {
  const lower = t(text).toLowerCase();
  return WEAK_STARTERS.some((w) => lower.startsWith(w)) || ATS_WEAK.some((w) => lower.startsWith(w));
}

function rewriteBullet(text: string, present: boolean): string {
  const original = t(text);
  if (!original) return original;
  const polished = polishLine(original);
  if (!polished) return polished;
  const weak = hadWeakOpener(original);
  const known = hasBankVerb(polished);
  let next = polished;
  if (weak || known) {
    const imp = improveBullet(polished, { present });
    if (imp.suggested) {
      const invented = /^Achieved\b/i.test(imp.suggested) && !known;
      if (!invented) next = imp.suggested.replace(/\.$/, "");
    }
  }
  return endSentence(next);
}

function sortByYear<T>(items: T[], start: (x: T) => string, end: (x: T) => string, present?: (x: T) => boolean): T[] {
  return [...items].sort((a, b) => {
    const ka = present?.(a) ? 9999 : yearOf(end(a)) || yearOf(start(a));
    const kb = present?.(b) ? 9999 : yearOf(end(b)) || yearOf(start(b));
    return kb - ka;
  });
}

export interface AtsImproveResult {
  resume: Resume;
  changes: string[];
  leftover: string[];
  before: number;
  after: number;
}

export function improveAts(resume: Resume): AtsImproveResult {
  const before = computeAtsScore(resume);
  const next: Resume = JSON.parse(JSON.stringify(resume)) as Resume;
  const changes: string[] = [];

  const name = titleCaseName(next.contact.fullName);
  if (name !== t(next.contact.fullName)) {
    next.contact.fullName = name;
    changes.push("Converted name to title case so parsers read it as a person name.");
  }
  const email = t(next.contact.email).toLowerCase();
  if (email && email !== next.contact.email) {
    next.contact.email = email;
    changes.push("Normalized email to lowercase.");
  }
  const phone = t(next.contact.phone).replace(/[^\d+\s-]/g, "").replace(/\s{2,}/g, " ").trim();
  if (phone && phone !== t(next.contact.phone)) {
    next.contact.phone = phone;
    changes.push("Cleaned phone number formatting.");
  }
  const li = cleanContactLink(next.contact.linkedin);
  if (li !== t(next.contact.linkedin)) {
    next.contact.linkedin = li;
    changes.push("Cleaned LinkedIn URL (no tracking parameters).");
  }
  next.contact.website = cleanContactLink(next.contact.website);
  next.contact.github = cleanContactLink(next.contact.github);
  next.contact.portfolioUrl = cleanContactLink(next.contact.portfolioUrl);

  const title = unshout(next.contact.title);
  if (title !== t(next.contact.title)) {
    next.contact.title = title;
    changes.push("Converted job title from ALL CAPS to title case.");
  }

  const sum0 = t(next.summary);
  const obj0 = t(next.objective);
  next.summary = endSentence(expandAcronymsOnce(polishLine(next.summary)));
  next.objective = endSentence(polishLine(next.objective));
  if (next.summary !== sum0 || next.objective !== obj0) changes.push("Rewrote summary in implied first person and removed weak openers.");

  if ((next.experience ?? []).some((j) => t(j.role) || t(j.company)) && next.useObjective) {
    if (!t(next.summary) && t(next.objective)) next.summary = next.objective;
    next.useObjective = false;
    changes.push("Switched Objective to Professional Summary (international default when you have work history).");
  }

  let bulletChanged = 0;
  let roleChanged = 0;
  next.experience = (next.experience ?? []).map((j) => {
    const role = unshout(j.role);
    const company = unshout(j.company);
    if (role !== t(j.role) || company !== t(j.company)) roleChanged += 1;
    const bullets = (j.bullets ?? []).map((b) => {
      const nextLine = rewriteBullet(b, Boolean(j.present));
      if (nextLine !== t(b)) bulletChanged += 1;
      return nextLine;
    });
    return { ...j, role, company, bullets };
  });
  next.volunteer = (next.volunteer ?? []).map((j) => ({
    ...j,
    bullets: (j.bullets ?? []).map((b) => rewriteBullet(b, Boolean(j.present))),
  }));
  next.teaching = (next.teaching ?? []).map((j) => ({
    ...j,
    bullets: (j.bullets ?? []).map((b) => rewriteBullet(b, false)),
  }));
  if (bulletChanged) {
    changes.push(`Rewrote ${bulletChanged} bullet${bulletChanged === 1 ? "" : "s"}: dropped I/my/me, weak openers, and used a stronger action verb. No numbers were invented.`);
  }
  if (roleChanged) changes.push("Converted shouting job titles and company names to title case.");

  if (!isReverseChrono(next)) {
    next.experience = sortByYear(next.experience ?? [], (j) => j.startDate, (j) => j.endDate, (j) => j.present);
    changes.push("Sorted work history newest first.");
  }
  const edu = next.education ?? [];
  const eduSorted = sortByYear(edu, (e) => e.startDate, (e) => e.endDate);
  if (eduSorted.map((e) => e.id).join() !== edu.map((e) => e.id).join()) {
    next.education = eduSorted;
    changes.push("Sorted education newest first.");
  }

  let skillChanged = false;
  next.skills = (next.skills ?? []).map((g) => ({
    ...g,
    skills: (g.skills ?? []).map((s) => {
      const cleaned = cleanSkillName(s);
      if (cleaned !== t(s)) skillChanged = true;
      return cleaned;
    }).filter(Boolean),
  }));
  if (skillChanged) changes.push("Removed skill rating bars so skills parse as words.");

  const vis = { ...next.visibility };
  const show = (key: VisibilityKey, ok: boolean, label: string) => {
    if (ok && vis[key] === false) {
      vis[key] = true;
      changes.push(`Unhid ${label} so ATS can read it.`);
    }
  };
  show("experience", (next.experience ?? []).some((j) => t(j.role) || t(j.company)), "Work Experience");
  show("education", (next.education ?? []).some((e) => t(e.institution) || t(e.degree)), "Education");
  show("skills", (next.skills ?? []).some((g) => (g.skills ?? []).length > 0), "Skills");
  show("summary", t(next.summary).length > 0, "Summary");
  const piiRows = (next.extras ?? []).filter((e) => isPiiLabel(e.label) && t(e.value));
  if (piiRows.length && vis.extras !== false) {
    vis.extras = false;
    changes.push("Hid personal ID fields (CNIC, father name, date of birth) for international ATS.");
  }
  next.visibility = vis;

  const rest = (next.sectionOrder ?? []).filter((k) => !ATS_ORDER.includes(k));
  const ordered = [...ATS_ORDER.filter((k) => (next.sectionOrder ?? []).includes(k)), ...rest];
  if (ordered.join() !== (next.sectionOrder ?? []).join()) {
    next.sectionOrder = ordered;
    changes.push("Reordered sections: Summary, Work Experience, Education, Skills.");
  }

  if (!next.theme.atsSafe) {
    next.theme = { ...next.theme, ...themePatchForAtsSafe(next.theme.template, true) };
    changes.push("Turned on ATS Safe: parser-friendly layouts only. Designed look returns when you turn it off.");
  } else if (!getTemplate(next.theme.template).atsSafeVariant) {
    next.theme = { ...next.theme, ...themePatchForAtsSafe(next.theme.template, true) };
  }

  const leftover: string[] = [];
  const afterResume = next;
  const afterChecks = atsChecks(afterResume).filter((c) => !c.pass);
  for (const c of afterChecks) leftover.push(c.hint);

  if (changes.length === 0 && leftover.length === 0) changes.push("Already matches international ATS rules.");

  const result: AtsImproveResult = {
    resume: afterResume,
    changes,
    leftover: leftover.slice(0, 6),
    before,
    after: computeAtsScore(afterResume),
  };
  improveListeners.forEach((fn) => fn(result));
  return result;
}
