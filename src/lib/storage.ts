import type { Contact, FluencyLevel, Resume, ResumeTypeKey, SectionKey, TemplateKey, ThemeConfig, VisibilityKey } from "./types";
import { sanitizeMargins } from "./pageLayout";
import { createBlankResume, FONT_PAIRS } from "./sampleData";
import { coerceResume, sanitizeSocials } from "./coerceResume";
import { uid } from "./date";
import { INDUSTRY_PRESETS, RESUME_TYPES } from "./resumeTypes";
import { isKnownTemplateKey } from "../templates/registry";
import { sanitizeAccent, sanitizePhotoUrl, sanitizePlainText } from "./sanitize";

export const STORAGE_KEY = "resume-studio:v2";

const SECTION_KEYS: SectionKey[] = [
  "contact",
  "summary",
  "objective",
  "experience",
  "education",
  "skills",
  "projects",
  "certifications",
  "languages",
  "volunteer",
  "publications",
  "awards",
  "teaching",
  "grants",
  "presentations",
  "affiliations",
  "references",
  "portfolio",
  "extras",
];

const VISIBILITY_KEYS: VisibilityKey[] = SECTION_KEYS.filter((k): k is VisibilityKey => k !== "contact");
const RESUME_TYPE_KEYS = new Set(RESUME_TYPES.map((t) => t.key));
const FONT_PAIR_KEYS = new Set(FONT_PAIRS.map((f) => f.key));
const INDUSTRY_KEYS = new Set(INDUSTRY_PRESETS.map((p) => p.key));
const FLUENCY: FluencyLevel[] = ["Native", "Fluent", "Professional", "Conversational"];

const DROPPED_TEMPLATES: Record<string, TemplateKey> = {
  marquee: "classic",
  ledger: "classic",
  dock: "classic",
  quartz: "classic",
  plinth: "classic",
  inkwell: "classic",
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function str(v: unknown): string {
  return sanitizePlainText(v).trim();
}

function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v.filter((x) => x != null && typeof x !== "function") : [];
}

function isSectionKey(k: unknown): k is SectionKey {
  return typeof k === "string" && SECTION_KEYS.includes(k as SectionKey);
}

function isResumeTypeKey(k: unknown): k is ResumeTypeKey {
  return typeof k === "string" && RESUME_TYPE_KEYS.has(k as ResumeTypeKey);
}

export function sanitizeThemeConfig(partial: Partial<ThemeConfig>, fallback: ThemeConfig): ThemeConfig {
  const merged = { ...fallback, ...partial };
  const mapped = DROPPED_TEMPLATES[String(merged.template ?? "")] ?? merged.template;
  const template: TemplateKey = isKnownTemplateKey(String(mapped)) ? mapped : fallback.template;
  const fontPair = FONT_PAIR_KEYS.has(String(merged.fontPair)) ? String(merged.fontPair) : fallback.fontPair;
  return {
    template,
    accent: sanitizeAccent(merged.accent, fallback.accent),
    fontPair,
    density: merged.density === "compact" ? "compact" : merged.density === "roomy" ? "roomy" : "comfortable",
    typeSize: merged.typeSize === "small" || merged.typeSize === "large" ? merged.typeSize : "medium",
    lineHeight: merged.lineHeight === "tight" || merged.lineHeight === "relaxed" ? merged.lineHeight : "normal",
    atsSafe: Boolean(merged.atsSafe),
    pageSize: merged.pageSize === "letter" ? "letter" : "a4",
    maxPages: merged.maxPages === 2 ? 2 : 1,
    margins: sanitizeMargins(merged.margins, merged.pageSize === "letter" ? "letter" : "a4"),
    citationFormat: merged.citationFormat === "mla" || merged.citationFormat === "chicago" ? merged.citationFormat : "apa",
  };
}

export function sanitizeSectionOrder(order: unknown, fallback: SectionKey[]): SectionKey[] {
  const seen = new Set<SectionKey>();
  const next: SectionKey[] = [];
  for (const key of arr(order)) {
    if (!isSectionKey(key) || seen.has(key)) continue;
    seen.add(key);
    next.push(key);
  }
  const base = next.length ? next : fallback;
  return base.includes("extras") ? base : [...base, "extras"];
}

function sanitizeVisibility(raw: unknown, fallback: Resume["visibility"], extrasFilled: boolean): Resume["visibility"] {
  const vis = { ...fallback };
  if (isPlainObject(raw)) {
    for (const key of VISIBILITY_KEYS) {
      if (typeof raw[key] === "boolean") vis[key] = raw[key];
    }
  }
  if (!extrasFilled) vis.extras = false;
  return vis;
}

function sanitizeFluency(level: unknown): FluencyLevel {
  return FLUENCY.includes(level as FluencyLevel) ? (level as FluencyLevel) : "Native";
}

