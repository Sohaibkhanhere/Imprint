import type { Contact, Resume, TemplateKey, ThemeConfig } from "./types";
import { createBlankResume } from "./sampleData";
import { coerceResume } from "./coerceResume";
import { uid } from "./date";

export const STORAGE_KEY = "resume-studio:v2";

function deepClean(value: unknown): unknown {
  if (value === undefined || value === null) return "";
  if (typeof value === "string" || typeof value === "boolean" || typeof value === "number") return value;
  if (Array.isArray(value)) return value.map(deepClean);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = deepClean(v);
    return out;
  }
  return "";
}

function str(v: unknown): string {
  return typeof v === "string" ? v : v == null || v === "" ? "" : String(v);
}

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

const DROPPED_TEMPLATES: Record<string, TemplateKey> = {
  marquee: "classic",
  ledger: "classic",
  dock: "inkwell",
  quartz: "inkwell",
};

/** Fill missing keys so old localStorage / imports never crash .trim() in templates. */
export function hydrateResume(raw: Resume): Resume {
  const blank = createBlankResume();
  const c = (raw?.contact ?? {}) as Partial<Contact>;
  const themeIn = (raw?.theme ?? {}) as Partial<ThemeConfig>;
  const vis = { ...blank.visibility, ...(raw?.visibility ?? {}) };
  const theme: ThemeConfig = {
    ...blank.theme,
    ...themeIn,
    template: DROPPED_TEMPLATES[themeIn.template ?? ""] ?? (themeIn.template || blank.theme.template),
    accent: str(themeIn.accent) || blank.theme.accent,
    fontPair: str(themeIn.fontPair) || blank.theme.fontPair,
    density: themeIn.density === "compact" ? "compact" : "comfortable",
    atsSafe: Boolean(themeIn.atsSafe),
    pageSize: themeIn.pageSize === "letter" ? "letter" : "a4",
    maxPages: themeIn.maxPages === 2 ? 2 : 1,
    citationFormat: themeIn.citationFormat === "mla" || themeIn.citationFormat === "chicago" ? themeIn.citationFormat : "apa",
  };
  delete (theme as { wordTemplate?: string }).wordTemplate;
  const base: Resume = {
    ...blank,
    ...raw,
    meta: { ...blank.meta, ...(raw?.meta ?? {}) },
    target: { ...blank.target, ...(raw?.target ?? {}) },
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
      photoUrl: str(c.photoUrl),
    },
    summary: str(raw?.summary),
    objective: str(raw?.objective),
    useObjective: Boolean(raw?.useObjective),
    experience: arr(raw?.experience),
    education: arr(raw?.education),
    skills: arr(raw?.skills),
    projects: arr(raw?.projects),
    certifications: arr(raw?.certifications),
    languages: arr(raw?.languages),
    volunteer: arr(raw?.volunteer),
    publications: arr(raw?.publications),
    awards: arr(raw?.awards),
    teaching: arr(raw?.teaching),
    grants: arr(raw?.grants),
    presentations: arr(raw?.presentations),
    affiliations: arr(raw?.affiliations),
    references: arr(raw?.references),
    sectionOrder: arr(raw?.sectionOrder).length ? arr(raw?.sectionOrder) : blank.sectionOrder,
    visibility: vis,
    theme,
  };
  const filled = coerceResume(base);
  const withIds = <T extends { id?: string }>(items: T[]): T[] =>
    items.map((it) => ({ ...it, id: it.id || uid() }));
  return {
    ...filled,
    experience: withIds(filled.experience),
    education: withIds(filled.education),
    skills: withIds(filled.skills),
    projects: withIds(filled.projects),
    certifications: withIds(filled.certifications),
    languages: withIds(filled.languages),
    volunteer: withIds(filled.volunteer),
    publications: withIds(filled.publications),
    awards: withIds(filled.awards),
    teaching: withIds(filled.teaching),
    grants: withIds(filled.grants),
    presentations: withIds(filled.presentations),
    affiliations: withIds(filled.affiliations),
    references: withIds(filled.references),
  };
}

export function loadResume(): Resume | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.meta && parsed.contact && parsed.theme) {
      return hydrateResume(deepClean(parsed) as Resume);
    }
    return null;
  } catch {
    return null;
  }
}

export function saveResume(r: Resume): void {
  try {
    const snapshot = { ...r, meta: { ...r.meta, updatedAt: new Date().toISOString() } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // storage full — drop the photo and retry once
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
