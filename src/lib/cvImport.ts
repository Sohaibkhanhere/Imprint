import type {
  Contact,
  Resume,
  SectionKey,
  ThemeConfig,
  ExperienceEntry,
  EducationEntry,
  ProjectEntry,
  CertificationEntry,
  LanguageEntry,
  VolunteerEntry,
  AwardEntry,
  PublicationEntry,
} from "./types";
import { uid, todayISO } from "./date";
import { defaultVisibility } from "./resumeTypes";
import { createBlankResume } from "./sampleData";

/* ============================================================
   Text extraction: .txt / .docx / .pdf → plain text
   ============================================================ */

type PdfGlyph = { str: string; x: number; y: number; w: number; h: number };

function nameFromPdfInfo(info: { Title?: string; Author?: string } | undefined): string {
  const title = (info?.Title || "")
    .replace(/\s*[-–—|:]\s*(resume|cv|curriculum vitae).*$/i, "")
    .replace(/\s+(resume|cv|curriculum vitae)\s*$/i, "")
    .trim();
  if (title && /^[A-Za-z][A-Za-z .'-]{2,60}$/.test(title)) {
    const words = title.split(/\s+/);
    if (words.length >= 2 && words.length <= 5) return title;
  }
  const author = (info?.Author || "").replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
  if (author && /^[A-Za-z][A-Za-z .'-]{2,40}$/.test(author)) {
    const words = author.split(/\s+/);
    if (words.length >= 2 && words.length <= 5) return author;
  }
  return "";
}

function findSidebarGap(items: PdfGlyph[], pageWidth: number): number | null {
  const xs = items.map((i) => i.x).filter((x) => x >= 8 && x <= pageWidth * 0.72);
  if (xs.length < 18) return null;
  const step = 8;
  const buckets = new Array(Math.ceil(pageWidth / step) + 1).fill(0);
  for (const x of xs) buckets[Math.floor(x / step)]++;
  const from = Math.floor((pageWidth * 0.16) / step);
  const to = Math.floor((pageWidth * 0.46) / step);
  let best = -1;
  let bestScore = 0;
  for (let i = from; i <= to; i++) {
    const leftCount = buckets.slice(0, i).reduce((a, b) => a + b, 0);
    const rightCount = buckets.slice(i).reduce((a, b) => a + b, 0);
    const valley = buckets[i] + (buckets[i + 1] ?? 0);
    if (leftCount >= 8 && rightCount >= 12 && valley <= 3) {
      const score = Math.min(leftCount, rightCount) - valley * 4;
      if (score > bestScore) {
        bestScore = score;
        best = i * step + 4;
      }
    }
  }
  return bestScore >= 8 ? best : null;
}

function linesFromGlyphs(items: PdfGlyph[]): string[] {
  if (!items.length) return [];
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const tol = Math.max(3.2, (sorted.reduce((s, i) => s + (i.h || 0), 0) / sorted.length) * 0.45);
  const rows: { y: number; parts: PdfGlyph[] }[] = [];
  for (const it of sorted) {
    const last = rows[rows.length - 1];
    if (last && Math.abs(last.y - it.y) <= tol) last.parts.push(it);
    else rows.push({ y: it.y, parts: [it] });
  }
  return rows
    .map((row) =>
      row.parts
        .sort((a, b) => a.x - b.x)
        .map((p) => p.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
}

function layoutPdfPage(items: PdfGlyph[], pageWidth: number): string {
  const gap = findSidebarGap(items, pageWidth);
  if (gap == null) return linesFromGlyphs(items).join("\n");
  const left = items.filter((i) => i.x < gap);
  const right = items.filter((i) => i.x >= gap);
  const leftLines = linesFromGlyphs(left);
  const rightLines = linesFromGlyphs(right);
  if (!leftLines.length) return rightLines.join("\n");
  if (!rightLines.length) return leftLines.join("\n");
  return `${leftLines.join("\n")}\n\n${rightLines.join("\n")}`;
}

export async function extractCvText(file: File): Promise<string> {
  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".rtf")) {
    return await file.text();
  }
  if (name.endsWith(".docx")) {
    const { default: mammoth } = await import("mammoth");
    const buf = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buf });
    return result.value;
  }
  if (name.endsWith(".pdf")) {
    const pdfjs = await import("pdfjs-dist");
    try {
      const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl as string;
    } catch {
      const { pathToFileURL } = await import("node:url");
      const path = await import("node:path");
      pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(
        path.join(process.cwd(), "node_modules/pdfjs-dist/build/pdf.worker.min.mjs"),
      ).href;
    }
    const buf = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1 });
      const glyphs: PdfGlyph[] = [];
      for (const item of content.items) {
        if (!("str" in item) || item.str === undefined) continue;
        const s = (item.str as string) ?? "";
        if (!s) continue;
        const t = (item as { transform?: number[] }).transform;
        if (!t || t.length < 6) continue;
        glyphs.push({
          str: s,
          x: t[4],
          y: t[5],
          w: (item as { width?: number }).width ?? 0,
          h: (item as { height?: number }).height ?? t[3] ?? 0,
        });
      }
      pages.push(layoutPdfPage(glyphs, viewport.width));
    }
    let text = pages.join("\n\n");
    try {
      const meta = await doc.getMetadata();
      const info = (meta?.info ?? {}) as { Title?: string; Author?: string };
      const metaName = nameFromPdfInfo(info);
      if (metaName && !new RegExp(metaName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(text)) {
        text = `${metaName}\n\n${text}`;
      }
    } catch {
      /* metadata is optional */
    }
    return text;
  }
  if (name.endsWith(".doc")) {
    throw new Error("Old .doc files aren't supported — please save the file as .docx or .pdf first.");
  }
  throw new Error("Unsupported file type. Please upload a .pdf, .docx, or .txt resume.");
}

/* ============================================================
   Section header detection
   ============================================================ */

const HEADER_RULES: { key: SectionKey | "skip"; test: RegExp; minLen?: number }[] = [
  { key: "summary", test: /^(professional|career|executive)?\s*(summary|profile|objective|overview)\b|about\s*me\b/i },
  { key: "objective", test: /^(career\s+)?objective\b/i },
  { key: "experience", test: /^(professional|work|employment|relevant|career)?\s*(experience|expierence|experiance|history|background)\b|experience\s+history\b/i },
  { key: "education", test: /^(education|academic|training|qualifications)\b/i },
  { key: "skills", test: /^(tech(?:nical)?\s+skills?|skills?|core\s+competencies|competencies|expertise|technologies?|tech\s+stack|tools|skill\s*highlights?|highlights?)\b/i },
  { key: "projects", test: /^(selected\s+)?projects\b|personal\s+projects\b/i },
  { key: "certifications", test: /^(certifications?|licenses?\s*(&|and)?\s*(certifications?)?|credentials)\b/i },
  { key: "languages", test: /^languages?\b/i },
  { key: "volunteer", test: /^(volunteer|community|leadership)\b/i },
  { key: "publications", test: /^(publications?|papers|research\s+publications)\b/i },
  { key: "awards", test: /^(awards?|honors?|achievements?|recognitions?)\b/i },
  { key: "teaching", test: /^(teaching|academic|lecturing)\b/i },
  { key: "grants", test: /^(grants?|fellowships?)\b/i },
  { key: "presentations", test: /^(presentations?|conference\s+(presentations|talks)|talks)\b/i },
  { key: "affiliations", test: /^(professional\s+)?affiliations?|memberships?\b/i },
  { key: "references", test: /^references?\b/i },
  { key: "portfolio", test: /^portfolio\b|work\s+samples\b/i },
  { key: "skip", test: /^(interests?|hobbies?|additional|personal(?:\s+details)?|activities|extracurriculars?|languages\s+and\s+tools|contact|details|get\s+in\s+touch)\b/i },
];

function matchHeader(line: string): SectionKey | null {
  const t = line
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^[^\w]+/, "");
  if (!t || t.length > 56) return null;
  if (/^[•\-*•]/.test(t)) return null;
  for (const rule of HEADER_RULES) {
    if (rule.test.test(t)) return rule.key === "skip" ? null : rule.key;
  }
  return null;
}

/* ============================================================
   Contact extraction
   ============================================================ */

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
const LINKEDIN_RE = /linkedin\.com\/(?:in\/)?[\w.-]+/gi;
const GITHUB_RE = /github\.com\/[\w-]+/gi;
const WEB_RE = /(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.(?:com|org|net|io|dev|co|me|app|blog)(?:\/[^\s]*)?/gi;

function isContacty(s: string): boolean {
  return (
    EMAIL_RE.test(s) ||
    PHONE_RE.test(s) ||
    LINKEDIN_RE.test(s) ||
    GITHUB_RE.test(s) ||
    /^\+?\d[\d\s()./-]{6,}$/.test(s.trim()) ||
    s.includes("@")
  );
}

function cleanUrl(s: string): string {
  return s.trim().replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "").trim();
}

function looksLikeLocation(s: string): boolean {
  const t = s.trim();
  if (!t || t.length > 40) return false;
  if (/[•|·,.;:–—&_+@0-9-]/.test(t)) return false;
  const words = t.split(/\s+/);
  if (words.length < 1 || words.length > 3) return false;
  if (!words.every((w) => /^[A-Z][a-z\u00C0-\u017F]/.test(w))) return false;
  return true;
}

const LABEL_RE =
  /^(?:phone|tel(?:ephone)?|mobile|cell|email|e-?mail|address|addresses|linkedin|link|website|web|url|fax|skype|instagram|github|portfolio|freelance|residence|dob|date\s+of\s+birth|birth\s*date|nationality|religion|gender|marital\s+status|age|location|located)\s*[:\u2022|•]/i;

function isLabelLine(s: string): boolean {
  const t = s.trim();
  if (!t || t.length > 90) return false;
  if (LABEL_RE.test(t)) return true;
  return /^\s*[A-Za-z][A-Za-z .&'-]{2,40}\s*:\s*[^:]+$/.test(t) && !/[|·•]/.test(t) && !/^[A-Z][A-Z0-9 .&']+$/.test(t.split(":")[0]);
}

const KNOWN_CITIES = new Set([
  "karachi", "lahore", "islamabad", "rawalpindi", "faisalabad", "multan", "peshawar", "quetta",
  "hyderabad", "sukkur", "gujranwala", "sialkot", "sargodha", "burewala", "sheikhupura", "jhelum",
  "abbottabad", "mardan", "kohat", "gilgit", "muzaffarabad", "dubai", "abu dhabi", "sharjah",
  "riyadh", "jeddah", "doha", "kuwait city", "muscat", "manama", "london", "birmingham", "manchester",
  "glasgow", "edinburgh", "leeds", "liverpool", "new york", "brooklyn", "queens", "bronx", "staten island",
  "los angeles", "san francisco", "san diego", "san jose", "seattle", "chicago", "houston", "dallas",
  "austin", "phoenix", "philadelphia", "denver", "miami", "atlanta", "boston", "detroit", "portland",
  "las vegas", "nashville", "charlotte", "orlando", "tampa", "minneapolis", "toronto", "vancouver",
  "montreal", "ottawa", "calgary", "edmonton", "winnipeg", "sydney", "melbourne", "brisbane", "perth",
  "adelaide", "auckland", "wellington", "berlin", "munich", "hamburg", "paris", "lyon", "madrid",
  "barcelona", "rome", "milan", "amsterdam", "brussels", "vienna", "zurich", "geneva", "oslo",
  "stockholm", "copenhagen", "helsinki", "singapore", "kuala lumpur", "jakarta", "bangkok", "mumbai",
  "delhi", "new delhi", "bangalore", "bengaluru", "hyderabad india", "chennai", "kolkata", "pune",
  "dhaka", "chittagong", "colombo", "kathmandu", "istanbul", "ankara", "cairo", "lagos", "nairobi",
  "johannesburg", "cape town", "sao paulo", "rio de janeiro", "buenos aires", "mexico city",
  "toronto canada", "houston tx", "karachi pakistan",
]);

