import type { Resume } from "./types";
import { cleanUrl } from "./date";
import { t } from "./safe";

const STOP_WORDS = new Set(
  `a an and are as at be by for from has he her his in is it its of on or she that the their them they this to was were will with you your our we our i me my am`.split(" "),
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function extractKeywords(jd: string, limit = 24): { term: string; count: number }[] {
  const freq = new Map<string, number>();
  for (const t of tokenize(jd)) {
    if (t.length < 3) continue;
    if (/^[.\d]+$/.test(t)) continue;
    if (STOP_WORDS.has(t)) continue;
    if (t.length > 3 && (t.startsWith("www.") || t.includes("http"))) continue;
    freq.set(t, (freq.get(t) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term, count]) => ({ term, count }));
}

export function multiWordTerms(jd: string, limit = 10): string[] {
  const phrases = new Map<string, number>();
  const clean = jd.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ").replace(/\s+/g, " ").trim();
  const words = clean.split(" ");
  for (let i = 0; i < words.length - 1; i++) {
    const a = words[i];
    const b = words[i + 1];
    if (!a || !b || a.length < 3 || b.length < 3) continue;
    if (STOP_WORDS.has(a) || STOP_WORDS.has(b)) continue;
    const phrase = a + " " + b;
    phrases.set(phrase, (phrases.get(phrase) ?? 0) + 1);
  }
  return [...phrases.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([p]) => p);
}

export interface TailorReport {
  keywords: string[];
  matchedKeywords: string[];
  partialKeywords: string[];
  missingKeywords: string[];
  matchedSkills: string[];
  matchedBullets: { jobIndex: number; bulletIndex: number; bullet: string; terms: string[] }[];
  totalKeywords: number;
  coverage: number;
  recommendations: string[];
  tailored: Resume;
}

function keywordMatches(term: string, text: string): boolean {
  const hay = text.toLowerCase();
  const k = term.toLowerCase();
  return hay.includes(k) || (k.length > 4 && k.includes(hay) && hay.length > 3);
}

function resumeHaystack(r: Resume): string {
  const bits = [
    r.summary,
    r.objective,
    r.contact?.title,
    ...(r.skills ?? []).flatMap((g) => [g.name, ...(g.skills ?? [])]),
    ...(r.experience ?? []).flatMap((j) => [j.role, j.company, j.descriptor, ...(j.bullets ?? [])]),
    ...(r.projects ?? []).flatMap((p) => [p.name, p.description, p.tech]),
    ...(r.certifications ?? []).map((c) => `${c.name} ${c.issuer}`),
    ...(r.education ?? []).flatMap((e) => [e.degree, e.field, e.institution]),
  ];
  return bits.map((x) => t(x)).join(" \n ").toLowerCase();
}

function classifyKeyword(term: string, haystack: string): "matched" | "partial" | "missing" {
  const k = term.toLowerCase().trim();
  if (!k) return "missing";
  if (haystack.includes(k)) return "matched";
  const parts = k.split(/[\s/+-]+/).filter((w) => w.length > 3);
  if (parts.length >= 2 && parts.some((p) => haystack.includes(p))) return "partial";
  const stem = k.replace(/(ing|tion|ment|er|ed|s)$/i, "");
  if (stem.length >= 4 && haystack.includes(stem)) return "partial";
  return "missing";
}

export function tailorResume(r: Resume, jd: string): TailorReport {
  const single = extractKeywords(jd, 18);
  const multi = multiWordTerms(jd, 8);
  const keywords = [...multi, ...single.map((s) => s.term)].slice(0, 26);
  const haystack = resumeHaystack(r);

  const matchedKeywords: string[] = [];
  const partialKeywords: string[] = [];
  const missingKeywords: string[] = [];
  for (const k of keywords) {
    const kind = classifyKeyword(k, haystack);
    if (kind === "matched") matchedKeywords.push(k);
    else if (kind === "partial") partialKeywords.push(k);
    else missingKeywords.push(k);
  }

  const matchedSkills: string[] = [];
  for (const g of r.skills ?? []) {
    for (const s of g.skills ?? []) {
      const lower = s.toLowerCase();
      if (keywords.some((k) => keywordMatches(k, lower))) matchedSkills.push(s);
    }
  }

  const matchedBullets: TailorReport["matchedBullets"] = [];
  (r.experience ?? []).forEach((job, jobIndex) => {
    (job.bullets ?? []).forEach((b, bulletIndex) => {
      const terms = keywords.filter((k) => b.toLowerCase().includes(k));
      if (terms.length) matchedBullets.push({ jobIndex, bulletIndex, bullet: b, terms: terms.slice(0, 4) });
    });
  });

  const coverage = keywords.length
    ? Math.round(((matchedKeywords.length + partialKeywords.length * 0.5) / keywords.length) * 100)
    : 0;

  const recommendations: string[] = [];
  if (missingKeywords.length) {
    recommendations.push(
      "Missing from this resume (not added automatically). Include them only if they are true: " +
        missingKeywords.slice(0, 6).join(", ") +
        ".",
    );
  }
  if (partialKeywords.length) {
    recommendations.push(
      "Partial matches. Use the posting's exact wording where it accurately describes your work: " +
        partialKeywords.slice(0, 6).join(", ") +
        ".",
    );
  }
  if ((r.experience ?? []).length && matchedBullets.length === 0) {
    recommendations.push("None of your current bullets use this posting's terms. Rewrite existing bullets with accurate wording from the job.");
  }

  const rankSkills = (g: Resume["skills"][number]) =>
    (g.skills ?? []).filter((s) => keywords.some((k) => keywordMatches(k, s))).length;
  const skills = [...(r.skills ?? [])].sort((a, b) => rankSkills(b) - rankSkills(a));

  const rankJob = (job: Resume["experience"][number]) =>
    (job.bullets ?? []).filter((b) => keywords.some((k) => b.toLowerCase().includes(k))).length;
  const experience = [...(r.experience ?? [])].sort((a, b) => rankJob(b) - rankJob(a));

  const tailored: Resume = {
    ...r,
    skills,
    experience,
    target: { jobDescription: jd, enabled: jd.trim().length > 20 },
  };

  return {
    keywords,
    matchedKeywords,
    partialKeywords,
    matchedSkills,
    matchedBullets,
    missingKeywords,
    totalKeywords: keywords.length,
    coverage,
    recommendations,
    tailored,
  };
}

export function linkedinClean(url: string): string {
  return cleanUrl(url);
}
