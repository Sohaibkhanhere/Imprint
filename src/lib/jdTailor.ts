import type { Resume } from "./types";
import { cleanUrl } from "./date";

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
  matchedSkills: string[];
  matchedBullets: { jobIndex: number; bulletIndex: number; bullet: string; terms: string[] }[];
  missingKeywords: string[];
  totalKeywords: number;
  coverage: number;
  recommendations: string[];
  tailored: Resume;
}

function keywordMatches(term: string, text: string): boolean {
  const t = text.toLowerCase();
  return t.includes(term) || term.includes(t);
}

export function tailorResume(r: Resume, jd: string): TailorReport {
  const single = extractKeywords(jd, 18);
  const multi = multiWordTerms(jd, 8);
  const keywords = [...multi, ...single.map((s) => s.term)].slice(0, 26);

  const allSkills = r.skills.flatMap((g) => g.skills.map((s) => s.trim().toLowerCase()));

  const matchedSkills: string[] = [];
  for (const g of r.skills) {
    for (const s of g.skills) {
      const lower = s.toLowerCase();
      if (keywords.some((k) => keywordMatches(k, lower))) matchedSkills.push(s);
    }
  }

  const matchedKeywords = keywords.filter((k) => {
    const inSkills = allSkills.some((s) => keywordMatches(k, s));
    const inBullets = r.experience.some((job) => job.bullets.some((b) => keywordMatches(k, b)));
    return inSkills || inBullets;
  });

  const missingKeywords = keywords.filter((k) => !matchedKeywords.includes(k));

  const matchedBullets: TailorReport["matchedBullets"] = [];
  r.experience.forEach((job, jobIndex) => {
    job.bullets.forEach((b, bulletIndex) => {
      const terms = keywords.filter((k) => b.toLowerCase().includes(k));
      if (terms.length) matchedBullets.push({ jobIndex, bulletIndex, bullet: b, terms: terms.slice(0, 4) });
    });
  });

  const coverage = keywords.length ? Math.round((matchedKeywords.length / keywords.length) * 100) : 0;

  const recommendations: string[] = [];
  if (missingKeywords.length) recommendations.push("Add missing keywords as skills or weave them into bullets: " + missingKeywords.slice(0, 6).join(", ") + ".");
  if (r.experience.length && matchedBullets.length === 0) recommendations.push("None of your current bullets reference job keywords — rewrite your top 3 bullets with the terms above.");
  if (keywords.length && matchedKeywords.length < keywords.length * 0.5) recommendations.push("Aim for 70%+ keyword coverage; mirror the exact phrasing used in the job ad.");

  const rankSkills = (g: Resume["skills"][number]) => g.skills.filter((s) => keywords.some((k) => keywordMatches(k, s))).length;
  const skills = [...r.skills].sort((a, b) => rankSkills(b) - rankSkills(a));

  const rankJob = (job: Resume["experience"][number]) => job.bullets.filter((b) => keywords.some((k) => b.toLowerCase().includes(k))).length;
  const experience = [...r.experience].sort((a, b) => rankJob(b) - rankJob(a));

  const tailored: Resume = { ...r, skills, experience };

  return { keywords, matchedKeywords, matchedSkills, matchedBullets, missingKeywords, totalKeywords: keywords.length, coverage, recommendations, tailored };
}

export function linkedinClean(url: string): string {
  return cleanUrl(url);
}