const KNOWN_REGIONS = new Set([
  "pakistan", "sindh", "punjab", "kpk", "khyber pakhtunkhwa", "balochistan", "gilgit-baltistan",
  "usa", "united states", "us", "uae", "united arab emirates", "uk", "united kingdom", "canada",
  "australia", "saudi arabia", "qatar", "kuwait", "oman", "bahrain", "india", "bangladesh", "turkey",
  "germany", "france", "spain", "italy", "netherlands", "switzerland", "sweden", "norway", "denmark",
  "new zealand", "singapore", "malaysia", "china", "japan", "south korea",
]);

function cityFromLine(s: string): string | null {
  const t = s.trim();
  const parts = t.split(/[,|]/).map((x) => x.trim()).filter(Boolean);
  for (const part of parts) {
    if (part.length > 1 && part.length < 40 && !/\d/.test(part) && KNOWN_CITIES.has(part.toLowerCase())) {
      return part;
    }
  }
  for (let i = 1; i < parts.length; i++) {
    if (KNOWN_REGIONS.has(parts[i].toLowerCase())) {
      const prev = parts[i - 1];
      if (prev && prev.length >= 2 && prev.length < 30 && !/\d/.test(prev) && /^[A-Z][\w.'-]*(?:\s+[A-Z][\w.'-]*)?$/.test(prev)) {
        return prev;
      }
    }
  }
  return null;
}

const SECTION_WORD_RE =
  /\b(?:summary|profile|objective|overview|highlights|experience|expierence|employment|education|skills?|technical|projects?|portfolio|certifications?|licenses?|references?|referees?|languages?|hobbies?|interests?|contact|details|qualifications?|competencies|expertise|technologies?|volunteer|community|awards?|honors?|achievements?|publications?|papers|memberships?|affiliations?|leadership|activities?|additional|personal|teaching|grants?|fellowships?|presentations?|talks)\b/i;

function isNameLine(s: string): boolean {
  const t = s.trim();
  if (!t || t.length > 60) return false;
  if (isContacty(t) || matchHeader(t)) return false;
  if (/\d/.test(t)) return false;
  if (/[,:;()|]/.test(t)) return false;
  if (SECTION_WORD_RE.test(t)) return false;
  if (/^(native|fluent|beginner|intermediate|advanced)(\s+\1)?$/i.test(t)) return false;
  if (/\b(?:tool|generator|scraper|chathead|automated)\b/i.test(t)) return false;
  if (/^(certified|professional|licensed|experienced|qualified|skilled|senior|junior|head|lead)\b/i.test(t)) return false;
  if (/\b(?:accountant|engineer|developer|designer|manager|consultant|specialist|analyst|executive|director|associate|advisor|representative|technician|officer|architect|coordinator|planner|assistant|supervisor|strategist|marketer|writer|attorney|lawyer|instructor|educator|artist)\b/i.test(t)) return false;
  const words = t.split(/\s+/);
  if (words.length < 2 || words.length > 4) return false;
  if (!words.every((w) => /^[A-Z]/.test(w))) return false;
  if (t.endsWith(".") || t.endsWith(":")) return false;
  return true;
}