/** Fill missing keys and reject extra / unsafe fields from localStorage or imports. */
export function hydrateResume(rawInput: unknown): Resume {
  const blank = createBlankResume();
  if (!isPlainObject(rawInput)) return blank;

  const raw = rawInput as Partial<Resume>;
  const c = isPlainObject(raw.contact) ? (raw.contact as Partial<Contact>) : {};
  const metaIn = isPlainObject(raw.meta) ? raw.meta : {};
  const targetIn = isPlainObject(raw.target) ? raw.target : {};
  const extras = arr(raw.extras);
  const extrasFilled = extras.some((d) => {
    const row = isPlainObject(d) ? d : {};
    return Boolean(str(row.label) && str(row.value));
  });

  const industryRaw = (metaIn as { industry?: unknown }).industry;
  const industry = typeof industryRaw === "string" && INDUSTRY_KEYS.has(industryRaw as (typeof INDUSTRY_PRESETS)[number]["key"])
    ? industryRaw
    : undefined;

  const base: Resume = {
    meta: {
      id: str((metaIn as { id?: unknown }).id) || blank.meta.id,
      name: str((metaIn as { name?: unknown }).name) || blank.meta.name,
      type: isResumeTypeKey((metaIn as { type?: unknown }).type) ? (metaIn as { type: ResumeTypeKey }).type : blank.meta.type,
      industry,
      createdAt: str((metaIn as { createdAt?: unknown }).createdAt) || blank.meta.createdAt,
      updatedAt: str((metaIn as { updatedAt?: unknown }).updatedAt) || blank.meta.updatedAt,
    },
    target: {
      jobDescription: str((targetIn as { jobDescription?: unknown }).jobDescription),
      enabled: Boolean((targetIn as { enabled?: unknown }).enabled),
    },
    contact: {
      fullName: str(c.fullName),
      title: str(c.title),
      phone: str(c.phone),
      email: str(c.email),
      city: str(c.city),
      country: str(c.country),
      linkedin: str(c.linkedin),
      website: str(c.website),
      github: str(c.github),
      portfolioUrl: str(c.portfolioUrl),
      photoUrl: sanitizePhotoUrl(c.photoUrl),
      socials: sanitizeSocials(c.socials),
    },
    summary: str(raw.summary),
    objective: str(raw.objective),
    useObjective: Boolean(raw.useObjective),
    experience: arr(raw.experience) as Resume["experience"],
    education: arr(raw.education) as Resume["education"],
    skills: arr(raw.skills) as Resume["skills"],
    projects: arr(raw.projects) as Resume["projects"],
    certifications: arr(raw.certifications) as Resume["certifications"],
    languages: arr(raw.languages) as Resume["languages"],
    volunteer: arr(raw.volunteer) as Resume["volunteer"],
    publications: arr(raw.publications) as Resume["publications"],
    awards: arr(raw.awards) as Resume["awards"],
    teaching: arr(raw.teaching) as Resume["teaching"],
    grants: arr(raw.grants) as Resume["grants"],
    presentations: arr(raw.presentations) as Resume["presentations"],
    affiliations: arr(raw.affiliations) as Resume["affiliations"],
    references: arr(raw.references) as Resume["references"],
    extras: extras as Resume["extras"],
    sectionOrder: sanitizeSectionOrder(raw.sectionOrder, blank.sectionOrder),
    visibility: sanitizeVisibility(raw.visibility, blank.visibility, extrasFilled),
    theme: sanitizeThemeConfig(isPlainObject(raw.theme) ? (raw.theme as Partial<ThemeConfig>) : {}, blank.theme),
  };

  const filled = coerceResume(base);
  const withIds = <T extends { id?: string }>(items: T[]): T[] =>
    items.map((it) => ({ ...it, id: it.id || uid() }));
  return {
    ...filled,
    languages: filled.languages.map((it) => ({ ...it, id: it.id || uid(), level: sanitizeFluency(it.level) })),
    experience: withIds(filled.experience),
    education: withIds(filled.education),
    skills: withIds(filled.skills),
    projects: withIds(filled.projects),
    certifications: withIds(filled.certifications),
    volunteer: withIds(filled.volunteer),
    publications: withIds(filled.publications),
    awards: withIds(filled.awards),
    teaching: withIds(filled.teaching),
    grants: withIds(filled.grants),
    presentations: withIds(filled.presentations),
    affiliations: withIds(filled.affiliations),
    references: withIds(filled.references),
    extras: withIds(filled.extras ?? []),
  };
}

export function loadResume(): Resume | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isPlainObject(parsed) || !isPlainObject(parsed.meta) || !isPlainObject(parsed.contact) || !isPlainObject(parsed.theme)) {
      return null;
    }
    return hydrateResume(parsed);
  } catch {
    return null;
  }
}

export function saveResume(r: Resume): void {
  try {
    const snapshot = { ...r, meta: { ...r.meta, updatedAt: new Date().toISOString() } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    try {
      const slim = {
        ...r,
        contact: { ...r.contact, photoUrl: "" },
        meta: { ...r.meta, updatedAt: new Date().toISOString() },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
    } catch {
      // ignore
    }
  }
}

export function clearSavedResume(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
