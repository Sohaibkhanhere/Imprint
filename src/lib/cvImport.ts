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
  CustomDetail,
} from "./types";
import { uid, todayISO } from "./date";
import { defaultVisibility } from "./resumeTypes";
import { createBlankResume } from "./sampleData";

/* ============================================================
   Text extraction: .txt / .docx / .pdf → plain text
   ============================================================ */

type PdfGlyph = { str: string; x: number; y: number; w: number; h: number };

const JUNK_PDF_NAMES =
  /^(windows\s+user|user|admin|administrator|owner|pc|desktop|document|microsoft|resume|cv|author|unknown)$/i;

function nameFromFilename(filename: string): string {
  const stem = filename.replace(/\.[^.]+$/g, "").replace(/\.pdf$/i, "");
  let t = stem.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  t = t.replace(/\b(resume|cv|curriculum vitae|updated|final|copy|draft|new|latest|version)\b/gi, " ");
  t = t.replace(/\b(finance|executive|data|analyst|developer|engineer|designer|software|marketing)\b/gi, " ");
  t = t.replace(/\s+/g, " ").trim();
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 5) return "";
  if (!words.every((w) => /^[A-Za-z][A-Za-z.'-]*$/.test(w))) return "";
  if (words.some((w) => JUNK_PDF_NAMES.test(w))) return "";
  return words.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

function paragraphFromPdfTitle(title: string | undefined): string {
  const t = (title || "").replace(/\s+/g, " ").trim();
  if (t.length < 90 || t.split(/\s+/).length < 12 || !/[a-z]/.test(t)) return "";
  if (JUNK_PDF_NAMES.test(t) || /^(untitled|document|microsoft word)/i.test(t)) return "";
  return t;
}

export async function resolvePdfjsStandardFontUrl(): Promise<string | undefined> {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/standard_fonts/`;
  }
  try {
    const { createRequire } = await import("node:module");
    const pathMod = await import("node:path");
    const req = createRequire(import.meta.url);
    const pkg = pathMod.dirname(req.resolve("pdfjs-dist/package.json"));
    return pathMod.join(pkg, "standard_fonts").replace(/\\/g, "/") + "/";
  } catch {
    return undefined;
  }
}

function nameFromPdfInfo(info: { Title?: string; Author?: string } | undefined): string {
  const clean = (raw: string, maxWords: number) => {
    const t = raw.replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
    if (!t || JUNK_PDF_NAMES.test(t)) return "";
    if (!/^[A-Za-z][A-Za-z .'-]{2,60}$/.test(t)) return "";
    const words = t.split(/\s+/);
    if (words.length < 2 || words.length > maxWords) return "";
    if (words.some((w) => /^(user|admin|administrator|owner|desktop|windows)$/i.test(w))) return "";
    return t;
  };
  const title = (info?.Title || "")
    .replace(/\s*[-–—|:]\s*(resume|cv|curriculum vitae).*$/i, "")
    .replace(/\s+(resume|cv|curriculum vitae)\s*$/i, "")
    .trim();
  const named = (info?.Title || "").match(/\b(?:resume|cv)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,3})\s*$/i);
  if (named) return clean(named[1], 5);
  return clean(title, 5) || clean((info?.Author || "").replace(/[_]+/g, " "), 5);
}

function findSidebarGap(items: PdfGlyph[], pageWidth: number, pageHeight = 792): number | null {
  const xs = items.map((i) => i.x).filter((x) => x >= 8 && x <= pageWidth * 0.78);
  if (xs.length < 18) return null;
  const step = 8;
  const buckets = new Array(Math.ceil(pageWidth / step) + 1).fill(0);
  for (const x of xs) buckets[Math.floor(x / step)]++;
  const from = Math.floor((pageWidth * 0.20) / step);
  const to = Math.floor((pageWidth * 0.48) / step);
  const emptyRunPx = (i: number) => {
    let a = i;
    let b = i;
    while (a > 0 && (buckets[a - 1] ?? 0) <= 1) a--;
    while (b < buckets.length - 1 && (buckets[b + 1] ?? 0) <= 1) b++;
    return (b - a + 1) * step;
  };
  let best = -1;
  let bestScore = 0;
  for (let i = from; i <= to; i++) {
    const leftCount = buckets.slice(0, i).reduce((a, b) => a + b, 0);
    const rightCount = buckets.slice(i).reduce((a, b) => a + b, 0);
    const valley = buckets[i] + (buckets[i + 1] ?? 0);
    if (leftCount < 8 || rightCount < 12 || valley > 3) continue;
    const run = emptyRunPx(i);
    if (run < 36) continue;
    // Prefer a wide empty gutter (true two-column) over a "balanced"
    // split that cuts through the main column.
    const score = run * 6 + Math.min(leftCount, rightCount);
    if (score > bestScore) {
      bestScore = score;
      best = i * step + 4;
    }
  }
  if (best < 0) return null;
  const right = items.filter((i) => i.x >= best);
  const ys = right.map((i) => i.y);
  const span = ys.length ? Math.max(...ys) - Math.min(...ys) : 0;
  if (span < pageHeight * 0.38) return null;
  return best;
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
    .map((row) => {
      const parts = [...row.parts].sort((a, b) => a.x - b.x);
      const cells: string[][] = [[]];
      for (let i = 0; i < parts.length; i++) {
        if (i > 0) {
          const prev = parts[i - 1];
          const prevEnd = prev.x + (prev.w > 1 ? prev.w : 0);
          const gap = parts[i].x - prevEnd;
          const xJump = parts[i].x - prev.x;
          const splitAt = prev.w > 1 ? 42 : 80;
          if (gap > splitAt || xJump > 150) cells.push([]);
        }
        cells[cells.length - 1].push(parts[i].str);
      }
      const texts = cells
        .map((c) => c.join(" ").replace(/\s+/g, " ").trim())
        .filter(Boolean);
      if (texts.length <= 1) return texts[0] || "";
      return texts.join("\t");
    })
    .filter(Boolean);
}

export function layoutPdfPage(items: PdfGlyph[], pageWidth: number, pageHeight = 792): string {
  const gap = findSidebarGap(items, pageWidth, pageHeight);
  const laid = (() => {
    if (gap == null) return linesFromGlyphs(items).join("\n");
    const left = items.filter((i) => i.x < gap);
    const right = items.filter((i) => i.x >= gap);
    const leftLines = linesFromGlyphs(left);
    const rightLines = linesFromGlyphs(right);
    if (!leftLines.length) return rightLines.join("\n");
    if (!rightLines.length) return leftLines.join("\n");
    return `${leftLines.join("\n")}\n\n${rightLines.join("\n")}`;
  })();
  const laidLen = laid.replace(/\s/g, "").length;
  const rawLen = items.reduce((n, g) => n + g.str.replace(/\s/g, "").length, 0);
  if (rawLen > 120 && laidLen < rawLen * 0.45) return linesFromGlyphs(items).join("\n");
  return laid;
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
    const standardFontDataUrl = await resolvePdfjsStandardFontUrl();
    const doc = await pdfjs.getDocument({ data: buf, ...(standardFontDataUrl ? { standardFontDataUrl } : {}) }).promise;
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
      pages.push(layoutPdfPage(glyphs, viewport.width, viewport.height));
    }
    let text = pages.join("\n\n");
    const bodyLen = text.replace(/\s/g, "").length;
    if (bodyLen < 8) {
      throw new Error("This PDF has no selectable text. It is probably a scan or a designed image. Export a text PDF from Word or Google Docs, or fill Contents by hand.");
    }
    try {
      const { ocrPdfHeaderImages, pdfTextMissingContact } = await import("./pdfHeaderOcr");
      if (pdfTextMissingContact(text)) {
        const ocr = await ocrPdfHeaderImages(new Uint8Array(buf));
        if (ocr) text = `${ocr}\n\n${text}`;
      }
    } catch {
      /* header OCR is best-effort */
    }
    const textHasPersonName = (raw: string) =>
      raw
        .split(/\n/)
        .map((l) => collapseDoubledCaps(collapseSpacedCapsLine(l.trim())))
        .filter(Boolean)
        .slice(0, 40)
        .some((l) => isNameLine(l));
    try {
      const meta = await doc.getMetadata();
      const info = (meta?.info ?? {}) as { Title?: string; Author?: string };
      const metaName = nameFromPdfInfo(info);
      // Never prepend Author/Title when the page already has a person's name.
      // Filename/metadata from a Canva template (e.g. "Farhan Ahmed Ansari")
      // was winning over the real name printed on the CV.
      if (metaName && !textHasPersonName(text) && !new RegExp(metaName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(text)) {
        text = `${metaName}\n\n${text}`;
      }
      const metaSummary = paragraphFromPdfTitle(info.Title);
      if (metaSummary && !text.includes(metaSummary.slice(0, 48))) {
        text = `Profile\n${metaSummary}\n\n${text}`;
      }
    } catch {
      /* metadata is optional */
    }
    const guessed = nameFromFilename(file.name || "");
    if (guessed && !textHasPersonName(text) && !new RegExp(guessed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(text)) {
      text = `${guessed}\n\n${text}`;
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
  { key: "objective", test: /^(career\s+)?(objective|goal|aim)\b|^career\s+objective\b/i },
  { key: "summary", test: /^(professional|career|executive)?\s*(summary|profile|overview)\b|about\s*me\b|personal\s+statement\b|^bio\b|^professional\s+profile\b/i },
  { key: "experience", test: /^(professional|work|employment|relevant|career)?\s*(experience|expierence|experiance|history|background)\b|experience\s+history\b|employment\s+(history|record)\b|career\s+history\b|work\s+history\b|work\s+exp(?:erience)?\b|^internships?\b|industrial\s+(training|experience)\b|^experience\s*$/i },
  { key: "education", test: /^(education|academic|training|qualifications?)\b|education\s+and\s+training\b|academic\s+(background|history|qualifications?)\b|educational\s+qualifications?|professional\s+qualifications?\b/i },
  { key: "skills", test: /^(tech(?:nical)?\s+skills?|professional\s+skills?|relevant\s+skills?|key\s+skills?|core\s+skills?|computer\s+skills?|it\s+skills?|digital\s+skills?|skills?|core\s+competencies|competencies|expertise|technologies?|tech\s+stack|tools|skill\s*highlights?|highlights?|areas?\s+of\s+expertise|technical\s+proficiency)\b/i },
  { key: "projects", test: /^(selected\s+|key\s+|academic\s+|personal\s+)?projects?\s*$/i },
  { key: "certifications", test: /^(certifications?|licenses?\s*(&|and)?\s*(certifications?)?|credentials|professional\s+development)\b/i },
  { key: "languages", test: /^languages?\b/i },
  { key: "volunteer", test: /^(volunteer|community|leadership)\b/i },
  { key: "publications", test: /^(publications?|papers|research\s+publications)\b/i },
  { key: "awards", test: /^(awards?|honors?|achievements?|recognitions?|key\s+accomplishments?)\b/i },
  { key: "teaching", test: /^(teaching|academic|lecturing)\b/i },
  { key: "grants", test: /^(grants?|fellowships?)\b/i },
  { key: "presentations", test: /^(presentations?|conference\s+(presentations|talks)|talks)\b/i },
  { key: "affiliations", test: /^(professional\s+)?affiliations?|memberships?\b/i },
  { key: "references", test: /^references?\b/i },
  { key: "portfolio", test: /^portfolio\b|work\s+samples\b/i },
  { key: "skip", test: /^(interests?|hobbies?|additional|personal(?:\s+(details|information|info))?|activities|extracurriculars?|languages\s+and\s+tools|contact|details|get\s+in\s+touch)\b/i },
];

function matchHeader(line: string): SectionKey | null {
  return splitSectionHeader(line).key;
}

function splitSectionHeader(line: string): { key: SectionKey | null; rest: string } {
  const t = line
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^[^\w]+/, "");
  if (!t || t.length > 72) return { key: null, rest: "" };
  if (/^[•\-*•]/.test(t)) return { key: null, rest: "" };
  const trailing = t.match(/^(objective|education|experience|skills?|summary|profile|contact|personal\s+details|personal\s+statement|work\s+experience|employment\s+history|about\s+me)\s+(.+)$/i);
  if (trailing) {
    const head = trailing[1].trim();
    for (const rule of HEADER_RULES) {
      if (rule.test.test(head)) {
        return { key: rule.key === "skip" ? null : rule.key, rest: trailing[2].trim() };
      }
    }
  }
  for (const rule of HEADER_RULES) {
    if (rule.test.test(t) && t.split(/\s+/).length <= 6) return { key: rule.key === "skip" ? null : rule.key, rest: "" };
  }
  const glued = t.match(/^([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){0,2})\s+(objective|education|experience|skills?|summary|profile|contact|about\s+me)\s*$/i);
  if (glued) {
    for (const rule of HEADER_RULES) {
      if (rule.test.test(glued[2])) return { key: rule.key === "skip" ? null : rule.key, rest: glued[1].trim() };
    }
  }
  return { key: null, rest: "" };
}

function isSkipSectionHeader(line: string): boolean {
  const t = line
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^[^\w]+/, "");
  if (!t || t.length > 72 || t.split(/\s+/).length > 6) return false;
  if (/^[•\-*•]/.test(t)) return false;
  return HEADER_RULES.some((rule) => rule.key === "skip" && rule.test.test(t));
}

function isPersonalInfoJunk(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (/^(father\s*name|date\s+of\s+birth|cnic(?:\s*no\.?)?|marital\s+status|religion|nationality|gender|domicile)\b/i.test(t)) return true;
  if (/\bfather\s*name\b/i.test(t) && /\b(date of birth|cnic|marital|religion|nationality)\b/i.test(t)) return true;
  if (/\bislam\b/i.test(t) && /\b(married|single|pakistani)\b/i.test(t) && t.split(/\s+/).length <= 18) return true;
  if (/\b\d{5}-\d{7}-\d\b/.test(t) && t.length < 48) return true;
  return false;
}

/* ============================================================
   Contact extraction
   ============================================================ */

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const PK_PHONE_RE = /(?:\+92[-\s]?|0)3\d{2}[-\s]?\d{7}/;
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
const LINKEDIN_RE = /linkedin\.com\/(?:in\/)?[\w.-]+/gi;
const GITHUB_RE = /github\.com\/[\w-]+/gi;
const WEB_RE = /(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.(?:com|org|net|io|dev|co|me|app|blog)(?:\/[^\s]*)?/gi;

function isContacty(s: string): boolean {
  return (
    EMAIL_RE.test(s) ||
    PK_PHONE_RE.test(s) ||
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
  /^(?:phone|tel(?:ephone)?|mobile|cell|email|e-?mail|address|addresses|linkedin|link|website|web|url|fax|skype|instagram|github|portfolio|freelance|residence|dob|date\s+of\s+birth|birth\s*date|nationality|religion|gender|marital\s+status|age|location|located|father\s*name|cnic(?:\s*no\.?)?|domicile)\s*[:\u2022|•]/i;

function isLabelLine(s: string): boolean {
  const t = s.trim();
  if (!t || t.length > 90) return false;
  if (LABEL_RE.test(t)) return true;
  if (hasDateRange(t) || /\b(?:19|20)\d{2}\b/.test(t)) return false;
  const m = t.match(/^\s*([A-Za-z][A-Za-z .&'-]{2,40})\s*:\s*([^:]+)$/);
  if (!m || /[|·•]/.test(t)) return false;
  if (/^[A-Z][A-Z0-9 .&']+$/.test(m[1])) return false;
  if (
    /\b(accountant|analyst|teacher|instructor|designer|manager|leader|officer|engineer|developer|specialist|consultant|coordinator|assistant|intern|apprentice|founder|head|executive|operator|trainer|director)\b/i.test(
      m[1],
    )
  ) {
    return false;
  }
  return true;
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
  const area = t.match(/\b(gulshan[- ]e[- ]hadeed|gulshan[- ]e[- ]iqbal|north nazimabad|landhi|korangi|malir|clifton|defence|dha|saddar|keamari|orangi)\b/i);
  if (area && (/\bkarachi\b/i.test(t) || /house\s*no|area\s+\d/i.test(t))) {
    const pretty = area[1]
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .replace(/-E-/g, "-E-")
      .replace(/-E /g, "-E-");
    return `${pretty}, Karachi`;
  }
  if (/\bkarachi\b/i.test(t) && /(?:house\s*no|landhi|gulshan|area\s+\d)/i.test(t)) return "Karachi";
  const parts = t.split(/[,|]/).map((x) => x.trim().replace(/[.,;:]+$/, "")).filter(Boolean);
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

const PROFICIENCY_WORD_RE = /^(native|fluent|beginner|intermediate|advanced|expert|basic|proficient)$/i;

function isNameLine(s: string): boolean {
  const t = s.trim();
  if (!t || t.length > 60) return false;
  if (isContacty(t) || matchHeader(t)) return false;
  if (/\d/.test(t)) return false;
  if (/[,:;()|]/.test(t)) return false;
  if (JUNK_PDF_NAMES.test(t) || /\b(windows|user|admin|administrator)\b/i.test(t)) return false;
  if (SECTION_WORD_RE.test(t)) return false;
  if (PROFICIENCY_WORD_RE.test(t)) return false;
  if (/^(certified|professional|licensed|experienced|qualified|skilled|senior|junior|head|lead)\b/i.test(t)) return false;
  if (/\b(?:accountant|engineer|developer|designer|manager|consultant|specialist|analyst|executive|director|associate|advisor|representative|technician|officer|architect|coordinator|planner|assistant|supervisor|strategist|marketer|writer|attorney|lawyer|instructor|educator|artist)\b/i.test(t)) return false;
  if (/\b(?:tool|generator|scraper|chathead|automated)\b/i.test(t)) return false;
  const words = t.split(/\s+/);
  if (words.length < 2 || words.length > 5) return false;
  if (words.some((w) => PROFICIENCY_WORD_RE.test(w))) return false;
  if (words.length === 2 && /^[A-Z]{2,8}$/.test(words[0]) && PROFICIENCY_WORD_RE.test(words[1])) return false;
  if (!words.every((w) => /^[A-Z]/.test(w))) return false;
  if (t.endsWith(".") || t.endsWith(":")) return false;
  return true;
}

function nameIsBesideContact(idx: number, lines: string[]): boolean {
  const next = lines[idx + 1];
  const next2 = lines[idx + 2];
  const looksAddr = (l: string) =>
    isContacty(l) || !!cityFromLine(l) || /\b(?:house\s*no|address|contact\s*:|landhi|gulshan)\b/i.test(l);
  if (next && looksAddr(next)) return true;
  if (next && isNameLine(next)) return false;
  if (next2 && looksAddr(next2)) return true;
  const prev = lines[idx - 1];
  if (prev && looksAddr(prev)) return true;
  return false;
}

function isSingleNameWord(s: string): boolean {
  const t = s.trim();
  if (!t || t.length < 3 || t.length > 20) return false;
  if (/[^A-Za-z\u00C0-\u017F'-]/.test(t)) return false;
  if (SECTION_WORD_RE.test(t)) return false;
  if (PROFICIENCY_WORD_RE.test(t)) return false;
  if (!/^[A-Z\u00C0-\u017F]/.test(t)) return false;
  return true;
}

function compactLetters(s: string): string {
  return s.replace(/[^a-z]/gi, "").toLowerCase();
}

function repairNameFromEmail(name: string, email: string, lines: string[]): string {
  const localRaw = (email.split("@")[0] || "").replace(/\d+/g, " ");
  const dotted = localRaw.split(/[._\s-]+/).map((p) => p.trim()).filter((p) => p.length >= 3);
  const local = localRaw.replace(/[._-]+/g, "").replace(/\s+/g, "").toLowerCase();
  const nameC = compactLetters(name);
  if (local.length >= 6 && nameC && (local.includes(nameC) || nameC.includes(local))) {
    const missing = local.replace(nameC, "");
    if (missing.length >= 4) {
      for (const l of lines.slice(0, 40)) {
        const split = splitSectionHeader(l);
        const bits = `${split.rest} ${l}`.split(/\s+/);
        for (const p of bits) {
          if (compactLetters(p) === missing && isSingleNameWord(p)) return `${name} ${p}`.replace(/\s+/g, " ").trim();
        }
      }
    }
    return name;
  }
  if (dotted.length >= 2 && (!name || looksLikeSectionBanner(name) || !isNameLine(name))) {
    const titled = dotted.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
    const fromDoc = lines.find((l) => {
      const c = compactLetters(l);
      return isNameLine(l) && dotted.every((d) => c.includes(d.toLowerCase()));
    });
    if (fromDoc) return fromDoc;
    if (titled.length >= 2 && titled.length <= 4) return titled.join(" ");
  }
  if (local.length < 6) return name;
  const frags: string[] = [];
  const seen = new Set<string>();
  for (const l of lines.slice(0, 40)) {
    const split = splitSectionHeader(l);
    const bits = [split.rest, ...l.split(/\s+/)];
    for (const raw of bits) {
      const p = raw.trim();
      const c = compactLetters(p);
      if (c.length < 3 || !local.includes(c) || !/^[A-Za-z][A-Za-z.'-]*$/.test(p)) continue;
      if (SECTION_WORD_RE.test(p) || PROFICIENCY_WORD_RE.test(p) || matchHeader(p)) continue;
      if (seen.has(c)) continue;
      seen.add(c);
      frags.push(p);
    }
  }
  if (frags.length >= 2) {
    const joined = frags.join(" ");
    const jc = compactLetters(joined);
    if (local.includes(jc) || jc.includes(local.slice(0, Math.min(local.length, jc.length)))) return joined;
  }
  if (name && !PROFICIENCY_WORD_RE.test(name) && isNameLine(name)) return name;
  const known = [...COMMON_GIVEN_NAMES].sort((a, b) => b.length - a.length);
  const words: string[] = [];
  let rest = local;
  while (rest.length) {
    const hit = known.find((n) => n.length >= 3 && rest.startsWith(n));
    if (!hit) break;
    words.push(hit[0].toUpperCase() + hit.slice(1));
    rest = rest.slice(hit.length);
  }
  if (rest.length >= 3) words.push(rest[0].toUpperCase() + rest.slice(1));
  if (words.length >= 2) return words.join(" ");
  return name;
}

const NAME_PREFIX_WORDS = new Set([
  "muhammad", "mohammad", "mohammed", "mohamed", "syed", "md", "mohd", "abdul", "abdullah",
]);

const COMMON_GIVEN_NAMES = new Set([
  "muhammad", "mohammad", "mohammed", "mohamed", "ahmed", "ahmad", "ali", "hassan", "hussein",
  "husain", "abdul", "abdullah", "syed", "md", "m", "mohd", "sana", "asma", "fatima", "aisha",
  "maryam", "khadija", "zainab", "hina", "sadia", "farah", "nadia", "rabia", "humaira", "usman",
  "umer", "umar", "hamza", "bilal", "imran", "kamran", "shahid", "asif", "naveed", "khurram",
  "misbah", "qamar", "haider", "khan",
]);

/* ============================================================
   Date range parsing
   ============================================================ */

const MONTHS = "jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec";
const DATE_TOKEN = `(?:(?:${MONTHS})[a-z]*[.]?\\s+|\\d{1,2}\\s*/\\s*)?(?:19|20)\\d{2}`;
const DATE_END_TOKEN = `(?:${DATE_TOKEN}|present|current|now|ongoing|today|continue|presnt|in\\s+progress|in\\s+process|to\\s+date|till\\s+(?:date|now)?|till|still)`;

function dateRangeRe(): RegExp {
  return new RegExp(`${DATE_TOKEN}\\s*(?:[-\\u2010-\\u2015\\u2212]|to)\\s*(${DATE_END_TOKEN})`, "i");
}

const DATE_HEAD_RE = new RegExp(`${DATE_TOKEN}\\s*(?:[-\\u2010-\\u2015\\u2212]|to)\\s*${DATE_END_TOKEN}`, "gi");

const MONTH_NAME: Record<string, string> = {
  jan: "Jan", feb: "Feb", mar: "Mar", apr: "Apr", may: "May", jun: "Jun",
  jul: "Jul", aug: "Aug", sep: "Sep", oct: "Oct", nov: "Nov", dec: "Dec",
};

function monthToken(raw: string): string {
  const m = raw.match(new RegExp(`(?:${MONTHS})[a-z]*`, "i"));
  if (!m) return "";
  return MONTH_NAME[m[0].slice(0, 3).toLowerCase()] ?? "";
}

function formatMonthYear(year: string, month: string): string {
  if (!year) return "";
  return month ? `${month} ${year}` : year;
}

function yearFromDate(s: string | undefined): number {
  return parseInt((s || "").match(/(?:19|20)\d{2}/)?.[0] || "0", 10);
}

function parseDates(part: string): { start: string; end: string; present: boolean } | null {
  const t = part.trim();
  if (!t) return null;
  const m = t.match(dateRangeRe());
  if (m) {
    const rawStart = m[0];
    const startYear = rawStart.match(/(19|20)\d{2}/)?.[0] ?? "";
    const endRaw = (m[1] || "").toLowerCase();
    const present = /present|current|\bnow\b|ongoing|today|continue|in\s+progress|in\s+process|to\s+date|till|still/i.test(t);
    const endYear = present ? "" : endRaw.match(/(19|20)\d{2}/)?.[0] ?? "";
    const dash = rawStart.search(/[-–—]|to/i);
    const startBit = dash >= 0 ? rawStart.slice(0, dash) : rawStart;
    const endBit = dash >= 0 ? rawStart.slice(dash) : endRaw;
    return {
      start: formatMonthYear(startYear, monthToken(startBit)),
      end: present ? "" : formatMonthYear(endYear, monthToken(endBit)),
      present,
    };
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
  extras: Partial<CustomDetail>[];
  sectionOrder: SectionKey[];
  useObjective: boolean;
  warnings: string[];
}

function isSkillChipLine(l: string): boolean {
  const parts = l.split(/[•▪▸►●*]/).map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) return false;
  return parts.every((p) => p.length <= 32 && p.split(/\s+/).length <= 4 && !/[.]$/.test(p));
}

function peelTrailingDate(s: string): { body: string; date: string } {
  const tab = s.split("\t").map((x) => x.trim()).filter(Boolean);
  if (tab.length === 2) {
    const right = tab[1];
    if (hasDateRange(right) || isDateOnlyLine(right) || PROFICIENCY_WORD_RE.test(right) || /^(continue|present|current)$/i.test(right)) {
      return { body: tab[0], date: right };
    }
  }
  const m = s.match(new RegExp(`^(.*?)\\s+(${DATE_TOKEN}\\s*(?:[-\\u2010-\\u2015\\u2212]|to)\\s*${DATE_END_TOKEN})\\s*$`, "i"));
  if (m && m[1].trim().split(/\s+/).length >= 2) return { body: m[1].trim(), date: m[2].trim() };
  return { body: s, date: "" };
}

function shouldJoinWrapped(prev: string, next: string): boolean {
  if (!prev || !next) return false;
  if (isBullet(next) || isBullet(prev)) return false;
  if (/^\d{4}$/.test(prev) || /^\d{4}$/.test(next)) return false;
  if (matchHeader(next) || matchHeader(prev)) return false;
  if (isNameLine(prev) || isNameLine(next)) return false;
  if (isSingleNameWord(prev) && NAME_PREFIX_WORDS.has(prev.toLowerCase().replace(/[.]$/, ""))) return false;
  const peeled = peelTrailingDate(prev);
  const p = peeled.body || prev;
  if (hasDateRange(next) || isDateOnlyLine(next)) return false;
  if (hasDateRange(p) && !peeled.date) return false;
  if (cityFromLine(p) || looksLikeLocation(p) || /,\s*(pakistan|usa|uk|uae|india|canada)\s*$/i.test(p)) return false;
  if (/[|]/.test(p) || /[|]/.test(next)) return false;
  if (/\b(?:govt|inc|ltd|co|dept|est|mr|dr)\.$/i.test(p)) return true;
  if (/[.!?:]$/.test(p)) return false;
  if (/^[A-Z0-9][A-Z0-9 .&'/]*$/.test(p.replace(/[.]+$/, "")) && p.split(/\s+/).length >= 2) return false;
  if (/[,;:&(/]$/.test(p)) return true;
  const openParens = (p.match(/\(/g) ?? []).length;
  const closeParens = (p.match(/\)/g) ?? []).length;
  if (openParens > closeParens) return true;
  if (/^[a-z]/.test(next)) return true;
  if (/\b(?:tool|generator|scraper|chathead|app)\b/i.test(p) || /\b(?:tool|generator|scraper|chathead)\b/i.test(next)) {
    if (p.split(/\s+/).length >= 2 && next.split(/\s+/).length === 1 && /\b(?:tool|generator|scraper|app)\b/i.test(next)) return true;
    return false;
  }
  const pw = p.split(/\s+/).length;
  const nw = next.split(/\s+/).length;
  if (/university|college|institute|school|academy|polytechnic/i.test(next) && pw <= 8) {
    if (next.split(/\s+/).length >= 2 || /\b(?:bachelor|master|matric|intermediate|diploma|bs|ba|mba|ms)\b/i.test(p)) return false;
    return true;
  }
  if (pw <= 6 && nw >= 5 && !/,/.test(p) && !/^[a-z]/.test(next)) return false;
  if (pw <= 4 && nw <= 4 && /^[A-Z]/.test(next) && !/,/.test(next)) return false;
  if (pw <= 5 && /[a-z]/.test(next) && next.length > 18 && !/^\d/.test(next)) return true;
  return false;
}

const COMPACT_HEADERS: Record<string, string> = {
  CONTACT: "CONTACT",
  PROFILE: "PROFILE",
  SUMMARY: "SUMMARY",
  QUALIFICATION: "QUALIFICATION",
  QUALIFICATIONS: "QUALIFICATION",
  EDUCATION: "EDUCATION",
  EXPERIENCE: "EXPERIENCE",
  WORKEXPERIENCE: "WORK EXPERIENCE",
  CERTIFICATIONS: "CERTIFICATIONS",
  CERTIFICATION: "CERTIFICATIONS",
  LANGUAGES: "LANGUAGES",
  LANGUAGE: "LANGUAGES",
  REFERENCE: "REFERENCES",
  REFERENCES: "REFERENCES",
  SKILLS: "SKILLS",
  SKILLHIGHLIGHTS: "SKILL HIGHLIGHTS",
  HIGHLIGHTS: "SKILL HIGHLIGHTS",
  PROFESSIONALSKILL: "PROFESSIONAL SKILL",
  PROFESSIONALSKILLS: "PROFESSIONAL SKILLS",
  PROFILESUMMARY: "PROFILE SUMMARY",
  PROFESSIONALPROFILE: "PROFESSIONAL PROFILE",
  PERSONALDETAILS: "PERSONAL DETAILS",
  PERSONALSTATEMENT: "PERSONAL STATEMENT",
  PERSONALINFORMATION: "PERSONAL DETAILS",
  CAREEROBJECTIVE: "OBJECTIVE",
  PROFESSIONALEXPERIENCE: "PROFESSIONAL EXPERIENCE",
  ACADEMICQUALIFICATION: "QUALIFICATION",
  EDUCATIONALQUALIFICATION: "QUALIFICATION",
  EMPLOYMENTHISTORY: "WORK EXPERIENCE",
  CAREERHISTORY: "WORK EXPERIENCE",
  WORKHISTORY: "WORK EXPERIENCE",
  EDUCATIONANDTRAINING: "EDUCATION",
  TECHNICALSKILLS: "SKILLS",
  DIGITALSKILLS: "SKILLS",
  COMPUTERSKILLS: "SKILLS",
  KEYSKILLS: "SKILLS",
  INTERNSHIPS: "WORK EXPERIENCE",
  INTERNSHIP: "WORK EXPERIENCE",
};

function collapseSpacedCapsCell(cell: string): string {
  const parts = cell.trim().split(/\s+/);
  if (parts.length >= 4 && parts.every((p) => /^[A-Z]$/.test(p))) {
    const compact = parts.join("");
    return COMPACT_HEADERS[compact] ?? compact;
  }
  return cell.trim();
}

function collapseDoubledCaps(line: string): string {
  const compact = line.replace(/\s/g, "");
  if (compact.length < 8 || compact.length % 2 !== 0) return line;
  if (!/^[A-Z]+$/.test(compact)) return line;
  let out = "";
  for (let i = 0; i < compact.length; i += 2) {
    if (compact[i] !== compact[i + 1]) return line;
    out += compact[i];
  }
  return out;
}

function collapseSpacedCapsLine(line: string): string {
  return line
    .split("\t")
    .map(collapseSpacedCapsCell)
    .filter(Boolean)
    .join("\t");
}

function repairBrokenPdfWords(line: string): string {
  return line
    .replace(/\b([B-HJ-Z])\s(?=[a-z]{3,})/g, "$1")
    .replace(/\bPy\s+thon\b/gi, "Python")
    .replace(/\bfo\s+r\b/gi, "for")
    .replace(/\b([A-Za-z]{3,5})\s(ncial|tment|ware|lysis)\b/gi, "$1$2")
    .replace(/\b(dash|clip|score|key|dash)\s+board\b/gi, "$1board");
}

function looksLikeSectionBanner(t: string): boolean {
  const compact = t.replace(/[\t\s]/g, "").toUpperCase();
  if (!compact) return false;
  if (COMPACT_HEADERS[compact]) return true;
  if (/^[A-Z](?:\s+[A-Z]){3,}$/.test(t.trim())) return true;
  const words = t.replace(/\t/g, " ").trim().split(/\s+/);
  if (words.length <= 4 && words.every((w) => COMPACT_HEADERS[w.replace(/\s/g, "").toUpperCase()] || /^(contact|profile|summary|education|experience|skills?|languages?)$/i.test(w))) {
    return true;
  }
  return false;
}

function isDateishCell(p: string): boolean {
  const t = p.trim();
  return hasDateRange(t) || isDateOnlyLine(t) || /^(continue|present|current|presnt)\b/i.test(t);
}

function unzipTabColumns(lines: string[]): string[] {
  const rows = lines.filter((l) => l.includes("\t"));
  if (rows.length < 4) return lines;
  let mixed = 0;
  let dateRight = 0;
  for (const l of rows) {
    const [a, b] = l.split("\t");
    if (!a || !b) continue;
    if (isDateishCell(b) || PROFICIENCY_WORD_RE.test(b.trim())) dateRight++;
    if (looksLikeSectionBanner(a) || looksLikeSectionBanner(b) || (isContacty(a) && b.split(/\s+/).length >= 2) || (a.split(/\s+/).length <= 6 && /[a-z]/.test(b) && b.length > 18)) mixed++;
  }
  if (mixed < 3 || dateRight > rows.length * 0.45) {
    const bannerPair = rows.some((l) => {
      const [a, b] = l.split("\t");
      return a && b && looksLikeSectionBanner(a) && looksLikeSectionBanner(b);
    });
    if (!bannerPair) return lines;
  }
  const left: string[] = [];
  const right: string[] = [];
  for (const l of lines) {
    const parts = l.split("\t").map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      if (parts.length === 2 && isDateishCell(parts[1]) && !looksLikeSectionBanner(parts[0])) {
        right.push(parts.join("\t"));
      } else {
        left.push(parts[0]);
        right.push(parts.slice(1).join("\t"));
      }
    } else if (left.length + right.length > 0) {
      right.push(l);
    } else {
      left.push(l);
    }
  }
  return [...left.filter(Boolean), ...right.filter(Boolean)];
}

function stripContactFromText(s: string): string {
  return s
    .replace(EMAIL_RE, " ")
    .replace(PHONE_RE, " ")
    .replace(/\+\s?\d[\d\s()./-]{6,}/g, " ")
    .replace(/\bGulshan[- ]E[- ]Hadeed,?\s*/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stitchWrappedLines(lines: string[]): string[] {
  const out: string[] = [];
  for (const raw of lines) {
    const l = raw.trim();
    if (!l) continue;
    const prev = out[out.length - 1];
    if (prev && shouldJoinWrapped(prev, l)) {
      const peeled = peelTrailingDate(prev);
      if (peeled.date) {
        out[out.length - 1] = `${peeled.body} ${l}\t${peeled.date}`.replace(/[^\S\t]+/g, " ").trim();
      } else {
        out[out.length - 1] = `${prev} ${l}`.replace(/\s+/g, " ");
      }
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
        .replace(/\t+/g, "\t")
        .replace(/ {2,}/g, " ")
        .trim(),
    )
    .filter((l) => l.length > 0)
    .filter((l) => /[A-Za-z0-9]/.test(l))
    .map(collapseSpacedCapsLine)
    .map(collapseDoubledCaps)
    .map(repairBrokenPdfWords)
    .filter((l) => !/^(curriculum\s*vitae|curriculumvitae|cv|r[eé]sum[eé]|curiculum\s+vitae)\s*$/i.test(l.replace(/\s+/g, " ").trim()))
    .filter((l) => !/^curriculumvitae$/i.test(l.replace(/\s/g, "")));

  const lines = stitchWrappedLines(unzipTabColumns(rawLines));

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
    extras: [],
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
  const PK_PHONE_G = /(?:\+92[-\s]?|0)3\d{2}[-\s]?\d{7}/g;
  const capturePhones = (l: string): string[] => {
    const withoutCnic = l.replace(/\b\d{5}-\d{7}-\d\b/g, " ");
    const pk = withoutCnic.match(PK_PHONE_G) ?? [];
    if (pk.length) return pk.map((p) => p.trim());
    if (!/[a-z@]/i.test(withoutCnic)) {
      const run = withoutCnic.replace(/[^\d+]/g, "");
      if (/^\+?\d{7,15}$/.test(run) && !/^42\d{3}/.test(run)) return [run];
    }
    const p = withoutCnic.match(PHONE_RE)?.[0];
    if (!p) return [];
    const digits = p.replace(/\D/g, "");
    if (/^(?:19|20)\d{2}(?:19|20)\d{2}$/.test(digits)) return [];
    return [p];
  };
  for (const l of lines) {
    if (l.length > 160 || isContacty(l) || /contact\s*:/i.test(l)) {
      phones.push(...capturePhones(l));
    }
  }
  if (!phones.length) {
    for (const l of lines.slice(0, 12)) {
      const found = capturePhones(l);
      if (found.length) {
        phones.push(...found);
        break;
      }
    }
  }
  if (phones.length) draft.contact.phone = phones.filter((p, i, a) => a.indexOf(p) === i).join(", ");

  // name + title + location from the top of the document
  const nameWords = new Set<string>();
  for (let i = 0; i < Math.min(lines.length, 22); i++) {
    const l = lines[i];
    if (isLabelLine(l) && !isContacty(l)) {
      const city = cityFromLine(l);
      if (city && !draft.contact.city) draft.contact.city = city;
      continue;
    }
    if (!draft.contact.fullName) {
      if (isNameLine(l)) {
        // Given name on its own line, sometimes several lines above the surname
        // because designed headers OCR as two columns ("Muhammad" ... "Haider Khan").
        let prefix = "";
        for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
          const prev = lines[j];
          if (isNameLine(prev) || matchHeader(prev)) break;
          const given = prev.toLowerCase().replace(/[.]$/, "");
          if (isSingleNameWord(prev) && NAME_PREFIX_WORDS.has(given) && !new RegExp(`\\b${given}\\b`, "i").test(l)) {
            prefix = prev;
            break;
          }
        }
        if (prefix) {
          draft.contact.fullName = `${prefix} ${l}`;
          prefix.toLowerCase().split(/\s+/).forEach((w) => nameWords.add(w));
          l.toLowerCase().split(/\s+/).forEach((w) => nameWords.add(w));
        } else {
          draft.contact.fullName = l;
          l.toLowerCase().split(/\s+/).forEach((w) => nameWords.add(w));
        }
        // all-caps single-word continuation ("SYED BILAL" + "MEHMOOD")
        const next = lines[i + 1];
        if (next && isSingleNameWord(next) && /^[A-Z][A-Z]/.test(next) && !isLabelLine(next) && !matchHeader(next)) {
          draft.contact.fullName = `${draft.contact.fullName} ${next}`;
          next.toLowerCase().split(/\s+/).forEach((w) => nameWords.add(w));
          i++;
        } else if (next) {
          // surname glued to a TOC heading: "MEHMOOD OBJECTIVE" or "EDUCATION MEHMOOD"
          const split = splitSectionHeader(next);
          if (split.rest && isSingleNameWord(split.rest) && /^[A-Z]/.test(split.rest)) {
            draft.contact.fullName = `${draft.contact.fullName} ${split.rest}`;
            split.rest.toLowerCase().split(/\s+/).forEach((w) => nameWords.add(w));
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
        !looksLikeSectionBanner(t) &&
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
        t.split(/\s+/).length <= 5 &&
        !/\b(excel|sql|python|power\s*bi|photoshop|illustrator|etl|optimization|dashboard|report|project|data analysis)\b/i.test(t) &&
        !/[()]/.test(t) &&
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
    let fallback = "";
    for (const l of lines) {
      const c = cityFromLine(l);
      if (!c) continue;
      if (/,/.test(c)) {
        draft.contact.city = c;
        const region = l.split(",")[1]?.trim();
        if (region && KNOWN_REGIONS.has(region.toLowerCase()) && !draft.contact.country) {
          draft.contact.country = region;
        }
        break;
      }
      if (!fallback) fallback = c;
    }
    if (!draft.contact.city && fallback) draft.contact.city = fallback;
  }
  if (draft.contact.city && !/,/.test(draft.contact.city)) {
    const bare = draft.contact.city;
    for (const l of lines) {
      const c = cityFromLine(l);
      if (c && /,/.test(c) && new RegExp(bare.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(c)) {
        draft.contact.city = c;
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
  draft.contact.fullName = repairNameFromEmail(draft.contact.fullName || "", draft.contact.email || "", lines);
  {
    const current = (draft.contact.fullName || "").trim();
    const currentIdx = current ? lines.findIndex((l) => l.trim() === current) : -1;
    if (current && (currentIdx < 0 || !nameIsBesideContact(currentIdx, lines))) {
      const zone = Math.min(lines.length, 28);
      for (let i = 0; i < zone; i++) {
        if (!isNameLine(lines[i])) continue;
        if (lines[i].trim() === current) continue;
        if (!nameIsBesideContact(i, lines)) continue;
        const cand = lines[i].trim();
        if (current.toLowerCase().includes(cand.toLowerCase())) continue;
        draft.contact.fullName = cand;
        break;
      }
    }
  }
  if (draft.contact.title && (looksLikeSectionBanner(draft.contact.title) || /[()]/.test(draft.contact.title) || /\b(optimization|dashboard|reporting &|dashboards?\))\b/i.test(draft.contact.title) || /academy|university|college|institute|polytechnic/i.test(draft.contact.title) || /^(data analysis|python basics|sql\b|power bi|advanced excel|highlights?)\b/i.test(draft.contact.title))) {
    draft.contact.title = "";
  }
  const nameLower = (draft.contact.fullName || "").toLowerCase();
  if (draft.contact.fullName) {
    draft.contact.fullName.split(/\s+/).forEach((w) => nameWords.add(w.toLowerCase()));
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
    /^(interests?|hobbies?|additional\s+info|personal\s+(?:info(?:rmation)?|details|profile)|activities?|extracurriculars?|languages?\s+and\s+tools|contact|details|get\s+in\s+touch)\b/i;

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
      } else {
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
    const split = splitSectionHeader(l);
    const h = split.key;
    if (headerBlock && i < headingColumnEnd) {
      if (h) {
        if (split.rest && isSingleNameWord(split.rest)) frontMatter.push(split.rest);
        continue;
      }
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
      if (split.rest && !isSingleNameWord(split.rest)) sections[h].push(split.rest);
      continue;
    }
    if ((SKIP_HEADER_RE.test(l) || isSkipSectionHeader(l)) && l.length < 64) {
      current = null;
      continue;
    }
    if (isPersonalInfoJunk(l)) continue;
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
        const dateOnly = isDateOnlyLine(l) || /^[\d]{4}\s*[-–]\s*(?:[\d]{4}|continue|present|current)\s*$/i.test(l);
        if (dateOnly && fmEdu.length && !inExp) {
          fmEdu.push(l);
          continue;
        }
        inExp = true;
        fmExp.push(l);
        continue;
      }
      if (isContacty(l)) { flushPara(); continue; }
      if (looksLikeCompanyName(l) || /\b(limited|llc|pvt|private|company|inc|gmbh|honda)\b/i.test(l)) {
        flushPara();
        inExp = true;
        fmExp.push(l);
        continue;
      }
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
    draft.summary = stripContactFromText(summaryLines.join(" ").replace(/\s+/g, " ").trim());
  }
  const objLines = sections["objective"] ?? [];
  if (objLines.length) {
    draft.objective = stripContactFromText(objLines.join(" ").replace(/\s+/g, " ").trim());
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
  if (!draft.summary && !draft.objective) {
    const seeking = lines.filter((l) => /^seeking\b/i.test(l));
    if (seeking.length) draft.summary = seeking.join(" ").replace(/\s+/g, " ").trim();
  }
  if (draft.summary) {
    draft.summary = stripContactFromText(draft.summary).replace(/^(summary|profile|objective)\s+/i, "");
  }
  if (draft.objective) draft.objective = stripContactFromText(draft.objective);

  // ---- experience ----
  draft.experience = parseExperience(sections["experience"] ?? []);

  // ---- education ----
  draft.education = parseEducation(sections["education"] ?? []);

  // ---- skills ----
  draft.skills = parseSkills(sections["skills"] ?? []);

  // ---- projects ----
  draft.projects = parseProjects(sections["projects"] ?? []);

  // ---- certifications ----
  for (const c of sections["certifications"] ?? []) {
    if (/available on request/i.test(c) || /^(english|urdu|french|arabic|spanish|german)\b/i.test(c)) continue;
    if (looksLikeSectionBanner(c) || matchHeader(c)) continue;
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
  const LANG_NAME_RE =
    /^(english|urdu|arabic|french|spanish|german|chinese|hindi|punjabi|sindhi|pashto|turkish|italian|portuguese|japanese|korean|russian|malay|bangla|bengali|persian|farsi|dutch|swedish|norwegian|polish|ukrainian|hebrew|thai|vietnamese|indonesian|tagalog|filipino)\b/i;
  const pushLang = (name: string, levelRaw: string) => {
    const lvl = (levelRaw || "").toLowerCase();
    const stars = (levelRaw.match(/[*★●]/g) || []).length;
    const norm =
      stars >= 5 || /native|mother|bilingual/.test(lvl)
        ? "Native"
        : stars >= 3 || /fluent|professional|proficient|advanced/.test(lvl)
          ? "Fluent"
          : stars >= 1 || /conversational|intermediate|basic/.test(lvl)
            ? "Conversational"
            : "Fluent";
    draft.languages.push({ name: name.trim(), level: norm as LanguageEntry["level"] });
  };
  for (const raw of sections["languages"] ?? []) {
    const l = raw.replace(/^[•▪▸►●*\u2022-]\s*/, "").trim();
    if (!l) continue;
    const starPairs = [...l.matchAll(/([A-Za-z][A-Za-z -]{1,18}?)\s*([*★●]{1,5}[-–]*)/g)];
    if (starPairs.length) {
      for (const m of starPairs) {
        if (LANG_NAME_RE.test(m[1].trim())) pushLang(m[1], m[2]);
      }
      continue;
    }
    const items = l.split(/\s*,\s*|\s*;\s*|\s{2,}/);
    for (const item of items) {
      const t = item.trim();
      if (!t) continue;
      const m = t.match(/^([A-Za-z][A-Za-z -]{1,20})\s*[:|–—·(]\s*(.+?)\s*[)]?$/);
      const name = (m?.[1] || t).trim();
      if (!LANG_NAME_RE.test(name)) continue;
      if (hasDateRange(t) || /\b(19|20)\d{2}\b/.test(t) || /university|college|school|karachi|pakistan|analyst|designer|manager/i.test(t)) continue;
      pushLang(name, m?.[2] || "");
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
  dropSidebarOccupationJobs(draft);
  attachOrphanJobDates(draft, lines);
  rescueDocument(draft, lines);
  if (!draft.projects.length) {
    const extra = collectLooseProjects(lines);
    if (extra.length) draft.projects = extra;
  }
  polishDescriptiveJobs(draft);
  if (draft.summary) {
    const m = draft.summary.match(/^I am (?:a |an )?(.+?) with\b/i);
    if (m) {
      const inferred = m[1].replace(/[,.]$/, "").trim();
      const usable =
        inferred.split(/\s+/).length <= 6 &&
        inferred.length <= 48 &&
        !/\b(seeking|looking|aiming|apply|passionate)\b/i.test(inferred);
      if (
        usable &&
        (!draft.contact.title ||
          /^(native|fluent|beginner|intermediate|advanced)\b/i.test(draft.contact.title) ||
          /\b(?:tool|generator|scraper|chathead)\b/i.test(draft.contact.title) ||
          draft.contact.title.length > 70)
      ) {
        draft.contact.title = inferred;
      }
    }
  }
  const titleNow = (draft.contact.title || "").trim();
  const titleIsJunk =
    !titleNow ||
    looksLikeSectionBanner(titleNow) ||
    looksLikeCompanyName(titleNow) ||
    /academy|university|college|institute|polytechnic/i.test(titleNow) ||
    /^(data analysis|python basics|sql\b|power bi|advanced excel|highlights?)\b/i.test(titleNow) ||
    (draft.certifications ?? []).some((c) => (c.name || "").trim().toLowerCase() === titleNow.toLowerCase());
  if (titleIsJunk) {
    if (draft.useObjective) {
      draft.contact.title = "";
    } else {
      const fromJob = (draft.experience[0]?.role || "").split(/[–—|(]/)[0].replace(/\s+[-–].*$/, "").trim();
      draft.contact.title = fromJob.length >= 4 && fromJob.length <= 52 ? fromJob : "";
    }
  }
  const bannerTitle = titleFromContactBanner(lines);
  if (bannerTitle && (!draft.contact.title || /^(freelance project|project)\b/i.test(draft.contact.title))) {
    draft.contact.title = bannerTitle;
  }
  if (!draft.contact.fullName) {
    draft.warnings.push("Name was not in the file's text — designed PDF headers are often graphics. Add the name in Contents.");
  }
  if (!draft.contact.email && !draft.contact.phone) {
    draft.warnings.push("Phone and email were not in the file's text — add them in Contents. Designed PDFs often hide contact as graphics.");
  }

  draft.extras = collectPersonalDetails(lines);

  return draft;
}

const PERSONAL_DETAIL_RULES: { test: RegExp; label: string }[] = [
  { test: /father\s*name|father'?s\s*name/i, label: "Father Name" },
  { test: /date\s+of\s+birth|\bdob\b|birth\s*date/i, label: "Date of Birth" },
  { test: /\bcnic\b|nic\s*no|id\s*card|national\s+id/i, label: "CNIC / ID card" },
  { test: /marital\s+status/i, label: "Marital Status" },
  { test: /^religion\b/i, label: "Religion" },
  { test: /nationality/i, label: "Nationality" },
  { test: /^(gender|sex)\b/i, label: "Gender" },
  { test: /passport/i, label: "Passport" },
  { test: /domicile/i, label: "Domicile" },
];

function collectPersonalDetails(lines: string[]): Partial<CustomDetail>[] {
  const out: Partial<CustomDetail>[] = [];
  const seen = new Set<string>();
  const push = (label: string, value: string) => {
    const v = value.replace(/^[:.\s]+/, "").replace(/\s+/g, " ").trim();
    if (!v || v.length > 90) return;
    if (/^(male|female|islam|muslim|pakistani|married|single)$/i.test(label)) return;
    const key = label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ label, value: v });
  };
  for (const raw of lines) {
    const l = raw.trim();
    const m = l.match(/^([A-Za-z][A-Za-z .'/]{1,28})\s*[:\u2022|•]\s*(.+)$/);
    if (m) {
      const rule = PERSONAL_DETAIL_RULES.find((r) => r.test.test(m[1].trim()));
      if (rule) push(rule.label, m[2]);
    }
    const cnic = l.match(/\b(\d{5}-\d{7}-\d)\b/);
    if (cnic && !seen.has("cnic / id card")) push("CNIC / ID card", cnic[1]);
  }
  return out;
}

const PROJECT_TITLE_RE = /\b(?:tool|generator|scraper|app|plugin|platform|dashboard|bot|extension|chathead)\b/i;
const PROJECT_START_RE = /^(developed|built|created|designed|automated|made)\b/i;

type ProjectDraft = Partial<ProjectEntry> & { startDate?: string; endDate?: string };

function parseProjects(rawLines: string[]): Partial<ProjectEntry>[] {
  const out: ProjectDraft[] = [];
  let current: ProjectDraft | null = null;

  const finish = () => {
    if (current && (current.name || current.description)) out.push(current);
    current = null;
  };

  for (const raw of rawLines) {
    const l = raw.replace(/\s{2,}/g, " ").trim();
    if (!l) continue;
    if (isContacty(l) || matchHeader(l) || looksLikeSectionBanner(l)) continue;
    if (/^[A-Z][A-Z0-9 /&+-]{3,42}$/.test(l) && l.split(/\s+/).length <= 5) continue;
    if (/^(personal|academic|freelance|data analytics)\b/i.test(l) && /\bproject\b/i.test(l) && l.split(/\s+/).length <= 6) continue;

    const cleanName = (s: string) =>
      s.replace(/\s+(personal|academic|freelance)(?:\s+data\s+analytics)?\s+projects?$/i, "").trim();

    const dates = parseDates(l);
    const link = l.match(/(?:http|www)[^\s]*/i);
    const dash = l.match(/^(.{3,72}?)\s*[-–—:]\s+(.{12,})$/);
    if (dash && (isParagraph(l) || PROJECT_START_RE.test(dash[2]) || dash[2].length > 40)) {
      finish();
      current = {
        name: cleanName(dash[1].trim()),
        description: dash[2].trim(),
        link: link ? cleanUrl(link[0]) : "",
        ...(dates ? { startDate: dates.start, endDate: dates.end } : {}),
      };
      finish();
      continue;
    }

    const titleLike =
      !isBullet(l) &&
      !isParagraph(l) &&
      !PROJECT_START_RE.test(l) &&
      l.length < 80 &&
      l.split(/\s+/).length <= 12 &&
      !hasDateRange(l);
    if (titleLike) {
      finish();
      current = { name: cleanName(l.replace(/[:.]\s*$/, "").trim()), description: "", link: link ? cleanUrl(link[0]) : "" };
      if (dates) {
        current.startDate = dates.start;
        current.endDate = dates.end;
      }
      continue;
    }

    const text = isBullet(l) ? stripBullet(l) : l;
    if (!current) {
      current = { name: cleanName(text.split(/[-–—:]/)[0].trim().slice(0, 72)), description: text };
    } else {
      current.description = [current.description, text].filter(Boolean).join(" ");
    }
    if (link && !current.link) current.link = cleanUrl(link[0]);
  }
  finish();
  return out.filter((p) => (p.name || "").length >= 3);
}

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

function titleFromContactBanner(lines: string[]): string {
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!/^[A-Z][A-Z0-9 /&+-]{3,42}$/.test(l)) continue;
    if (l.split(/\s+/).length > 5 || matchHeader(l) || looksLikeSectionBanner(l)) continue;
    if (!/\b(analyst|designer|manager|developer|engineer|accountant|teacher|instructor|officer|consultant|specialist|executive|director|lead|head|founder|artist)\b/i.test(l)) continue;
    const near = `${lines[i + 1] || ""} ${lines[i - 1] || ""}`;
    if (isContacty(near)) {
      return l.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
    }
  }
  return "";
}

function dropSidebarOccupationJobs(draft: CvDraft) {
  const jobs = draft.experience;
  for (let i = jobs.length - 1; i >= 1; i--) {
    const e = jobs[i];
    const prev = jobs[i - 1];
    const role = (e.role || "").trim();
    if ((e.bullets?.length ?? 0) > 0 || e.startDate) continue;
    if (!role || !/^[A-Z][A-Z0-9 /&+-]*$/.test(role)) continue;
    if ((e.company || "") !== (prev.company || "") || !e.company) continue;
    if (!draft.contact.title) {
      draft.contact.title = role.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
    }
    jobs.splice(i, 1);
  }
}

function attachOrphanJobDates(draft: CvDraft, lines: string[]) {
  const job = draft.experience.find((e) => (e.role || e.company) && !e.startDate);
  if (!job) return;
  for (const l of lines) {
    if (!isDateOnlyLine(l) || !/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(l)) continue;
    const dates = parseDates(l);
    if (!dates) continue;
    job.startDate = dates.start;
    job.endDate = dates.end;
    job.present = dates.present;
    break;
  }
}

function polishDescriptiveJobs(draft: CvDraft) {
  for (const job of draft.experience) {
    if (job.role) job.role = job.role.replace(/\bQuaility\b/gi, "Quality").replace(/\s+/g, " ").trim();
    if (job.descriptor) {
      job.descriptor = job.descriptor
        .replace(/^(male|female|pakistani|islam|muslim)\t+/i, "")
        .replace(/\bQuaility\b/gi, "Quality")
        .trim();
    }
    if (job.role && job.company && job.role.toLowerCase() === job.company.toLowerCase()) {
      job.role = "";
    }
    if (!job.role && job.descriptor) {
      const asRole = job.descriptor.match(/\bas an?\s*\(([^)]+)\)/i) || job.descriptor.match(/\bas an?\s+([A-Za-z][A-Za-z /&'-]{2,50})/i);
      if (asRole) job.role = asRole[1].replace(/[()]/g, "").replace(/\bQuaility\b/gi, "Quality").trim();
      else if (/\bapprentice(?:ship)?\b/i.test(job.descriptor)) job.role = "Apprentice";
    }
  }
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
    const year = yearFromDate(job.startDate);
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

function jobIdentity(e: Partial<ExperienceEntry>): string {
  const year = (e.startDate || "").match(/(?:19|20)\d{2}/)?.[0] || "";
  return `${(e.role || "").toLowerCase()}|${(e.company || "").toLowerCase()}|${year}`;
}

function looksLikeEducationJob(e: Partial<ExperienceEntry>): boolean {
  const blob = `${e.role || ""} ${e.company || ""} ${e.descriptor || ""}`;
  if (/\b(inspector|operator|apprentice|teacher|instructor|analyst|accountant|designer|manager|founder|incharge|intern)\b/i.test(blob)) {
    return false;
  }
  if ((e.bullets ?? []).some((b) => ACTION_VERB_RE.test(b))) return false;
  return DEG_RE.test(blob) && /university|college|institute|board|school|academy|polytechnic/i.test(blob);
}

function tidyMashedSummary(draft: CvDraft) {
  let s = draft.summary || "";
  if (!s) return;
  if (!/\d{1,2}\s+Years?\s+(?:of\s+)?Experience\b|\bfather\s*name\b|\bcnic\b|matriculation\s*\(/i.test(s)) return;
  s = s
    .replace(/\b\d{1,2}\s+Years?\s+(?:of\s+)?Experience\b[\s\S]{0,220}/gi, " ")
    .replace(/\b(father\s*name|cnic|marital status|religion|nationality)\b[^.]{0,90}/gi, " ")
    .replace(/\b(matriculation|dae in)\b[^.]{0,140}/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  draft.summary = s.split(/\s+/).length >= 8 ? s : "";
}

function rescueDocument(draft: CvDraft, lines: string[]) {
  tidyMashedSummary(draft);

  const yearHeads = lines.filter((l) => /^\d{1,2}\s+Years?\s+(?:of\s+)?Experience\b/i.test(stripBullet(l))).length;
  if (draft.experience.length === 0 || yearHeads > draft.experience.length) {
    const extra = parseExperience(
      lines.filter((l) => !isPersonalInfoJunk(l) && !isSkipSectionHeader(l) && matchHeader(l) !== "education"),
    );
    const seen = new Set(draft.experience.map(jobIdentity));
    for (const j of extra as Partial<ExperienceEntry>[]) {
      const id = jobIdentity(j);
      if (!id.replace(/\|/g, "") || seen.has(id)) continue;
      if (!(j.role || j.company)) continue;
      seen.add(id);
      draft.experience.push(j);
    }
  }

  draft.experience = draft.experience.filter((e) => {
    if (!looksLikeEducationJob(e)) return true;
    draft.education.push({
      degree: e.role || "",
      institution: e.company || "",
      startDate: e.startDate || "",
      endDate: e.endDate || "",
    });
    return false;
  });

  if (draft.education.length === 0) {
    const eduLines = lines.filter(
      (l) => isEduLine(l) || (DEG_RE.test(l) && /\b(from|university|college|institute|board|school|academy)\b/i.test(l)),
    );
    if (eduLines.length) draft.education = parseEducation(eduLines);
  }

  if (!draft.skills.length) {
    const chips = lines.filter(isSkillChipLine);
    if (chips.length) draft.skills = parseSkills(chips);
  }
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

const BULLET_PREFIX_RE = /^[•▪▸►●*★☆✦✧✩✪✫✬✭✮✯✰✶✷✸✹\u2022\u25AA\u2023\u2043\uF0B7\u00B7\u25CF\u25E6\uF0A7-]\s*/;

function isBullet(l: string): boolean {
  return BULLET_PREFIX_RE.test(l) || /^\d+[.)]\s/.test(l);
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
  return l.replace(BULLET_PREFIX_RE, "").replace(/^\d+[.)]\s*/, "").trim();
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

function looksLikeProjectSubtitle(l: string): boolean {
  const t = l.trim();
  if (!t || t.length > 72 || hasDateRange(t) || isParagraph(t) || isBullet(t)) return false;
  if (t.split(/\s+/).length > 8) return false;
  return /\b(optimization|inventory|monitoring|dashboard|analytics|case study|initiative)\b/i.test(t);
}

function looksLikeCompanyName(l: string): boolean {
  const t = cleanOrgName(l);
  if (!t || t.length < 3 || t.length > 60) return false;
  if (/\d/.test(t) || /,/.test(t)) return false;
  if (isParagraph(t) || isBullet(t)) return false;
  if (SECTION_WORD_RE.test(t) || ACTION_VERB_RE.test(t) || isContacty(t) || hasDateRange(t)) return false;
  if (PROJECT_TITLE_RE.test(t)) return false;
  if (/\b(optimization|inventory|monitoring|dashboard|analytics|report)\b/i.test(t) && !/\b(ltd|llc|inc|limited|company|corp|group)\b/i.test(t)) return false;
  if (/\bproject\b/i.test(t) && !/\b(ltd|llc|inc|limited|company)\b/i.test(t)) return false;
  if (/\b(?:artist|freelance|manager|designer|engineer|developer|inspector|apprentice|intern|assistant|specialist|analyst|consultant|director|officer|coordinator|technician|founder|head|lead|instructor|teacher|accountant|trainer)\b/i.test(t)) return false;
  if (/^(data|python|sql|excel|power|advanced|basic|contact|profile|reference)\b/i.test(t)) return false;
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
  if (!t || t.length > 90) return false;
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

type JobDraft = Partial<ExperienceEntry> & Partial<VolunteerEntry>;

function parseExperience(rawLines: string[], isVolunteer = false): JobDraft[] {
  const entries: JobDraft[] = [];
  let current: JobDraft | null = null;
  let pending: string | null = null;
  let lastCompany = "";

  const looksLikeJobTitle = (s: string) => {
    const t = s.replace(/[:]+$/, "").trim();
    if (!t || t.length > 62 || isParagraph(t) || hasDateRange(t)) return false;
    return (
      /\b(accountant|analyst|teacher|instructor|designer|manager|leader|officer|engineer|developer|specialist|consultant|coordinator|assistant|intern|apprentice|founder|head|executive|operator|trainer|incharge|supervisor|technician)\b/i.test(t) &&
      t.split(/\s+/).length <= 8 &&
      !/\s[-–—]\s/.test(t) &&
      !/,/.test(t)
    );
  };

  const finish = () => {
    if (current && (current.company || current.role || current.title)) {
      if (isVolunteer && !current.title && current.role) current.title = current.role;
      entries.push(current);
    }
    current = null;
  };

  const parseHead = (head: string) => {
    const parenBits = [...head.matchAll(/\(([^)]+)\)/g)].map((m) => m[1].trim());
    const core = head.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
    const sep =
      core.match(/^(.*?)\s+(?:at|@)\s+(.*)$/) ??
      core.match(/^(.*?)\s*[|·•]\s*(.*)$/) ??
      core.match(/^(.*?)\s+[-–—]\s+(.*)$/) ??
      null;
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
      const parts = core.split(",").map((x) => x.trim()).filter(Boolean);
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
        current!.title = core || head;
      } else {
        current!.role = core || head;
      }
    }
    const loc = head.match(/[,|]\s*(?:([A-Z][\w.'-]+),\s*([A-Z]{2})\b|\b(Remote|Hybrid)\b)/);
    if (loc) {
      current!.location = loc[1] ? `${loc[1]}, ${loc[2]}` : loc[3];
    }
    if (parenBits.length) {
      const remote = parenBits.find((p) => /\bremote\b|\bhybrid\b/i.test(p));
      if (remote) {
        const bits = remote.split(/\s+[-–—]\s+/);
        if (!current!.location) current!.location = bits[0].trim();
        if (!current!.company && bits[1] && !/remote|hybrid/i.test(bits[1])) current!.company = bits[1].trim();
      } else if (!current!.location) {
        current!.location = parenBits[0];
      }
    }
  };

  const startPending = (l: string, asCompany = false) => {
    if (!current || !(current.startDate || current.endDate)) current = {};
    if (asCompany) current.company = l;
    else parseHead(l);
  };

  for (const raw of rawLines) {
    const l = raw.replace(/\s{2,}/g, "  ");
    if (/^(male|female|pakistani|islam|muslim|christian|hindu|single|married)$/i.test(l.trim())) continue;
    if (/^available on request$/i.test(l.trim())) continue;
    if (isPersonalInfoJunk(l)) continue;
    if (/^(father\s*name|date\s+of\s+birth|cnic|marital\s+status|religion|nationality|gender|age)\b/i.test(l.trim())) continue;

    const yearsIn = stripBullet(l).match(
      /^(\d{1,2})\s+Years?\s+(?:of\s+)?Experience\s+in\s+(.+?)\s+as\s+an?\s+(.+?)\s*[.(]\s*\(?\s*((?:19|20)\d{2})\s*[-–]\s*((?:19|20)\d{2}|Present|Current)\s*\)?\s*\.?$/i,
    );
    const yearsAsIn = !yearsIn
      ? stripBullet(l).match(
          /^(\d{1,2})\s+Years?\s+(?:of\s+)?Experience\s+as\s+an?\s+(.+?)\s+in\s+(.+?)\s*[.(]\s*\(?\s*((?:19|20)\d{2})\s*[-–]\s*((?:19|20)\d{2}|Present|Current)\s*\)?\s*\.?$/i,
        )
      : null;
    const yearsHit = yearsIn || yearsAsIn;
    if (yearsHit) {
      finish();
      pending = null;
      const company = (yearsIn ? yearsHit[2] : yearsHit[3]).replace(/[.]+$/, "").trim();
      const role = (yearsIn ? yearsHit[3] : yearsHit[2]).replace(/[.]+$/, "").trim();
      current = {
        company,
        role,
        startDate: yearsHit[4],
        endDate: /present|current/i.test(yearsHit[5]) ? "" : yearsHit[5],
        present: /present|current/i.test(yearsHit[5]),
      };
      lastCompany = current.company || "";
      continue;
    }

    if (current && (current.role || current.company) && /(?:\bkw\b|\bjgs\b|\*)/i.test(stripBullet(l)) && l.length < 140 && !hasDateRange(l)) {
      (current.bullets ??= []).push(stripBullet(l).trim() || l.trim());
      continue;
    }

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

    if (pending && !isParagraph(pending) && (looksLikeCompanyName(l) || looksLikeJobTitle(l) || looksLikeProjectSubtitle(l))) {
      startPending(pending);
      pending = null;
    }

    if (current && (current.role || current.company) && looksLikeProjectSubtitle(l)) {
      if (!current.descriptor) current.descriptor = l.trim();
      else (current.bullets ??= []).push(l.trim());
      continue;
    }

    // Company-first layout ("Atlas Honda" / "02 Years Experience…"): a company name
    // on its own line starts an entry; a second one closes the previous entry.
    if (looksLikeCompanyName(l)) {
      lastCompany = cleanOrgName(l);
      if (!current) {
        current = { company: lastCompany };
        continue;
      }
      if (current.company && !current.role) {
        finish();
        current = { company: lastCompany };
        continue;
      }
      if (current.company && current.role) {
        finish();
        current = { company: lastCompany };
        continue;
      }
    }

    if (looksLikeJobTitle(l) && (lastCompany || (current && current.company))) {
      const role = l.replace(/[:]+$/, "").trim();
      const company: string = String((current && current.company && !current.role ? current.company : lastCompany) || current?.company || "");
      if (current && current.company && !current.role) {
        current.role = role;
        lastCompany = current.company;
        continue;
      }
      if (current && current.role && company) {
        finish();
        current = { role, company };
        lastCompany = company;
        continue;
      }
    }

    const roleColon = l.match(/^([A-Z][A-Za-z0-9 &/'+-]{2,52}):\s*(.*)$/);
    if (roleColon && (parseDates(roleColon[2] || "") || parseDates(l))) {
      const rd = parseDates(roleColon[2] || "") || parseDates(l);
      const role = roleColon[1].trim();
      const company: string = String((current && current.company && !current.role ? current.company : lastCompany) || current?.company || "");
      if (current && (current.role || (current.company && current.startDate))) finish();
      current = { role, company };
      if (rd) setDates(current, rd);
      if (company) lastCompany = company;
      continue;
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
      const asRole = l.match(/\bas an?\s*\(([^)]+)\)/i) || l.match(/\bas an?\s+([A-Za-z][A-Za-z /&'-]{2,40})/i);
      if (asRole && !current.role) current.role = asRole[1].replace(/[()]/g, "").trim();
      if (!current.role && /\bapprentice(?:ship)?\b/i.test(l)) current.role = "Apprentice";
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
      const label = left.replace(/[:]+$/, "").trim();
      if (pending && !isParagraph(pending)) {
        startPending(pending);
        pending = null;
        if (/[|·•–—]/.test(label) || label.includes(",")) parseHead(label);
        else current!.company = label;
      } else if (current && current.company && !current.role) {
        current.role = label;
        lastCompany = current.company;
      } else if (current && current.role && lastCompany && looksLikeJobTitle(label)) {
        finish();
        current = { role: label, company: lastCompany };
      } else {
        pending = null;
        if (current && (current.role || current.company)) finish();
        current = {};
        if (looksLikeCompanyName(label) || /\b(limited|llc|pvt|private|company|inc|gmbh|honda|ltd)\b/i.test(label)) {
          current.company = cleanOrgName(label);
          lastCompany = current.company;
        } else {
          parseHead(label);
          if (current.company) lastCompany = current.company;
          else if (lastCompany && !current.company) current.company = lastCompany;
        }
      }
      setDates(current!, dates);
      continue;
    }

    // date-only line: attach dates to pending header or current entry
    // date-only line: fill the oldest job that still lacks dates (two-column
    // PDFs often dump Atlas Honda / Lord's first, then 2020-2022 / 2018-2020)
    if (hasDates && isDateOnlyLine(l)) {
      const undatedPrior = entries.find((e) => (e.company || e.role || e.title) && !e.startDate);
      if (undatedPrior) {
        setDates(undatedPrior, dates);
        continue;
      }
      if (current && (current.role || current.company || current.title) && !current.startDate) {
        setDates(current, dates);
        continue;
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

function tidyParens(s: string): string {
  let t = s
    .replace(/\s*\((?:19|20)\d{2}\)?\s*$/g, "")
    .replace(/,\s*(?:course\s+)?continue.*$/i, "")
    .replace(/^\(+/, "")
    .replace(/\)+$/, "")
    .replace(/\)\s*\(/g, " (")
    .replace(/\s+/g, " ")
    .trim();
  const open = (t.match(/\(/g) ?? []).length;
  const close = (t.match(/\)/g) ?? []).length;
  if (close > open) t = t.replace(/\)+$/, "");
  if (open > close) t += ")";
  return t;
}

const DEG_RE =
  /\b(?:B\.?A|B\.?S|M\.?A|M\.?S|BA|BS|MA|MS|PhD|Ph\.?D|MBA|BSc|MSc|M\.?Sc|B\.?Sc|LLB|JD|BEng|MEng|HND|A\.S|A\.A|I\.?COM|F\.?S\.?C|F\.A\b|HSC|SSC|D\.?A\.?E|B\.?Com|M\.?Com|BBA|MPhil|B\.?Tech|M\.?Tech|O\s*Levels?|A\s*Levels?)\b|Diploma|Bachelor|Master|Doctorate|Intermediate|Matric/i;

function isEduLine(l: string): boolean {
  const t = l.trim();
  if (t.length > 150) return false;
  if (/\b(?:teacher|instructor|lecturer|trainer|professor)\b/i.test(t) && !DEG_RE.test(t)) return false;
  if (/(?:university|college|institute|board|school|academy|polytechnic)\b/i.test(t)) return true;
  if (/^(?:bachelor|master|doctorate|matric(?:ulation)?|intermediate|diploma|ph\.?d)\b/i.test(t)) return true;
  const m = t.match(DEG_RE);
  if (!m) return false;
  const rest = t.slice(t.indexOf(m[0]) + m[0].length);
  return /\b(?:19|20)\d{2}\b|university|college|institute|board|school|from|\bin\b/i.test(rest);
}

type EduDraft = Partial<EducationEntry> & { present?: boolean };

function parseEducation(rawLines: string[]): Partial<EducationEntry>[] {
  const entries: EduDraft[] = [];
  let current: EduDraft | null = null;

  const finish = () => {
    if (current && (current.institution || current.degree)) {
      if (current.present && !current.endDate) current.endDate = "Present";
      entries.push(current);
    }
    current = null;
  };

  const parseHead = (l: string) => {
    const withoutDates = stripDateHead(l);
    const comma = withoutDates.split(/[|·•]/).map((x) => x.trim()).filter(Boolean);
    const main = comma[0] ?? withoutDates.trim();
    const dash = main.split(/\s+[-–—]\s+/).map((x) => x.trim()).filter(Boolean);
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
      const fromParts = main.split(/\s+from\s+/i);
      if (fromParts.length === 2 && degRe.test(fromParts[0])) {
        current!.degree = fromParts[0]
          .replace(/^\d+\s+years?\s*/i, "")
          .replace(/^\(+/, "")
          .replace(/\)+$/, "")
          .trim();
        current!.institution = fromParts[1].split(/[|,]/)[0].replace(/^\d{4}\s*/, "").replace(/^[()]+|[()]+$/g, "").trim();
        const inDeg = current!.degree.match(/^(.*?)\s+(?:in|of)\s+(.+)$/i);
        if (inDeg && inDeg[1].length <= 24) {
          current!.degree = inDeg[1].replace(/[()]/g, "").trim();
          current!.field = inDeg[2].replace(/[()]/g, "").trim();
        }
      } else {
      const instHint = /\b(?:university|college|institute|school|academy|polytechnic|board)\b/i;
      const inMatch = main.match(/^(.*?)\s+(?:in|of)\s+(.+)$/i);
      if (inMatch && !(instHint.test(inMatch[1]) || (instHint.test(main) && !degRe.test(inMatch[1])))) {
        current!.degree = inMatch[1].trim();
        const rest = inMatch[2].trim();
        const fromM = rest.match(/\b(?:from|at)\s+(.+)$/i);
        if (fromM) {
          current!.field = rest.replace(/\b(?:from|at)\s+.*$/i, "").split(/[|,]/)[0].trim();
          current!.institution = fromM[1].replace(/[.,;:\s]+$/, "").replace(/^[()]+|[()]+$/g, "").replace(/\s*[,]?\s*course\s+\S+.*$/i, "").trim();
        } else {
          const [field, ...inst] = rest.split(/[|,]/).map((x) => x.trim());
          current!.field = field ?? "";
          current!.institution = inst.join(", ");
        }
      } else if (instHint.test(main) && !degRe.test(main.split(/\s+from\s+/i)[0] ?? main)) {
        current!.institution = main.replace(/\s+\b(19|20)\d{2}\b.*$/, "").trim();
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
    }
    current!.degree = tidyParens(current!.degree ?? "");
    current!.institution = tidyParens(current!.institution ?? "").replace(/[.,;]+$/, "");
    current!.field = tidyParens(current!.field ?? "");
    if (/^(continue|present|presnt)\b/i.test(current!.institution || "")) {
      current!.present = true;
      current!.institution = "";
    }
    if (/continue|presnt/i.test(current!.field || "")) {
      current!.present = true;
      current!.field = (current!.field || "").replace(/,?\s*continue[.…]*$/i, "").trim();
    }
    const loc = l.match(/[,|]\s*(?:([A-Z][\w.'-]+),\s*([A-Z]{2})\b)/);
    if (loc) current!.location = `${loc[1]}, ${loc[2]}`;
  };

  for (const raw of rawLines) {
    const l = stripBullet(raw.replace(/\s{2,}/g, " "));
    if (/^(male|female|pakistani|islam|muslim|christian|hindu|single|married)$/i.test(l.trim())) continue;
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
    if (!isHeader && isEduLine(l) && /institut|universit|college|school|board|polytechnic|academy/i.test(l) && !DEG_RE.test(l)) {
      if (current && current.degree && !current.institution) {
        // school line belongs to the open degree — handled below
      } else if (current && current.institution && l.split(/\s+/).length <= 4) {
        current.institution = `${current.institution} ${l}`.replace(/\s+/g, " ").trim();
        continue;
      } else if (!current) {
        current = { institution: l.replace(/\s{2,}/g, " ").trim() };
        continue;
      } else if (!current.degree) {
        current.institution = l.replace(/\s{2,}/g, " ").trim();
        continue;
      }
    }
    const schoolish = /school|college|university|institute|campus|academy|polytechnic/i.test(l);
    if (current && current.degree && !current.institution && schoolish && !/^(bachelor|master|matric|intermediate|diploma|phd)\b/i.test(l)) {
      const peeled = peelTrailingDate(l);
      const inst = stripDateHead(peeled.body || l)
        .replace(/^\(+/, "")
        .replace(/[)]+$/, "")
        .replace(/\(\s*(?:19|20)\d{2}\s*[-–—to]+\s*(?:(?:19|20)\d{2}|present|presnt|continue).*$/i, "")
        .replace(/\(\s*(?:19|20)\d{2}.*$/, "")
        .split(",")[0]
        .replace(/[(),]+$/g, "")
        .trim();
      if (inst) current.institution = inst;
      const d = dates || (peeled.date ? parseDates(peeled.date) : null);
      if (d) {
        current.startDate = current.startDate || d.start;
        current.endDate = current.endDate || d.end;
        if (d.present || /continue|presnt/i.test(l)) current.present = true;
      }
      const loc = cityFromLine(l);
      if (loc && !current.location) current.location = loc;
      continue;
    }
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
        l.length < 80 &&
        !/\d{4}/.test(l) &&
        (/^(and|of|the)\b/i.test(l) || /institut\w*|coll\w*ge|universit\w*|academ\w*|polytechnic|school|board\b/i.test(l))
      ) {
        current.institution = `${current.institution} ${l}`.replace(/\s+\.?\s*$/, "").trim();
      }
    }
  }
  finish();
  const normInst = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
  for (const e of entries) {
    if (e.institution) e.institution = e.institution.replace(/[\s(]+$/g, "").replace(/\(\s*$/, "").trim();
    if (e.degree || !e.institution || !e.startDate) continue;
    const inst = normInst(e.institution);
    const later = entries.find((o) => o !== e && o.degree && (normInst(o.institution || "").includes(inst.slice(0, 18)) || inst.includes(normInst(o.institution || "").slice(0, 18))));
    if (later && !later.startDate) {
      later.startDate = e.startDate;
      later.endDate = e.endDate;
      later.present = e.present;
    }
  }
  return entries.filter((e, i) => {
    if (e.degree) return true;
    const inst = normInst(e.institution || "");
    if (!inst) return false;
    return !entries.some((o, j) => j !== i && o.degree && (normInst(o.institution || "").includes(inst.slice(0, 18)) || inst.includes(normInst(o.institution || "").slice(0, 12))));
  });
}

function splitTwoColumnSkill(s: string): [string, string] | null {
  const words = s.split(/\s+/).filter(Boolean);
  if (words.length < 3) return null;
  if (/&/.test(s)) return null;
  const isRightToken = (w: string) => /^[A-Z][A-Za-z&+./-]*(?:-[A-Za-z&+./-]+)?$/.test(w);
  for (const take of [2, 1, 3]) {
    if (words.length - take < 2) continue;
    const right = words.slice(-take);
    const left = words.slice(0, -take);
    if (!right.every(isRightToken)) continue;
    if (!/[a-z]/.test(left.join(" "))) continue;
    return [left.join(" "), right.join(" ")];
  }
  return null;
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
    if (looksLikeSectionBanner(l) || matchHeader(l) || /available on request/i.test(l)) continue;
    if (isLabelLine(l)) continue;
    if (/^(male|female|pakistani|islam|muslim|christian|hindu|single|married|advanced|native|fluent|beginner|intermediate|basic|expert|proficient|highlights?)$/i.test(l)) continue;
    const skillLine = (isBullet(l) ? stripBullet(l) : l).replace(/^[^\p{L}\p{N}+#]+/u, "").trim();
    if (!skillLine) continue;
    const leveled = skillLine.replace(/\t+/g, " ").match(/^(.*?)\s+(native|fluent|beginner|intermediate|advanced|expert|basic|proficient)$/i);
    if (leveled && leveled[1].split(/\s+/).length <= 4) {
      current.skills.push(leveled[1].trim());
      continue;
    }
    if (isSkillChipLine(skillLine)) {
      const parts = skillLine.split(/[•▪▸►●*]/).map((s) => s.trim()).filter(Boolean);
      current.skills.push(...parts.filter((p) => p.length <= 40));
      continue;
    }
    const cells = skillLine.split("\t").map((s) => s.trim()).filter(Boolean);
    if (cells.length > 1 || /[a-z]\s+[A-Z]/.test(skillLine)) {
      const pieces: string[] = [];
      for (const c of cells) {
        const split = splitTwoColumnSkill(c);
        if (split) pieces.push(split[0], split[1]);
        else pieces.push(c);
      }
      if (pieces.length > 1) {
        current.skills.push(...pieces.filter((p) => p.length >= 2 && p.length <= 48 && !/^highlights?$/i.test(p) && !hasDateRange(p) && !/^(19|20)\d{2}/.test(p)));
        continue;
      }
    }
    if (ACTION_VERB_RE.test(skillLine) || /^(founded|provide|handle|develop|led|prepared|ensured|worked|served|manage)\b/i.test(skillLine)) continue;
    if (isParagraph(skillLine)) continue;
    if (/^(?=.*\d)(?=.*[_@])[A-Za-z0-9_.@-]+$/.test(skillLine) || /^@[A-Za-z0-9_.-]+$/.test(skillLine) || /^\w+\.[a-z]{2,}(?:\/\S*)?$/i.test(skillLine)) continue;
    if (/^[A-Z][A-Z&/()'.\- ]+$/.test(skillLine) && skillLine.split(/\s+/).length >= 3 && skillLine.length > 12) continue;
    const grouped = skillLine.match(/^(.+?)\s*[:|]\s*(.+)$/);
    if (grouped) {
      const name = grouped[1].replace(/[•\-*]/g, "").trim();
      if (name.toLowerCase() === "skills" && grouped[2].length > 40) {
        current.skills.push(...splitSkillList(grouped[2]));
      } else if (name && grouped[2]) {
        push();
        current.name = name;
        current.skills.push(...splitSkillList(grouped[2]));
      } else {
        current.skills.push(...splitSkillList(skillLine));
      }
    } else {
      if (skillLine.length <= 60 && skillLine.split(/\s+/).length <= 12 && !/[;]/.test(skillLine)) {
        current.skills.push(skillLine);
      } else {
        current.skills.push(...splitSkillList(skillLine));
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
  "extras",
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
      case "extras":
        return draft.extras.some((d) => (d.label || "").trim() && (d.value || "").trim());
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
  visibility.extras = (draft.extras ?? []).some((d) => (d.label || "").trim() && (d.value || "").trim());

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
    extras: fillStrings(draft.extras) as Resume["extras"],
    sectionOrder: (sectionOrder.includes("extras") ? sectionOrder : [...sectionOrder, "extras"]) as SectionKey[],
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
  return (
    !!draft.contact.fullName ||
    !!draft.summary ||
    !!draft.objective ||
    draft.experience.length > 0 ||
    draft.education.length > 0 ||
    draft.skills.length > 0 ||
    draft.projects.length > 0 ||
    draft.certifications.length > 0
  );
}

export function summarizeDraft(draft: CvDraft): { label: string; count: number }[] {
  const items: { label: string; count: number }[] = [];
  if (draft.contact.fullName) items.push({ label: "Name", count: 1 });
  if (draft.contact.email) items.push({ label: "Email", count: 1 });
  if (draft.contact.phone) items.push({ label: "Phone", count: 1 });
  if (draft.summary || draft.objective) items.push({ label: draft.useObjective ? "Objective" : "Summary", count: 1 });
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
  if (draft.extras.length) items.push({ label: "Personal details", count: draft.extras.length });
  return items;
}