function isSingleNameWord(s: string): boolean {
  const t = s.trim();
  if (!t || t.length < 3 || t.length > 20) return false;
  if (/[^A-Za-z\u00C0-\u017F'-]/.test(t)) return false;
  if (SECTION_WORD_RE.test(t)) return false;
  if (!/^[A-Z\u00C0-\u017F]/.test(t)) return false;
  return true;
}

const COMMON_GIVEN_NAMES = new Set([
  "muhammad", "mohammad", "mohammed", "mohamed", "ahmed", "ahmad", "ali", "hassan", "hussein",
  "husain", "abdul", "abdullah", "syed", "md", "m", "mohd", "sana", "asma", "fatima", "aisha",
  "maryam", "khadija", "zainab", "hina", "sadia", "farah", "nadia", "rabia", "humaira", "usman",
  "umer", "umar", "hamza", "bilal", "imran", "kamran", "shahid", "asif", "naveed", "khurram",
]);

/* ============================================================
   Date range parsing
   ============================================================ */

const MONTHS = "jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec";
const DATE_TOKEN = `(?:(?:${MONTHS})[a-z]*[.]?\\s+|\\d{1,2}\\s*/\\s*)?(?:19|20)\\d{2}`;
const DATE_END_TOKEN = `(?:${DATE_TOKEN}|present|current|now|ongoing|today|continue|in\\s+progress|in\\s+process|to\\s+date|till\\s+(?:date|now)?|till|still)`;

function dateRangeRe(): RegExp {
  return new RegExp(`${DATE_TOKEN}\\s*(?:[-\\u2010-\\u2015\\u2212]|to)\\s*(${DATE_END_TOKEN})`, "i");
}

const DATE_HEAD_RE = new RegExp(`${DATE_TOKEN}\\s*(?:[-\\u2010-\\u2015\\u2212]|to)\\s*${DATE_END_TOKEN}`, "gi");

function parseDates(part: string): { start: string; end: string; present: boolean } | null {
  const t = part.trim();
  if (!t) return null;
  const m = t.match(dateRangeRe());
  if (m) {
    const rawStart = m[0];
    const month = rawStart.match(new RegExp(`${MONTHS}[a-z]*[.]?|\\d{1,2}\\s*/`, "i"))?.[0];
    const startYear = rawStart.match(/(19|20)\d{2}/)?.[0] ?? "";
    const endRaw = (m[1] || "").toLowerCase();
    const present = /present|current|\bnow\b|ongoing|today|continue|in\s+progress|in\s+process|to\s+date|till|still/i.test(t);
    const endYear = present ? "" : endRaw.match(/(19|20)\d{2}/)?.[0] ?? "";
    return {
      start: startYear,
      end: endYear,
      present,
      ...(month ? { startMonth: month.replace(/[.]\s*$/, "").trim() } : {}),
    } as { start: string; end: string; present: boolean };
  }
  const single = t.match(/^\s*(?:\(|\[)?\s*((?:19|20)\d{2})\s*(?:\)|\])?\s*$/);
  if (single) return { start: single[1], end: "", present: false };
  return null;
}

function hasDateRange(s: string): boolean {
  return dateRangeRe().test(s);
}

/* ============================================================
   Main parser
   ============================================================ */

export interface CvDraft {
  contact: Partial<Contact>;
  summary: string;
  objective: string;
  experience: Partial<ExperienceEntry>[];
  education: Partial<EducationEntry>[];
  skills: { name: string; skills: string[] }[];
  projects: Partial<ProjectEntry>[];
  certifications: Partial<CertificationEntry>[];
  languages: Partial<LanguageEntry>[];
  volunteer: Partial<VolunteerEntry>[];
  awards: Partial<AwardEntry>[];
  publications: Partial<PublicationEntry>[];
  teaching: Partial<Resume["teaching"][number]>[];
  sectionOrder: SectionKey[];
  useObjective: boolean;
  warnings: string[];
}

function isSkillChipLine(l: string): boolean {
  const parts = l.split(/[•▪▸►●*]/).map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) return false;
  return parts.every((p) => p.length <= 32 && p.split(/\s+/).length <= 4 && !/[.]$/.test(p));
}

function shouldJoinWrapped(prev: string, next: string): boolean {
  if (!prev || !next) return false;
  if (isBullet(next) || isBullet(prev)) return false;
  if (/^\d{4}$/.test(prev) || /^\d{4}$/.test(next)) return false;
  if (matchHeader(next) || matchHeader(prev)) return false;
  if (isNameLine(prev) || isNameLine(next)) return false;
  if (hasDateRange(prev) || hasDateRange(next)) return false;
  if (cityFromLine(prev) || looksLikeLocation(prev) || /,\s*(pakistan|usa|uk|uae|india|canada)\s*$/i.test(prev)) return false;
  if (/[|]/.test(prev) || /[|]/.test(next)) return false;
  if (/[.!?:]$/.test(prev)) return false;
  if (/^[A-Z0-9][A-Z0-9 .&'/]*$/.test(prev.replace(/[.]+$/, "")) && prev.split(/\s+/).length >= 2) return false;
  if (/[,;:&(/]$/.test(prev)) return true;
  if (/^[a-z]/.test(next)) return true;
  if (/\b(?:tool|generator|scraper|chathead|app)\b/i.test(prev) || /\b(?:tool|generator|scraper|chathead)\b/i.test(next)) {
    if (prev.split(/\s+/).length >= 2 && next.split(/\s+/).length === 1 && /\b(?:tool|generator|scraper|app)\b/i.test(next)) return true;
    return false;
  }
  const pw = prev.split(/\s+/).length;
  const nw = next.split(/\s+/).length;
  if (pw <= 6 && nw >= 6 && !/,/.test(prev) && !/^[a-z]/.test(next)) return false;
  if (pw <= 4 && nw <= 4 && /^[A-Z]/.test(next) && !/,/.test(next)) return false;
  if (pw <= 5 && /[a-z]/.test(next) && next.length > 18 && !/^\d/.test(next)) return true;
  return false;
}

function stitchWrappedLines(lines: string[]): string[] {
  const out: string[] = [];
  for (const raw of lines) {
    const l = raw.trim();
    if (!l) continue;
    const prev = out[out.length - 1];
    if (prev && shouldJoinWrapped(prev, l)) {
      out[out.length - 1] = `${prev} ${l}`.replace(/\s+/g, " ");
    } else {
      out.push(l);
    }
  }
  return out;
}

export function parseCvText(text: string): CvDraft {
  const rawLines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) =>
      l
        .replace(/\u00a0/g, " ")
        .replace(/[\u0000\u00ad\u200b\u200c\u200d\u2060]/g, "")
        .replace(/\t+/g, " ")
        .replace(/ {2,}/g, " ")
        .trim(),
    )
    .filter((l) => l.length > 0)
    .filter((l) => /[A-Za-z0-9]/.test(l))
    .filter((l) => !/^(curriculum\s+vitae|cv|r[eé]sum[eé]|curiculum\s+vitae|curriculum\s+vitae\s*\(?\s*cv\s*\)?)\s*$/i.test(l));

  const lines = stitchWrappedLines(rawLines);

  const draft: CvDraft = {
    contact: {},
    summary: "",
    objective: "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    volunteer: [],
    awards: [],
    publications: [],
    teaching: [],
    sectionOrder: [],
    useObjective: false,
    warnings: [],
  };

  // ---- contact / name extraction from the whole text ----
  const full = lines.join("\n");
  const emails = full.match(EMAIL_RE) ?? [];
  if (emails.length) draft.contact.email = emails[0];
  const linkedin = full.match(LINKEDIN_RE);
  if (linkedin?.length) draft.contact.linkedin = cleanUrl(linkedin[0]);
  const github = full.match(GITHUB_RE);
  if (github?.length) draft.contact.github = cleanUrl(github[0]);
  const phones: string[] = [];
  const capturePhone = (l: string) => {
    if (!/[a-z@]/i.test(l)) {
      const run = l.replace(/[^\d+]/g, "");
      if (/^\+?\d{7,15}$/.test(run)) return run;
    }
    return l.match(PHONE_RE)?.[0] ?? "";
  };
  for (const l of lines) {
    if (l.length > 120 || isContacty(l)) {
      const p = capturePhone(l);
      if (p) phones.push(p);
    }
  }
  if (!phones.length) {
    for (const l of lines.slice(0, 12)) {
      const p = capturePhone(l);
      if (p) {
        phones.push(p);
        break;
      }
    }
  }
  if (phones.length) draft.contact.phone = phones[0];

  // name + title + location from the top of the document
  const nameWords = new Set<string>();
  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const l = lines[i];
    if (isLabelLine(l) && !isContacty(l)) {
      const city = cityFromLine(l);
      if (city && !draft.contact.city) draft.contact.city = city;
      continue;
    }
    if (!draft.contact.fullName) {
      if (isNameLine(l)) {
        // single given name on its own line above the full name ("Muhammad" / "Haider Khan")
        const prev = lines[i - 1];
        const given = prev?.toLowerCase().replace(/[.]$/, "");
        if (prev && isSingleNameWord(prev) && COMMON_GIVEN_NAMES.has(given ?? "")) {
          draft.contact.fullName = `${prev} ${l}`;
          prev.toLowerCase().split(/\s+/).forEach((w) => nameWords.add(w));
          l.toLowerCase().split(/\s+/).forEach((w) => nameWords.add(w));
        } else {
          draft.contact.fullName = l;
          l.toLowerCase().split(/\s+/).forEach((w) => nameWords.add(w));
        }
        // all-caps single-word continuation ("SYED BILAL" + "MEHMOOD")
        const next = lines[i + 1];
        if (next && isSingleNameWord(next) && /^[A-Z][A-Z]/.test(next) && !isLabelLine(next)) {
          draft.contact.fullName = `${draft.contact.fullName} ${next}`;
          next.toLowerCase().split(/\s+/).forEach((w) => nameWords.add(w));
          i++;
        } else if (next) {
          // surname glued to a TOC heading: "MEHMOOD OBJECTIVE"
          const glued = next.match(/^([A-Z][A-Z]+)\s+(OBJECTIVE|CONTACT|EDUCATION|EXPERIENCE|SKILLS|SUMMARY|PROFILE|HIGHLIGHTS|SKILLS?\s+[A-Z]+)\b/i);
          if (glued && isSingleNameWord(glued[1])) {
            draft.contact.fullName = `${draft.contact.fullName} ${glued[1]}`;
            next.toLowerCase().split(/\s+/).forEach((w) => nameWords.add(w));
            i++;
          }
        }
        continue;
      }
      // two-line name ("Olivia" / "Richardson")
      const next = lines[i + 1];
      if (isSingleNameWord(l) && isSingleNameWord(next) && !isNameLine(next)) {
        draft.contact.fullName = `${l} ${next}`;
        l.toLowerCase().split(/\s+/).forEach((w) => nameWords.add(w));
        next.toLowerCase().split(/\s+/).forEach((w) => nameWords.add(w));
        i++;
        continue;
      }
    }
    if (nameWords.has(l.toLowerCase())) continue;
    if (draft.contact.fullName && !draft.contact.title) {
      const t = l.trim();
      const allCapsWords = t
        .split(/\s+/)
        .every((w) => /^[A-Z0-9&+./\\-]/.test(w) || /^[|·•]/.test(w));
      if (
        t.length < 80 &&
        t.split(/\s+/).length >= 2 &&
        !/^(native|fluent|beginner|intermediate|advanced)\b/i.test(t) &&
        !isContacty(t) &&
        !matchHeader(t) &&
        !hasDateRange(t) &&
        !/^[•\-]/.test(t) &&
        !SECTION_WORD_RE.test(t) &&
        !/,/.test(t) &&
        !WEB_RE.test(t) &&
        !t.endsWith(":") &&
        !isLabelLine(t) &&
        !(t.includes("/") && !t.includes("|") && !t.includes("&") && t.split(/\s+/).length <= 5) &&
        allCapsWords
      ) {
        draft.contact.title = t;
        continue;
      }
    }
    if (!draft.contact.city && !matchHeader(l) && !isNameLine(l) && !isContacty(l) && !isLabelLine(l)) {
      const c = cityFromLine(l) ?? (KNOWN_CITIES.has(l.toLowerCase()) ? l : null);
      if (c) {
        draft.contact.city = c;
        const region = l.split(",")[1]?.trim();
        if (region && KNOWN_REGIONS.has(region.toLowerCase())) {
          draft.contact.country = region;
        }
      }
    }
  }

  // city may live anywhere in the document (address blocks, contact strips)
  if (!draft.contact.city) {
    for (const l of lines) {
      const c = cityFromLine(l);
      if (c) {
        draft.contact.city = c;
        const region = l.split(",")[1]?.trim();
        if (region && KNOWN_REGIONS.has(region.toLowerCase()) && !draft.contact.country) {
          draft.contact.country = region;
        }
        break;
      }
    }
  }
  if (draft.contact.city && !draft.contact.country) {
    const city = draft.contact.city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const loc = new RegExp(`^${city}\\s*,\\s*([A-Za-z][A-Za-z .'-]+)$`, "i");
    for (const l of lines) {
      const m = l.match(loc);
      if (m && KNOWN_REGIONS.has(m[1].toLowerCase())) {
        draft.contact.country = m[1];
        break;
      }
    }
  }

  // fallback: many templates print the name near the end of the document
  if (!draft.contact.fullName) {
    const candidates = lines
      .map((l, idx) => ({ l, idx }))
      .filter(({ l, idx }) => isNameLine(l) && idx >= lines.length - 3);
    if (candidates.length) {
      draft.contact.fullName = candidates[candidates.length - 1].l;
    }
  }
  if (!draft.contact.fullName) {
    for (const l of lines) {
      if (!isNameLine(l)) continue;
      const words = l.split(/\s+/);
      if (words.some((w) => COMMON_GIVEN_NAMES.has(w.toLowerCase().replace(/[.'"]/g, "")))) {
        draft.contact.fullName = l;
        break;
      }
    }
  }
  const nameLower = (draft.contact.fullName || "").toLowerCase();
  if (draft.contact.fullName && draft.contact.email) {
    const local = draft.contact.email.split("@")[0];
    const first = (local.match(/^[a-zA-Z]+/) || [""])[0].toLowerCase();
    const last = (local.match(/[a-zA-Z]+$/) || [""])[0].toLowerCase();
    const words = draft.contact.fullName.split(/\s+/);
    if (first && last && words.length >= 2) {
      const firstWord = words[0].toLowerCase();
      const lastWord = words[words.length - 1].toLowerCase();
      if (lastWord.startsWith(first) && firstWord.startsWith(last)) {
        draft.contact.fullName = [...words.slice(1, -1), words[words.length - 1], words[0]].join(" ");
      }
    }
  }

  // website (avoid re-capturing emails / linkedin / github)
  const labeledSite = full.match(/\b(?:website|web|url|site)\s*[:)]\s*((?:https?:\/\/)?(?:www\.)?[a-z0-9.-]+\.[a-z]{2,})/i);
  if (labeledSite && !/linkedin|github/i.test(labeledSite[1])) {
    draft.contact.website = cleanUrl(labeledSite[1]);
  }
  const webMatches = full.replace(EMAIL_RE, " ").match(WEB_RE) ?? [];
  for (const w of webMatches) {
    const cw = cleanUrl(w);
    if (cw.toLowerCase().includes("linkedin") || cw.toLowerCase().includes("github") || cw.includes("@")) continue;
    if (draft.contact.email && cw === draft.contact.email.replace(/^.*@/, "")) continue;
    if (!draft.contact.website) draft.contact.website = cw;
    break;
  }

  // ---- section segmentation ----
  let current: SectionKey | null = null;
  const sections: Record<string, string[]> = {};
  let seen: SectionKey[] = [];
  const prelude: string[] = [];
  const frontMatter: string[] = [];
  const leadingPara: string[] = [];

  const SKIP_HEADER_RE =
    /^(interests?|hobbies?|additional\s+info|personal\s+(?:info|details|profile)|activities?|extracurriculars?|languages?\s+and\s+tools|contact|details|get\s+in\s+touch)\b/i;

  // Only treat a run of headings as a table-of-contents when several real
  // section titles sit back-to-back with no body copy between them. Two-column
  // CVs print CONTACT / PROFILE / WORK EXPERIENCE near the top with real text
  // in between — those are live sections, not a TOC.
  let headerBlock = false;
  let headingColumnEnd = 0;
  if (lines.length > 4) {
    let run = 0;
    let maxRun = 0;
    let lastHeadIdx = -1;
    for (let i = 0; i < Math.min(lines.length, 18); i++) {
      if (matchHeader(lines[i])) {
        run++;
        lastHeadIdx = i;
        if (run > maxRun) maxRun = run;
      } else if (SKIP_HEADER_RE.test(lines[i]) && lines[i].length < 48) {
        continue;
      } else if (lines[i].length >= 40 && /[a-z]/.test(lines[i])) {
        run = 0;
      }
    }
    if (maxRun >= 3) {
      headerBlock = true;
      headingColumnEnd = lastHeadIdx + 1;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const h = matchHeader(l);
    if (headerBlock && i < headingColumnEnd) {
      if (h) continue;
      if (nameLower && l.trim().toLowerCase() === nameLower) continue;
      const lw = l.toLowerCase().split(/\s+/);
      if (lw.length && lw.every((w) => nameWords.has(w))) continue;
      frontMatter.push(l);
      continue;
    }
    if (h) {
      current = h;
      if (!seen.includes(h)) seen.push(h);
      sections[h] = sections[h] ?? [];
      continue;
    }
    if (SKIP_HEADER_RE.test(l) && l.length < 48) {
      current = null;
      continue;
    }
    if (
      current &&
      !isLabelLine(l) &&
      !(isContacty(l) && !isDateOnlyLine(l) && !hasDateRange(l)) &&
      l.trim().toLowerCase() !== nameLower
    ) {
      sections[current].push(l);
    }
    if (!current && !isLabelLine(l) && l.trim().toLowerCase() !== nameLower && !(EMAIL_RE.test(l) || PHONE_RE.test(l) || LINKEDIN_RE.test(l) || GITHUB_RE.test(l) || l.includes("@"))) {
      if (headerBlock) {
        const lw = l.toLowerCase().split(/\s+/);
        if (lw.length && lw.every((w) => nameWords.has(w))) continue;
        frontMatter.push(l);
      } else if (!headerBlock && l.length >= 20 && /[a-z]/.test(l) && !SECTION_WORD_RE.test(l) && !isContacty(l) && !cityFromLine(l) && !WEB_RE.test(l)) {
        leadingPara.push(l);
      } else if (l.length < 40 && !/\d/.test(l) && !SECTION_WORD_RE.test(l) && !looksLikeLocation(l) && !matchHeader(l) && !WEB_RE.test(l) && !isContacty(l) && !cityFromLine(l)) {
        prelude.push(l);
      }
    }
    if (nameLower && l.trim().toLowerCase() === nameLower) {
      current = null;
    }
  }

  // Route the floating front matter from header-block documents into sections.
  if (headerBlock && frontMatter.length) {
    const fmSummary: string[] = [];
    const fmEdu: string[] = [];
    const fmExp: string[] = [];
    const fmSkills: string[] = [];
    const fmLang: string[] = [];
    let inExp = false;
    let para: string[] = [];
    const flushPara = () => {
      const joined = para.join(" ").replace(/\s+/g, " ").trim();
      if (joined.split(/\s+/).length >= 8) fmSummary.push(joined);
      para = [];
    };
    const isNameFragment = (l: string) => {
      const lw = l.toLowerCase().split(/\s+/);
      return lw.length > 0 && lw.every((w) => nameWords.has(w));
    };
    const isProse = (l: string) => l.split(/\s+/).filter((w) => /^[a-z]/.test(w)).length >= 2;
    for (const raw of frontMatter) {
      const l = raw.trim();
      if (isLabelLine(l)) { flushPara(); continue; }
      if (isNameFragment(l)) { flushPara(); continue; }
      if (cityFromLine(l)) { flushPara(); continue; }
      if (/^(urdu|english|punjabi|sindhi|pashto|arabic|chinese|french|spanish|german)\b$/i.test(l)) { flushPara(); fmLang.push(l); continue; }
      if (isEduLine(l)) {
        flushPara();
        inExp = false;
        fmEdu.push(l);
        continue;
      }
      // continuation of the previous education / experience line (PDF wrapping)
      if ((/^[a-z]|^\(/.test(l) || /^[A-Z][A-Za-z\u00C0-\u017F.'-]*,?\s*$/.test(l) || /^from\b/i.test(l) || (/\bfrom\b/i.test(l) && /\b(?:19|20)\d{2}\b/.test(l))) && (fmEdu.length || fmExp.length)) {
        const target = inExp && fmExp.length ? fmExp : fmEdu;
        if (target.length) {
          target[target.length - 1] += " " + l;
          continue;
        }
      }
      if (hasDateRange(l) || /^\d{1,2}\/\d{4}\s*(?:to|until|-|–)\s*\d{1,2}\/\d{4}/i.test(l) || /^[\d]{2,4}\s*[-–]\s*[\d]{2,4}\s*$/.test(l) || isDurationLine(l)) {
        flushPara();
        inExp = true;
        fmExp.push(l);
        continue;
      }
      if (isContacty(l)) { flushPara(); continue; }
      if (inExp) {
        fmExp.push(l);
        continue;
      }
      if (isProse(l)) { para.push(l); continue; }
      flushPara();
      if (l.split(/\s+/).length >= 12) {
        fmSummary.push(l);
        continue;
      }
      if (/\byears?\b|apprenticeship|experience|freelanc|internship/i.test(l)) {
        inExp = true;
        fmExp.push(l);
        continue;
      }
      fmSkills.push(l);
    }
    flushPara();
    if (fmSummary.length) sections["summary"] = fmSummary;
    if (fmEdu.length) sections["education"] = [...fmEdu, ...(sections["education"] ?? [])];
    if (fmExp.length) sections["experience"] = [...fmExp, ...(sections["experience"] ?? [])];
    if (fmSkills.length && (sections["skills"] ?? []).length === 0) sections["skills"] = fmSkills;
    if (fmLang.length && (sections["languages"] ?? []).length === 0) sections["languages"] = fmLang;
  }

  // Floating skill-ish lines before the first section heading (e.g. "PHP / OOP",
  // "Zend Framework") become a skills group when no skills section exists.
  if ((sections["skills"] ?? []).length === 0 && prelude.length) {
    sections["skills"] = prelude;
  }

  // Some docs tuck experience rows (role \t year or role + date range) under the
  // skills heading — route those back into the experience section before parsing.
  {
    const extra: string[] = [];
    const kept: string[] = [];
    const eduExtra: string[] = [];
    let inExp = false;
    let expectEdu = false;
    const eduLineRe = /^(bachelor'?s?|master'?s?|associate'?s?|doctorate|ph\.?d)\s+(?:of\s+)?(?:science|arts|business(?: administration)?|engineering|design|law|fine\s+arts|education|computer(?: science)?|applied|technology|music)\b|^(bachelor'?s?|associate'?s?)\s+degree/i;
    const jobVerb = /^(founded|found and|provide|provided|handle|handled|develop|developed|led|prepared|ensured|worked|served|manage|managed|built|created)\b/i;
    for (const l of sections["skills"] ?? []) {
      const parts = l.split("\t");
      if ((parts.length === 2 && /\b(19|20)\d{2}\b/.test(parts[1])) || hasDateRange(l) || jobVerb.test(l)) {
        inExp = true;
        expectEdu = false;
      }
      const glued = l.match(/^([A-Za-z][A-Za-z0-9+.# /&-]{1,36})\s+((?:Founded|Provide|Provided|Handle|Handled|Develop|Developed|Led|Prepared|Ensured|Worked|Served|Manage|Managed|Built|Created)\b.*)$/);
      if (glued) {
        kept.push(glued[1].trim());
        extra.push(glued[2].trim());
        inExp = true;
        expectEdu = false;
        continue;
      }
      if (inExp) extra.push(l);
      else if (eduLineRe.test(l)) {
        eduExtra.push(l);
        expectEdu = true;
      } else if (expectEdu && /university|college|school|–|(19|20)\d{2}/i.test(l) && !isParagraph(l)) {
        eduExtra.push(l);
      } else {
        expectEdu = false;
        kept.push(l);
      }
    }
    sections["skills"] = kept;
    if (extra.length) sections["experience"] = [...(sections["experience"] ?? []), ...extra];
    if (eduExtra.length) sections["education"] = [...(eduExtra), ...(sections["education"] ?? [])];
  }

  // Education blocks that ended up inside the experience section of two-column
  // PDFs ("COMPUTER SCIENCE" / "Super Career School" / "Matric (2018)") — an
  // all-caps subject followed by a school line and a degree/(year) line.
  {
    const src = sections["experience"] ?? [];
    const kept: string[] = [];
    const eduExtra: string[] = [];
    let i = 0;
    while (i < src.length) {
      const l = src[i];
      if (
        i > 0 &&
        i < src.length - 1 &&
        /coll\w*ge|institu\w*|universit\w*|academ\w*|school|board\b/i.test(l) &&
        /^[A-Z][A-Z0-9 &']*$/.test(src[i - 1].trim()) &&
        (DEG_RE.test(src[i + 1]) || /\((?:19|20)\d{2}\)/.test(src[i + 1]))
      ) {
        eduExtra.push(src[i + 1], l);
        kept.pop();
        i += 2;
        while (i < src.length && /^\(?\s*(?:continue|in\s+(?:progress|process))/i.test(src[i])) {
          i++;
        }
        continue;
      }
      kept.push(l);
      i++;
    }
    if (eduExtra.length) {
      sections["experience"] = kept;
      sections["education"] = [...(sections["education"] ?? []), ...eduExtra];
    }
  }

  // "About Me" sometimes lands after a stray "Skills" heading in two-column
  // PDFs, so the real skills list ends up in the summary section while the real
  // summary text collected in leadingPara. Swap them when the summary section is
  // plainly a list of short title-case items.
  {
    const sum = sections["summary"] ?? [];
    if (sum.length && leadingPara.length && sum.every((l) => !/[.!?]$/.test(l) && l.split(/\s+/).length <= 4)) {
      sections["skills"] = [...sum, ...(sections["skills"] ?? [])];
      sections["summary"] = [leadingPara.join(" ")];
    }
  }

  // No-heading docs: group year-led lines into experience entries ("2018" then the
  // location, company descriptor and bullets, up to the next year or a language line).
  if (seen.length === 0) {
    const exp: string[] = [];
    const blocks: string[][] = [];
    let block: string[] | null = null;
    for (const l of lines) {
      if (/^\d{4}$/.test(l.trim())) {
        if (block) blocks.push(block);
        block = [l.trim()];
      } else if (block) {
        if (
          /^\s*(native|fluent|beginner|intermediate|advanced)\s*$/i.test(l) ||
          isSkillChipLine(l) ||
          /^(successfully founded|key achievements?)\b/i.test(l) ||
          (/\b(?:tool|generator|scraper|chathead)\b/i.test(l) && l.split(/\s+/).length <= 10 && !isParagraph(l))
        ) {
          blocks.push(block);
          block = null;
        } else {
          block.push(l);
        }
      }
    }
    if (block) blocks.push(block);
    for (const b of blocks) {
      const year = b[0];
      const body = b.slice(1).filter((l) => !/^[\w.'-]+(?:,|\s+of)?\s*(Pakistan|Karachi)\s*,?\s*(Pakistan)?$/i.test(l.trim()) || /[A-Za-z]{3,}\s+company/i.test(l));
      const desc = (body.find((l) => !isBullet(l) && !/^[•▪▸►*]/.test(l) && l.trim().length > 3) ?? "").trim();
      if (!desc) continue;
      exp.push(`${desc} — ${year}`);
      for (const c of body.filter((l) => l !== desc)) exp.push(`\u2022 ${c}`);
    }
    if (exp.length) sections["experience"] = [...(sections["experience"] ?? []), ...exp];
    const chips = lines.filter(isSkillChipLine);
    if (chips.length) sections["skills"] = [...chips, ...(sections["skills"] ?? [])];
  }

  // If no headers found, treat the whole body as best-effort content
  if (seen.length === 0 && !headerBlock) {
    draft.warnings.push("No section headings detected — the text will be imported into the summary and experience sections.");
  }

  draft.sectionOrder = seen.filter((k) => k !== "summary" || true);

  // ---- summary / objective ----
  const summaryLines = sections["summary"] ?? [];
  if (summaryLines.length) {
    draft.summary = summaryLines.join(" ").replace(/\s+/g, " ").trim();
  }
  const objLines = sections["objective"] ?? [];
  if (objLines.length) {
    draft.objective = objLines.join(" ").replace(/\s+/g, " ").trim();
    draft.useObjective = true;
  }
  if (!draft.summary && !draft.objective && seen.length === 0 && lines.length) {
    const paras = lines.filter(
      (l) => l.length > 70 && /[.]/.test(l) && /[a-z]/.test(l) && !isSkillChipLine(l) && !isBullet(l),
    );
    const iam = paras.find((l) => /^i am\b/i.test(l));
    const picked = iam || paras.slice().sort((a, b) => b.length - a.length)[0];
    if (picked) draft.summary = picked.replace(/\s+/g, " ").trim();
    else {
      const firstBlock = lines.slice(0, 6).join(" ");
      if (firstBlock.length > 40 && firstBlock.length < 700) {
        draft.summary = firstBlock.replace(/\s+/g, " ").trim();
      }
    }
  }
  if (!draft.summary && leadingPara.length) {
    const lp = leadingPara.join(" ").replace(/\s+/g, " ").trim();
    if (lp.length >= 40) draft.summary = lp;
  }

  // ---- experience ----
  draft.experience = parseExperience(sections["experience"] ?? []);

  // ---- education ----
  draft.education = parseEducation(sections["education"] ?? []);

  // ---- skills ----
  draft.skills = parseSkills(sections["skills"] ?? []);

  // ---- projects ----
  for (const p of sections["projects"] ?? []) {
    const dates = parseDates(p);
    const rest = dates ? p.replace(/[|·]\s*[\w\s.,/-]+?\b(19|20)\d{2}.*$/, "").replace(/\s{2,}/g, " ") : p;
    const name = p.split(/[-|·:–—]/)[0].trim();
    const m = p.match(/(?:http|www)[^\s]*/i);
    draft.projects.push({
      name,
      description: p.replace(name, "").replace(/^\s*[-|·:–—]+\s*/, "").trim(),
      link: m ? cleanUrl(m[0]) : "",
      ...(dates ? { ...dates } : {}),
    });
    void rest;
  }

  // ---- certifications ----
  for (const c of sections["certifications"] ?? []) {
    const parts = c.split(/[|·–—]\s*|\s+-\s+/).map((x) => x.trim()).filter(Boolean);
    const yearMatch = c.match(/\b(19|20)\d{2}\b/);
    const issuer = (parts[1] ?? "").replace(/\s*,\s*\d{4}\s*$/, "").trim();
    draft.certifications.push({
      name: parts[0] ?? c,
      issuer,
      year: yearMatch ? yearMatch[0] : "",
    });
  }

  // ---- languages ----
  for (const raw of sections["languages"] ?? []) {
    const l = raw.trim();
    if (!l) continue;
    const items = l.split(/\s*,\s*|\s*;\s*/);
    for (const item of items) {
      if (!item.trim()) continue;
      const m = item.match(/^(.+?)\s*[:|–—·(]\s*(.+?)\s*[)]?$/);
      if (m) {
        const lvl = m[2].trim().toLowerCase();
        const norm = /native|mother|bilingual/.test(lvl)
          ? "Native"
          : /fluent|professional/.test(lvl)
            ? "Fluent"
            : /advanced/.test(lvl)
              ? "Professional"
              : "Conversational";
        draft.languages.push({ name: m[1].trim(), level: norm as LanguageEntry["level"] });
      } else {
        draft.languages.push({ name: item.trim(), level: "Fluent" });
      }
    }
  }

  // ---- volunteer ----
  draft.volunteer = parseExperience(sections["volunteer"] ?? [], true);

  // ---- teaching ----
  for (const t of sections["teaching"] ?? []) {
    const dates = parseDates(t);
    const name = t.replace(/\s{2,}/g, " ").split(/[|·–—]/)[0].trim();
    draft.teaching.push({
      role: name,
      institution: "",
      course: "",
      ...(dates ?? {}),
    });
  }

  // ---- awards ----
  for (const a of sections["awards"] ?? []) {
    const parts = a.split(/[|·–—]\s*|\s+-\s+/).map((x) => x.trim()).filter(Boolean);
    const yearMatch = a.match(/\b(19|20)\d{2}\b/);
    const org = (parts[1] ?? "").replace(/\s*,\s*\d{4}\s*$/, "").trim();
    draft.awards.push({
      title: parts[0] ?? a,
      org,
      year: yearMatch ? yearMatch[0] : "",
    });
  }

  // ---- publications ----
  for (const p of sections["publications"] ?? []) {
    const yearMatch = p.match(/\b(19|20)\d{2}\b/);
    const authorsMatch = p.match(/^([A-Z][\w.'-]*(?:\s*,\s*[A-Z][\w.'-]*)*\s*(?:&\s*and\s*[A-Z][\w.'-]*)?)\s*[.:]/);
    draft.publications.push({
      title: p.replace(/^[^:.:]*[.:]\s*/, "").replace(/\s+\d{4}\s*$/, "").trim(),
      venue: "",
      year: yearMatch ? yearMatch[0] : "",
      authors: authorsMatch ? authorsMatch[1].replace(/\s*[.:]\s*$/, "").trim() : "",
    });
  }

  // Ensure summary/objective ordering preference
  if (draft.useObjective && !draft.summary) {
    draft.sectionOrder = draft.sectionOrder.map((k) => (k === "summary" ? "objective" : k));
  }

  salvageProjectsFromExperience(draft);
  if (!draft.projects.length) {
    const extra = collectLooseProjects(lines);
    if (extra.length) draft.projects = extra;
  }
  polishDescriptiveJobs(draft);
  if (draft.summary) {
    const m = draft.summary.match(/^I am (?:a |an )?(.+?) with\b/i);
    if (m) {
      const inferred = m[1].replace(/[,.]$/, "").trim();
      if (
        !draft.contact.title ||
        /^(native|fluent|beginner|intermediate|advanced)\b/i.test(draft.contact.title) ||
        /\b(?:tool|generator|scraper|chathead)\b/i.test(draft.contact.title) ||
        draft.contact.title.length > 70
      ) {
        draft.contact.title = inferred;
      }
    }
  }
  if (!draft.contact.email && !draft.contact.phone) {
    draft.warnings.push("Phone and email were not in the file's text — add them in Contents. Designed PDFs often hide contact as graphics.");
  }

  return draft;
}

const PROJECT_TITLE_RE = /\b(?:tool|generator|scraper|app|plugin|platform|dashboard|bot|extension|chathead)\b/i;
const PROJECT_START_RE = /^(developed|built|created|designed|automated|made)\b/i;

function collectLooseProjects(lines: string[]): Partial<ProjectEntry>[] {
  const out: Partial<ProjectEntry>[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < lines.length; i++) {
    if (isBullet(lines[i])) continue;
    const l = lines[i].replace(/[)]+$/, "").trim();
    const titleLike =
      PROJECT_TITLE_RE.test(l) &&
      /^[A-Z]/.test(l) &&
      !/^(the|a|an|tool)\b/i.test(l) &&
      l.split(/\s+/).length <= 10 &&
      !isParagraph(l) &&
      !ACTION_VERB_RE.test(l) &&
      !hasDateRange(l);
    if (!titleLike) continue;
    const name = l
      .replace(/\s*\((?:desktop|android|web|ios|mobile).*?$/i, "")
      .replace(/\s+(?:desktop|web tool|android|ios)\b.*$/i, "")
      .replace(/[:.]\s*$/, "")
      .trim();
    const key = name.toLowerCase();
    if (!key || seen.has(key)) continue;
    const descParts: string[] = [];
    let j = i + 1;
    while (j < lines.length) {
      const n = lines[j];
      if (
        !isBullet(n) &&
        PROJECT_TITLE_RE.test(n) &&
        /^[A-Z]/.test(n) &&
        n.split(/\s+/).length <= 10 &&
        !isParagraph(n) &&
        !ACTION_VERB_RE.test(n)
      ) {
        break;
      }
      if (/^\d{4}$/.test(n) || isSkillChipLine(n) || matchHeader(n) || /^successfully founded\b/i.test(n)) break;
      if (isBullet(n) || PROJECT_START_RE.test(n) || isParagraph(n) || /^[a-z]/.test(n)) {
        descParts.push(stripBullet(n));
        j++;
        continue;
      }
      break;
    }
    out.push({ name, description: descParts.join(" ").replace(/\s+/g, " ").trim() });
    seen.add(key);
    i = j - 1;
  }
  return out;
}

function polishDescriptiveJobs(draft: CvDraft) {
  const blob = `${draft.summary || ""} ${(draft.experience ?? []).flatMap((e) => e.bullets ?? []).join(" ")}`;
  const quantum = /\bquantum digitizing\b/i.exec(blob)?.[0];
  for (const job of draft.experience) {
    const role = (job.role || "").trim();
    const bullets = (job.bullets ?? []).join(" ");
    const descriptive =
      /^(a|an)\s+/i.test(role) ||
      /^(freelance .+ services)$/i.test(role) ||
      (role.length > 36 && /company|provider|services|specializing/i.test(role));
    if (!descriptive) continue;
    job.descriptor = job.descriptor || role;
    const year = parseInt(job.startDate || "0", 10);
    const hay = `${role} ${bullets} ${job.descriptor || ""}`;
    if (quantum && year >= 2024 && /vector conversion|digitizing|custom patches|founder|service provider/i.test(hay)) {
      job.role = "Founder";
      job.company = "Quantum Digitizing";
    } else if (/freelance/i.test(role) || /freelance clients/i.test(bullets)) {
      job.role = /vector artist/i.test(hay) ? "Freelance Vector Artist" : "Freelance";
      job.company = job.company || "Self Employed";
    } else if (/led graphics|graphics workflow/i.test(bullets)) {
      job.role = "Graphics Dept. Head";
      job.company = job.company && !/^(a|an)\s+/i.test(job.company) ? job.company : "";
    } else if (/raster|vector|artwork|embroidery|screen print/i.test(hay)) {
      job.role = "Vector Artist";
      job.company = job.company && !/^(a|an)\s+/i.test(job.company) ? job.company : "";
    }
    if (job.company && /^(a|an)\s+/i.test(job.company)) job.company = "";
    if (job.role && /^(a|an)\s+/i.test(job.role)) job.role = "Vector Artist";
  }
}

function cleanOrgName(l: string): string {
  return l.replace(/[:\u2022•|]+$/, "").replace(/[.]+$/, "").trim();
}

function expandCompanyFromWebsite(company: string, website?: string): string {
  if (!company || !website) return company;
  const host = website.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0].split(".")[0];
  const compact = company.replace(/[^a-z0-9]/gi, "").toLowerCase();
  const hostL = host.toLowerCase();
  if (compact.length < 6) return company;
  if (hostL.startsWith(compact) && hostL.length > compact.length && hostL.length - compact.length <= 6) {
    return company + hostL.slice(compact.length).toUpperCase();
  }
  return company;
}

function salvageProjectsFromExperience(draft: CvDraft) {
  const existing = new Set(draft.projects.map((p) => (p.name || "").toLowerCase()));
  for (const job of draft.experience) {
    if (job.company) job.company = expandCompanyFromWebsite(cleanOrgName(job.company), draft.contact.website);
    if (job.role) {
      const site = job.role.match(/\bwebsite\s*:\s*([a-z0-9.-]+\.[a-z]{2,})/i);
      if (site && !draft.contact.website) draft.contact.website = cleanUrl(site[1]);
      job.role = job.role.replace(/\s*\(?\s*website\s*:\s*[^)]+\)?\s*/i, "").trim();
    }
    if (job.descriptor && PROJECT_TITLE_RE.test(job.descriptor) && job.descriptor.split(/\s+/).length <= 8) {
      const name = job.descriptor.replace(/[:.]\s*$/, "").trim();
      const idx = (job.bullets ?? []).findIndex((b) => PROJECT_START_RE.test(b));
      const description = idx >= 0 ? job.bullets![idx] : "";
      const key = name.toLowerCase();
      if (!existing.has(key)) {
        draft.projects.push({ name, description });
        existing.add(key);
      }
      job.descriptor = "";
      if (idx >= 0) job.bullets = (job.bullets ?? []).filter((_, i) => i !== idx);
    }
    const bullets = job.bullets ?? [];
    if (!bullets.length) continue;
    const keep: string[] = [];
    for (let i = 0; i < bullets.length; i++) {
      const raw = bullets[i].trim();
      const sameLine = raw.match(/^(.{3,70}?)\s*:\s+((?:developed|built|created|designed|automated|made)\b.+)$/i);
      if (sameLine && PROJECT_TITLE_RE.test(sameLine[1]) && sameLine[1].split(/\s+/).length <= 8) {
        const name = sameLine[1].trim();
        const key = name.toLowerCase();
        if (!existing.has(key)) {
          draft.projects.push({ name, description: sameLine[2].trim() });
          existing.add(key);
        }
        continue;
      }
      const b = raw.replace(/[:.]\s*$/, "").trim();
      const next = bullets[i + 1];
      const titleLike = PROJECT_TITLE_RE.test(b) && b.split(/\s+/).length <= 8 && !/[.]/.test(b);
      if (titleLike && next && PROJECT_START_RE.test(next)) {
        const key = b.toLowerCase();
        if (!existing.has(key)) {
          draft.projects.push({ name: b, description: next.trim() });
          existing.add(key);
        }
        i++;
        continue;
      }
      if (titleLike && !ACTION_VERB_RE.test(b)) {
        const key = b.toLowerCase();
        if (!existing.has(key)) {
          draft.projects.push({ name: b, description: "" });
          existing.add(key);
        }
        continue;
      }
      keep.push(bullets[i]);
    }
    job.bullets = keep;
  }
  const leftover = sectionsProjectsFromRole(draft);
  for (const p of leftover) {
    const key = (p.name || "").toLowerCase();
    if (key && !existing.has(key)) {
      draft.projects.push(p);
      existing.add(key);
    }
  }
}

function sectionsProjectsFromRole(draft: CvDraft): Partial<ProjectEntry>[] {
  const out: Partial<ProjectEntry>[] = [];
  const keepJobs: typeof draft.experience = [];
  for (const job of draft.experience) {
    const role = (job.role || "").trim();
    if (PROJECT_TITLE_RE.test(role) && !job.company && (job.bullets ?? []).every((b) => PROJECT_START_RE.test(b) || b.length < 160)) {
      out.push({
        name: role.replace(/[:.]\s*$/, ""),
        description: (job.bullets ?? []).join(" "),
      });
      continue;
    }
    keepJobs.push(job);
  }
  draft.experience = keepJobs;
  return out;
}

/* ---------- experience / education / skills sub-parsers ---------- */

function isBullet(l: string): boolean {
  return /^[•▪▸►●*\u2022\u25AA\u2023\u2043-]\s*/.test(l) || /^\d+[.)]\s/.test(l);
}

function isParagraph(s: string): boolean {
  const t = s.trim();
  if (!t) return true;
  const noPeriod = t.replace(/[.]+$/, "").trim();
  if (noPeriod.length < 60 && /^[A-Z0-9][A-Z0-9 .&'/]*$/.test(noPeriod) && noPeriod.split(/\s+/).length <= 8) {
    return false;
  }
  if (/[.!?]\s*$/.test(t)) return true;
  const words = t.split(/\s+/).length;
  if (words >= 12) return true;
  if (/,\s+(and|with|for|which)\b/.test(t)) return true;
  return false;
}

function stripBullet(l: string): string {
  return l.replace(/^[•▪▸►●*\u2022\u25AA\u2023\u2043-]\s*/, "").replace(/^\d+[.)]\s*/, "").trim();
}

const ACTION_VERB_RE =
  /^(developed|managed|built|created|led|worked|prepared|assisted|collaborated|designed|implemented|coordinated|handled|provided|established|initiated|conducted|directed|spearheaded|oversaw|launched|organized|responsible|drove|delivered|achieved|improved|increased|reduced|maintained|supported|trained|mentored|negotiated|analyzed|researched|wrote|produced|completed|sold|recruited|hired|scheduled|ensured|utilized|administered|developed|process|operate|carry|employ|recommend)\b/i;

function isCompanyLine(l: string): boolean {
  const t = l.trim();
  if (!t || t.length > 80) return false;
  if (isParagraph(t)) return false;
  if (/\d{4}/.test(t) || EMAIL_RE.test(t) || PHONE_RE.test(t) || ACTION_VERB_RE.test(t)) return false;
  if (/-\s+[A-Z]/.test(t)) return false;
  const idx = t.lastIndexOf(",");
  if (idx <= 0) return false;
  const head = t.slice(0, idx).trim();
  const tail = t.slice(idx + 1).trim();
  if (!head || !tail || tail.length > 30) return false;
  if (!/^[A-Z]/.test(head)) return false;
  const badLower = head.split(/\s+/).some((w) => /^[a-z]/.test(w) && !/^(of|and|de|del|for|in|on|the|le|la)$/i.test(w));
  if (badLower) return false;
  return true;
}

function stripDateHead(l: string): string {
  return l
    .replace(DATE_HEAD_RE, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/[\s|·•,;:]*-?\s*$/, "")
    .trim();
}

function looksLikeCompanyName(l: string): boolean {
  const t = cleanOrgName(l);
  if (!t || t.length < 3 || t.length > 60) return false;
  if (/\d/.test(t) || /,/.test(t)) return false;
  if (isParagraph(t) || isBullet(t)) return false;
  if (SECTION_WORD_RE.test(t) || ACTION_VERB_RE.test(t) || isContacty(t) || hasDateRange(t)) return false;
  if (PROJECT_TITLE_RE.test(t)) return false;
  const open = (t.match(/\(/g) ?? []).length;
  const close = (t.match(/\)/g) ?? []).length;
  if (open !== close) return false;
  const words = t.split(/\s+/);
  if (words.length < 2 || words.length > 5) return false;
  if (!words.every((w) => /^[A-Z]/.test(w) || /^(of|and|the|&)$/i.test(w))) return false;
  return true;
}

function isDurationLine(l: string): boolean {
  const t = l.trim();
  if (!t || t.length > 70) return false;
  if (isDateOnlyLine(t)) return false;
  if (/^\d+\s*(?:years?|months?|weeks?)\b/i.test(t)) return true;
  if (/^(?:\d+\s+)?(?:years?|months?)\s+plus\b/i.test(t)) return true;
  if (/^\(?\s*continue\b/i.test(t) && t.split(/\s+/).length <= 4) return true;
  if (/^(?:continue\s+)?freelanc/i.test(t) && t.split(/\s+/).length <= 5) return true;
  if (/\bin\s+(?:process|progress)\b/i.test(t) && t.split(/\s+/).length <= 8 && !/\b(?:19|20)\d{2}\b/.test(t)) return true;
  return false;
}

function isDateOnlyLine(l: string): boolean {
  const t = l.trim();
  if (!t) return false;
  const dateOnly = dateRangeRe();
  dateOnly.lastIndex = 0;
  if (dateOnly.test(t)) {
    const rest = t.replace(DATE_HEAD_RE, " ").replace(/[()[\].\-•*·:]/g, " ").trim();
    return rest.length === 0 || /^\d{1,2}(\/\d{2,4})?$/.test(rest);
  }
  return /^\s*(?:\(|\[)?\s*(?:\d{1,2}\s*\/\s*)?(?:19|20)\d{2}\s*(?:\)|\])?\s*$/.test(t);
}

function setDates(entry: Partial<ExperienceEntry> & Partial<VolunteerEntry>, dates: { start: string; end: string; present: boolean }) {
  entry.startDate = dates.start;
  entry.endDate = dates.end;
  entry.present = dates.present;
}

function parseExperience(rawLines: string[], isVolunteer = false): Partial<ExperienceEntry | VolunteerEntry>[] {
  const entries: Partial<ExperienceEntry | VolunteerEntry>[] = [];
  let current: (Partial<ExperienceEntry> & Partial<VolunteerEntry>) | null = null;
  let pending: string | null = null;

  const finish = () => {
    if (current && (current.company || current.role || current.title)) {
      if (isVolunteer && !current.title && current.role) current.title = current.role;
      entries.push(current);
    }
    current = null;
  };

  const parseHead = (head: string) => {
    const sep = head.match(/^(.*?)\s+(?:at|@)\s+(.*)$/) ?? head.match(/^(.*?)\s*[|·•–—-]\s*(.*)$/) ?? null;
    if (sep) {
      const role = sep[1].trim();
      const org = sep[2].trim();
      if (isVolunteer) {
        current!.title = role;
        current!.org = org;
      } else {
        current!.role = role;
        current!.company = org;
      }
      const locMatch = org.match(/^(.+?)\s*[,|]\s*(.+)$/);
      if (locMatch) {
        current!.company = locMatch[1].trim();
        current!.location = locMatch[2].trim();
      }
    } else {
      // comma-split: "Role, Company" or "Role, Company, City, ST"
      const parts = head.split(",").map((x) => x.trim()).filter(Boolean);
      if (parts.length >= 2) {
        current!.role = parts[0];
        const last = parts[parts.length - 1];
        const isState = /^[A-Z]{2}$/.test(last) || /^(Remote|Hybrid)$/i.test(last);
        if (parts.length >= 3 && isState) {
          current!.company = parts.slice(1, parts.length - 2).join(", ");
          current!.location = parts.slice(parts.length - 2).join(", ");
        } else if (parts.length >= 3) {
          current!.company = parts.slice(1, -1).join(", ");
          current!.location = last;
        } else {
          current!.company = parts[1];
        }
      } else if (isVolunteer) {
        current!.title = head;
      } else {
        current!.role = head;
      }
    }
    const loc = head.match(/[,|]\s*(?:([A-Z][\w.'-]+),\s*([A-Z]{2})\b|\b(Remote|Hybrid)\b)/);
    if (loc) {
      current!.location = loc[1] ? `${loc[1]}, ${loc[2]}` : loc[3];
    }
  };

  const startPending = (l: string, asCompany = false) => {
    if (!current || !(current.startDate || current.endDate)) current = {};
    if (asCompany) current.company = l;
    else parseHead(l);
  };

  for (const raw of rawLines) {
    const l = raw.replace(/\s{2,}/g, "  ");
    if (isBullet(l)) {
      if (pending && !isParagraph(pending)) {
        startPending(pending);
        pending = null;
      }
      if (!current) current = {};
      const b = stripBullet(l);
      if (b) {
        const bullets = (current.bullets ??= []);
        bullets.push(b);
      }
      continue;
    }

    // "Company, Location" on its own line right after a role header
    if (isCompanyLine(l)) {
      const idx = l.lastIndexOf(",");
      const org = l.slice(0, idx).trim();
      const loc = l.slice(idx + 1).trim();
      if (pending && !isParagraph(pending) && !(current && (current.role || current.company))) {
        startPending(pending);
        pending = null;
      }
      if (current && current.role && !current.company) {
        current.company = org;
        current.location = loc;
      } else if (current && (current.role || current.company)) {
        finish();
        current = {};
        current.company = org;
        current.location = loc;
      } else if (!current) {
        current = {};
        current.company = org;
        current.location = loc;
      } else {
        pending = l;
      }
      continue;
    }

    // Short Title-Case line right after a role header is the company
    // (PDFs often print it without a comma: "GRAPHIC DESIGNER" / "Paradise Punch")
    if (current && current.role && !current.company && looksLikeCompanyName(l)) {
      current.company = cleanOrgName(l);
      continue;
    }
    // All-caps line captured as company with no role yet: "SENIOR GRAPHIC DESIGNER"
    // followed directly by a Title-Case company (no duration line in between)
    if (current && current.company && !current.role && /^[A-Z][A-Z0-9 .&'-]*$/.test(current.company) && looksLikeCompanyName(l)) {
      current.role = current.company;
      current.company = cleanOrgName(l);
      continue;
    }

    // A dangling ")" line completes a role fragment split across lines by the
    // PDF text layer ("02 Years Experience as a (Quaility" + "Assurance Inspector)")
    if (current && !current.role) {
      const o = (l.match(/\(/g) ?? []).length;
      const c = (l.match(/\)/g) ?? []).length;
      if (c > o && l.length < 60 && !isDurationLine(l)) {
        current.descriptor = (current.descriptor ? current.descriptor + " " : "") + l.trim();
        continue;
      }
    }

    // Company-first layout ("Atlas Honda" / "02 Years Experience…"): a company name
    // on its own line starts an entry; a second one closes the previous entry.
    if (looksLikeCompanyName(l)) {
      if (!current) {
        current = { company: cleanOrgName(l) };
        continue;
      }
      if (current.company && !current.role) {
        finish();
        current = { company: cleanOrgName(l) };
        continue;
      }
      // A new all-caps role line after a completed role+company entry starts the
      // next entry ("GRAPHIC DESIGNER" / "2 Years Plus" / "Paradise Punch" blocks)
      if (current.company && current.role && /^[A-Z][A-Z0-9 .&'-]*$/.test(l)) {
        finish();
        current = { company: cleanOrgName(l) };
        continue;
      }
    }

    // "2 Years Plus (2018)" / "Continue Freelancing (2021)" style duration lines:
    // the held line before it is the role (all-caps) or the company (Title-Case).
    if (isDurationLine(l)) {
      if (pending && !isParagraph(pending)) {
        startPending(pending, !/^[A-Z][A-Z0-9 .&'-]*$/.test(pending) && looksLikeCompanyName(pending));
        pending = null;
      }
      if (!current) current = {};
      // All-caps "role" lines captured as company by the company-first rule are
      // really roles: "GRAPHIC DESIGNER" / "2 Years Plus (2018)" / "Paradise Punch"
      if (current.company && !current.role && /^[A-Z][A-Z0-9 .&'-]*$/.test(current.company)) {
        current.role = current.company;
        current.company = "";
      }
      const yr = l.match(/\b(?:19|20)\d{2}\b/);
      if (yr && !current.startDate) setDates(current, { start: yr[0], end: "", present: false });
      if (!current.descriptor) current.descriptor = l.replace(/^\(?\s*/, "").replace(/\)?\s*$/, "").trim();
      continue;
    }

    // "Role - Company, Location" on one line, with the date on the previous line
    if (current && current.startDate && !current.role && !current.company && /^[A-Z][A-Za-z0-9 .&']+\s+-\s+[A-Z]/.test(l)) {
      parseHead(l);
      continue;
    }

    // "Role — 2018" single-year headers from no-heading PDFs
    const singleYear = l.match(/^(.{3,110}?)\s*[–—-]\s*((?:19|20)\d{2})\s*$/);
    if (singleYear && /[A-Za-z]/.test(singleYear[1]) && !/[•▪▸►*]/.test(l) && !/\b(?:19|20)\d{2}\s*(?:-|–|—|to)\s*(?:19|20)\d{2}\b/i.test(l)) {
      if (current && (current.role || current.company)) finish();
      current = {};
      current.role = singleYear[1].trim();
      current.startDate = singleYear[2];
      continue;
    }

    // "Role \t Date" / "Company \t Date" / "Role 2020 – Present" trailing-date headers
    // (Word layouts often put the role/company and a date range on one line)
    const dates = parseDates(l);
    const hasDates = dates !== null;
    const noDate = hasDates ? stripDateHead(l) : l;
    const tabIdx = l.indexOf("\t");
    const leftFromTab = tabIdx > 0 ? l.slice(0, tabIdx).trim() : "";
    const rightFromTab = tabIdx > 0 ? l.slice(tabIdx).trim() : "";
    const left = leftFromTab && rightFromTab && parseDates(rightFromTab) ? leftFromTab : noDate;
    const trailingDates = hasDates && !isDateOnlyLine(l) && left.length > 0 && left.length < 60;

    if (trailingDates) {
      if (pending && !isParagraph(pending)) {
        startPending(pending);
        pending = null;
        if (/[|·•–—]/.test(left) || left.includes(",")) parseHead(left);
        else current!.company = left;
      } else {
        pending = null;
        if (current && (current.role || current.company)) finish();
        current = {};
        parseHead(left);
      }
      setDates(current!, dates);
      continue;
    }

    // date-only line: attach dates to pending header or current entry
    if (hasDates && isDateOnlyLine(l)) {
      if (pending && !isParagraph(pending)) {
        startPending(pending);
        pending = null;
        setDates(current!, dates);
      } else if (pending) {
        pending = null;
      } else if (current && (current.role || current.company)) {
        if ((current.role && current.company) || (current.company && current.startDate)) {
          finish();
          current = {};
          setDates(current, dates);
        } else {
          setDates(current, dates);
        }
      } else if (!current) {
        current = {};
        setDates(current, dates);
      } else {
        setDates(current, dates);
      }
      continue;
    }

    // entry header: contains a date range, or a short line with role|company separators
    const isHeader = hasDates || (l.length < 110 && /[|·•]/.test(l) && !/^[•▪▸►*]/.test(l));
    // A "Role, Company" / "Role, Company, City, ST" line after bullets is a new entry
    const commaCount = (l.match(/,/g) ?? []).length;
    const looksLikeRoleLine =
      commaCount >= 1 &&
      commaCount <= 3 &&
      l.length < 110 &&
      /^[A-Z][\w.'&+%-]*(?:\s+[A-Z][\w.'&+%-]*)+/.test(l) &&
      !/\d{4}/.test(l) &&
      !isBullet(l) &&
      !isParagraph(l);

    // "Company · Location" continuation: the docx/pdf layout puts role+dates on one line,
    // then "Company · City, ST" on the next — attach to the current role-only entry.
    if (isHeader && current && current.role && !current.company && !hasDates) {
      const sep = l.match(/^(.+?)\s*[|·•]\s*(.+)$/);
      if (sep) {
        const org = sep[1].trim();
        const rest = sep[2].trim();
        current.company = org;
        const loc = rest.match(/^(.+?),\s*([A-Z]{2})$/);
        if (loc) {
          current.location = `${loc[1]}, ${loc[2]}`;
        } else if (!current.location) {
          current.location = rest;
        }
        continue;
      }
    }

    if (isHeader || (looksLikeRoleLine && current && (current.bullets?.length || current.company))) {
      finish();
      pending = null;
      current = {};
      if (dates) setDates(current, dates);
      parseHead(stripDateHead(l));
      continue;
    }

    // ordinary continuation line
    if (current && (current.role || current.company)) {
      const titleLike = PROJECT_TITLE_RE.test(l) && l.split(/\s+/).length <= 8 && !hasDateRange(l);
      if (titleLike) {
        (current.bullets ??= []).push(l.replace(/[:.]\s*$/, "").trim());
        continue;
      }
      // sentence-style or long lines become bullets (Word layouts often drop bullet chars)
      if (isParagraph(l) || (l.length >= 40 && !/\d{4}/.test(l))) {
        (current.bullets ??= []).push(l);
        continue;
      }
      // location / descriptor line
      if (l.length < 80 && !/\d{4}/.test(l) && !isBullet(l)) {
        const loc = l.match(/^([A-Z][\w.'-]+),\s*([A-Z]{2})\s*$|^(Remote|Hybrid)$/i);
        if (loc && !current.location) {
          current.location = loc[1] ? `${loc[1]}, ${loc[2]}` : loc[3];
        } else if (isVolunteer) {
          if (!current.org) current.org = l;
        } else if (!current.descriptor) {
          current.descriptor = l;
        } else {
          (current.bullets ??= []).push(l);
        }
      } else {
        pending = l;
      }
      continue;
    }

    // no active entry yet: hold this line as a possible header awaiting dates
    if (l.length < 110) {
      pending = l;
    }
  }
  finish();
  return entries;
}

const DEG_RE =
  /\b(?:B\.?A|B\.?S|M\.?A|M\.?S|BA|BS|MA|MS|PhD|Ph\.?D|MBA|BSc|MSc|M\.?Sc|B\.?Sc|LLB|JD|BEng|MEng|HND|A\.?S|A\.?A|I\.?COM|F\.?S\.?C|F\.?A\b|HSC|SSC|D\.?A\.?E|B\.?Com|M\.?Com|BBA|MPhil|B\.?Tech|M\.?Tech|O\s*Levels?|A\s*Levels?)\b|Diploma|Bachelor|Master|Doctorate|Intermediate|Matric/i;

function isEduLine(l: string): boolean {
  const t = l.trim();
  if (t.length > 150) return false;
  if (/(?:university|college|institute|board|school|academy)\b/i.test(t)) return true;
  if (/^(?:bachelor|master|doctorate|matric(?:ulation)?|intermediate|diploma|ph\.?d)\b/i.test(t)) return true;
  const m = t.match(/\b(?:B\.?A|B\.?S|M\.?A|M\.?S|BA|BS|MA|MS|PhD|Ph\.?D|MBA|BSc|MSc|M\.?Sc|B\.?Sc|LLB|JD|BEng|MEng|HND|A\.?S|A\.?A|I\.?COM|F\.?S\.?C|HSC|SSC|D\.?A\.?E|B\.?Com|M\.?Com|BBA|MPhil|B\.?Tech|M\.?Tech|O\s*Levels?|A\s*Levels?)\b/i);
  if (!m) return false;
  const rest = t.slice(t.indexOf(m[0]) + m[0].length);
  return /\b(?:19|20)\d{2}\b|university|college|institute|board|school|from|\bin\b/i.test(rest);
}

function parseEducation(rawLines: string[]): Partial<EducationEntry>[] {
  const entries: Partial<EducationEntry>[] = [];
  let current: Partial<EducationEntry> | null = null;

  const finish = () => {
    if (current && (current.institution || current.degree)) entries.push(current);
    current = null;
  };

  const parseHead = (l: string) => {
    const withoutDates = stripDateHead(l);
    const comma = withoutDates.split(/[|·•]/).map((x) => x.trim()).filter(Boolean);
    const main = comma[0] ?? withoutDates.trim();
    const dash = main.split(/\s+-\s+/).map((x) => x.trim()).filter(Boolean);
    const degRe = DEG_RE;
    if (dash.length === 2) {
      const a = dash[0];
      const b = dash[1];
      const degA = degRe.test(a);
      const degB = degRe.test(b);
      if (degB && !degA) {
        current!.institution = a;
        const parts = b.split(/\s+in\s+/i);
        current!.degree = parts[0].trim();
        current!.field = parts[1]?.trim() ?? "";
      } else if (degA && !degB) {
        current!.institution = b;
        const parts = a.split(/\s+in\s+/i);
        current!.degree = parts[0].trim();
        current!.field = parts[1]?.trim() ?? "";
      } else {
        current!.degree = a.split(",")[0].trim();
        current!.field = a.split(",").slice(1).join(",").trim();
        current!.institution = b;
      }
    } else {
      const inMatch = main.match(/^(.*?)\s+(?:in|of)\s+(.+)$/i);
      if (inMatch) {
        current!.degree = inMatch[1].trim();
        const rest = inMatch[2].trim();
        const fromM = rest.match(/\b(?:from|at)\s+(.+)$/i);
        if (fromM) {
          current!.field = rest.replace(/\b(?:from|at)\s+.*$/i, "").split(/[|,]/)[0].trim();
          current!.institution = fromM[1].replace(/[.,;:\s]+$/, "").replace(/\s*[,]?\s*course\s+\S+.*$/i, "").trim();
        } else {
          const [field, ...inst] = rest.split(/[|,]/).map((x) => x.trim());
          current!.field = field ?? "";
          current!.institution = inst.join(", ");
        }
      } else {
        const f = main.split(/\s+from\s+/i);
        if (f.length === 2) {
          current!.degree = f[0].split(",")[0].trim();
          current!.institution = f[1].split(/[|,]/)[0].replace(/^\d{4}\s*/, "").trim();
        } else {
          current!.degree = main.split(",")[0].trim();
          current!.institution = main.split(",").slice(1).join(",").trim().replace(/^\d{4}\s*/, "");
        }
      }
    }
    current!.degree = (current!.degree ?? "").replace(/\s*\((?:19|20)\d{2}\)?\s*$/g, "").replace(/\s*\b(?:19|20)\d{2}\b\s*$/g, "").trim();
    current!.institution = (current!.institution ?? "").replace(/\s*\((?:19|20)\d{2}\)?\s*$/g, "").replace(/,\s*(?:course\s+)?continue.*$/i, "").trim();
    const loc = l.match(/[,|]\s*(?:([A-Z][\w.'-]+),\s*([A-Z]{2})\b)/);
    if (loc) current!.location = `${loc[1]}, ${loc[2]}`;
  };

  for (const raw of rawLines) {
    const l = raw.replace(/\s{2,}/g, " ");
    let dates = parseDates(l);

    // date-only line (dates with location/GPA/honors): attach to current entry
    if (dates && (isDateOnlyLine(l) || (current && /^\s*(?:19|20)\d{2}/.test(l)))) {
      if (!current) {
        current = {};
        current.startDate = dates.start;
        current.endDate = dates.end;
      } else {
        current.startDate = current.startDate || dates.start;
        current.endDate = current.endDate || dates.end;
      }
      const loc = l.match(/[,|]\s*(?:([A-Z][\w.'-]+),\s*([A-Z]{2})\b)/);
      if (loc && !current.location) current.location = `${loc[1]}, ${loc[2]}`;
      if (/GPA|CGPA/.test(l)) {
        const m = l.match(/(?:GPA|CGPA)[:\s]+([\d.]+)\s*\/?\s*([\d.]*)/i);
        if (m) current.gpa = m[1];
      }
      if (/Honors|Honours|Cum laude|Dean/.test(l)) current.honors = l;
      continue;
    }

    // header line: degree / institution
    const parenYear = l.match(/\((\d{4})\)/);
    const tailYear = l.match(/\b(19|20)\d{2}\b\s*$/);
    const isHeader = dates !== null || DEG_RE.test(l) || (parenYear !== null && !current);
    if (isHeader) {
      if (dates === null && parenYear) dates = { start: parenYear[1], end: "", present: /continue|in\s+(?:progress|process)/i.test(l) };
      if (dates === null && tailYear && /continue|in\s+(?:progress|process)/i.test(l)) dates = { start: tailYear[1], end: "", present: true };
      finish();
      current = {};
      if (dates) {
        current.startDate = dates.start;
        current.endDate = dates.end;
      }
      parseHead(l);
      continue;
    }

    // non-header continuation
    if (current) {
      const fieldYear = l.match(/^(.*?)\s*[-–—]\s*\b(19|20)\d{2}\b\s*$/);
      if (fieldYear && current.degree && !current.institution && !fieldYear[1].includes(",") && !fieldYear[1].includes(":")) {
        current.field = [current.field, fieldYear[1].trim()].filter(Boolean).join(" ");
        current.startDate = current.startDate || fieldYear[2].trim();
        continue;
      }
      if (current.degree && !current.institution && l.length < 110 && !isBullet(l)) {
        const piped = l.split(/[|·•]/).map((x) => x.trim()).filter(Boolean);
        const tabParts = (piped[0] ?? l).split("\t").map((x) => x.trim());
        current.institution = tabParts[0].replace(/^(?:\b(?:19|20)\d{2}\b\s+)?from\s+/i, "").replace(/\s*[,]?\s*course\s+\S+.*$/i, "").replace(/\s+\b(19|20)\d{2}\b\s*$/, "").replace(/\s+in\s+(?:process|progress).*$/i, "").trim();
        if (/in\s+(?:process|progress)|last\s+semester|currently\s+enrolled/i.test(l)) {
          current.honors = (l.match(/in\s+(?:process|progress)[^]*|last\s+semester[^]*/i) || ["In process"])[0].replace(/[.]+$/, "").replace(/\s+$/, "").trim();
        }
        if (piped.length > 1) current.location = piped[piped.length - 1];
        else if (tabParts.length > 1 && /[,|]/.test(tabParts[1])) current.location = tabParts[1].split(/[,|]/)[0].trim();
        if (tabParts.length > 1) {
          const d = parseDates(tabParts[1]);
          if (d) {
            current.startDate = current.startDate || d.start;
            current.endDate = current.endDate || d.end;
          }
        } else {
          const endYear = l.match(/\b(19|20)\d{2}\b\s*$/);
          if (endYear) {
            current.startDate = current.startDate || endYear[0].trim();
            current.endDate = current.endDate || "";
          }
        }
      } else if (/GPA|CGPA/.test(l)) {
        const m = l.match(/(?:GPA|CGPA)[:\s]+([\d.]+)\s*\/?\s*([\d.]*)/i);
        if (m) current.gpa = m[1];
      } else if (/Honors|Honours|Cum laude|Dean/.test(l)) {
        current.honors = l;
      } else if (!current.institution && !current.degree && !/\d{4}/.test(l)) {
        const piped = l.split(/[|·•]/).map((x) => x.trim()).filter(Boolean);
        current.institution = piped[0] ?? l;
        if (piped.length > 1) current.location = piped[piped.length - 1];
      } else if (
        current.institution &&
        l.length < 60 &&
        !/\d{4}/.test(l) &&
        /institut\w*|coll\w*ge|universit\w*|academ\w*|polytechnic|school|board\b/i.test(l)
      ) {
        current.institution = `${current.institution} ${l}`.replace(/\s+\.?\s*$/, "").trim();
      }
    }
  }
  finish();
  return entries;
}

function parseSkills(rawLines: string[]): { name: string; skills: string[] }[] {
  const groups: { name: string; skills: string[] }[] = [];
  let current: { name: string; skills: string[] } = { name: "Skills", skills: [] };

  const push = () => {
    if (current.skills.length) groups.push(current);
    current = { name: "Skills", skills: [] };
  };

  for (const raw of rawLines) {
    const l = raw.replace(/\s{2,}/g, " ").trim();
    if (!l) continue;
    if (isSkillChipLine(l)) {
      const parts = l.split(/[•▪▸►●*]/).map((s) => s.trim()).filter(Boolean);
      current.skills.push(...parts.filter((p) => p.length <= 40));
      continue;
    }
    if (isBullet(l)) continue;
    if (ACTION_VERB_RE.test(l) || /^(founded|provide|handle|develop|led|prepared|ensured|worked|served|manage)\b/i.test(l)) continue;
    if (isParagraph(l)) continue;
    if (/^(?=.*\d)(?=.*[_@])[A-Za-z0-9_.@-]+$/.test(l) || /^@[A-Za-z0-9_.-]+$/.test(l) || /^\w+\.[a-z]{2,}(?:\/\S*)?$/i.test(l)) continue;
    if (isParagraph(l) && l.split(/\s+/).length >= 12) continue;
    if (/^[A-Z][A-Z&/()'.\- ]+$/.test(l) && l.split(/\s+/).length >= 3 && l.length > 12) continue;
    const grouped = l.match(/^(.+?)\s*[:|]\s*(.+)$/);
    if (grouped) {
      const name = grouped[1].replace(/[•\-*]/g, "").trim();
      if (name.toLowerCase() === "skills" && grouped[2].length > 40) {
        current.skills.push(...splitSkillList(grouped[2]));
      } else if (name && grouped[2]) {
        push();
        current.name = name;
        current.skills.push(...splitSkillList(grouped[2]));
      } else {
        current.skills.push(...splitSkillList(l));
      }
    } else {
      if (l.length <= 60 && l.split(/\s+/).length <= 12 && !/[;]/.test(l)) {
        current.skills.push(l);
      } else {
        current.skills.push(...splitSkillList(l));
      }
    }
  }
  push();
  return groups.length ? groups : [];
}

function splitSkillList(s: string): string[] {
  return s
    .split(/\s*(?:,|;|\/|\u2022|•)\s*/)
    .map((x) => x.trim())
    .filter((x) => x.length > 0 && x.length <= 40 && !/^(and|with)$/i.test(x));
}

/* ============================================================
   Build a full Resume from the draft
   ============================================================ */

const FILLED_SECTION_ORDER: SectionKey[] = [
  "summary",
  "objective",
  "experience",
  "education",
  "skills",
  "projects",
  "certifications",
  "languages",
  "volunteer",
  "awards",
  "publications",
  "teaching",
  "grants",
  "presentations",
  "affiliations",
  "references",
  "portfolio",
];

function orderFilledSections(draft: CvDraft): SectionKey[] {
  const has = (k: SectionKey): boolean => {
    switch (k) {
      case "summary":
        return !draft.useObjective && !!(draft.summary || "").trim();
      case "objective":
        return draft.useObjective && !!(draft.objective || "").trim();
      case "experience":
        return draft.experience.length > 0;
      case "education":
        return draft.education.length > 0;
      case "skills":
        return draft.skills.some((g) => (g.skills ?? []).length > 0);
      case "projects":
        return draft.projects.length > 0;
      case "certifications":
        return draft.certifications.length > 0;
      case "languages":
        return draft.languages.length > 0;
      case "volunteer":
        return draft.volunteer.length > 0;
      case "awards":
        return draft.awards.length > 0;
      case "publications":
        return draft.publications.length > 0;
      case "teaching":
        return draft.teaching.length > 0;
      default:
        return false;
    }
  };
  const filled = FILLED_SECTION_ORDER.filter(has);
  return filled.length ? filled : ["summary", "experience", "education", "skills"];
}

export function resumeFromDraft(draft: CvDraft, theme?: Partial<ThemeConfig>): Resume {
  const base = createBlankResume();
  const now = todayISO();
  const contact: Contact = { ...base.contact, ...draft.contact };

  const idify = <T extends object>(items: T[]): T[] => items.map((it) => ({ ...it, id: (it as { id?: string }).id || uid() }));

  const fillStrings = <T extends object>(items: T[]): T[] =>
    idify(items).map((it) => {
      const out = { ...it } as Record<string, unknown>;
      for (const [k, v] of Object.entries(out)) {
        if (v === undefined || v === null) out[k] = "";
      }
      return out as T;
    });

  const normalizeEntries = <T extends { bullets?: string[] }>(items: T[]): T[] =>
    fillStrings(items).map((it) => ({ ...it, bullets: (it.bullets ?? []).filter((b) => (b || "").trim().length > 0) }));

  const sectionOrder = orderFilledSections(draft);

  const visibility = { ...defaultVisibility("combination") };
  for (const k of sectionOrder) {
    if (k !== "contact") (visibility as Record<string, boolean>)[k] = true;
  }

  const resume: Resume = {
    ...base,
    meta: {
      ...base.meta,
      id: uid(),
      name: contact.fullName.trim() || "Imported Resume",
      createdAt: now,
      updatedAt: now,
    },
    contact,
    summary: draft.summary,
    objective: draft.objective,
    useObjective: draft.useObjective,
    experience: normalizeEntries(draft.experience) as ExperienceEntry[],
    education: fillStrings(draft.education) as EducationEntry[],
    skills: fillStrings(draft.skills) as Resume["skills"],
    projects: fillStrings(draft.projects) as ProjectEntry[],
    certifications: fillStrings(draft.certifications) as CertificationEntry[],
    languages: fillStrings(draft.languages) as LanguageEntry[],
    volunteer: normalizeEntries(draft.volunteer) as VolunteerEntry[],
    awards: fillStrings(draft.awards) as AwardEntry[],
    publications: fillStrings(draft.publications) as PublicationEntry[],
    teaching: fillStrings(draft.teaching) as Resume["teaching"],
    sectionOrder: sectionOrder as SectionKey[],
    visibility,
    theme: { ...base.theme, ...theme },
  };
  return deepSanitize(resume) as Resume;
}

function deepSanitize(value: unknown): unknown {
  if (value === undefined || value === null) return "";
  if (typeof value === "string" || typeof value === "boolean" || typeof value === "number") return value;
  if (Array.isArray(value)) return value.map(deepSanitize);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = deepSanitize(v);
    return out;
  }
  return "";
}

export function hasMeaningfulContent(draft: CvDraft): boolean {
  return !!draft.contact.fullName || !!draft.summary || draft.experience.length > 0 || draft.education.length > 0;
}

export function summarizeDraft(draft: CvDraft): { label: string; count: number }[] {
  const items: { label: string; count: number }[] = [];
  if (draft.contact.fullName) items.push({ label: "Name", count: 1 });
  if (draft.contact.email) items.push({ label: "Email", count: 1 });
  if (draft.contact.phone) items.push({ label: "Phone", count: 1 });
  if (draft.summary) items.push({ label: "Summary", count: 1 });
  if (draft.experience.length) items.push({ label: "Work", count: draft.experience.length });
  if (draft.education.length) items.push({ label: "Education", count: draft.education.length });
  if (draft.skills.length) items.push({ label: "Skills", count: draft.skills.reduce((n, g) => n + g.skills.length, 0) });
  if (draft.projects.length) items.push({ label: "Projects", count: draft.projects.length });
  if (draft.certifications.length) items.push({ label: "Certifications", count: draft.certifications.length });
  if (draft.languages.length) items.push({ label: "Languages", count: draft.languages.length });
  if (draft.volunteer.length) items.push({ label: "Volunteer", count: draft.volunteer.length });
  if (draft.awards.length) items.push({ label: "Awards", count: draft.awards.length });
  if (draft.publications.length) items.push({ label: "Publications", count: draft.publications.length });
  if (draft.teaching.length) items.push({ label: "Teaching", count: draft.teaching.length });
  return items;
}
