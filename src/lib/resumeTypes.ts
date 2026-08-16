import type { ResumeTypeKey, SectionKey, VisibilityKey } from "./types";

export interface ResumeTypeDef {
  key: ResumeTypeKey;
  label: string;
  tagline: string;
  description: string;
  bestFor: string;
  structure: string[];
  recommendedTemplates: string[];
  summaryMode: "summary" | "objective";
  maxPages: 1 | 2;
  emphasizedSections: SectionKey[];
  verbCategories: string[];
  suggestedGroups: string[];
}

const VIS = (keys: VisibilityKey[]) =>
  Object.fromEntries(
    (
      [
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
      ] as VisibilityKey[]
    ).map((k) => [k, keys.includes(k)]),
  ) as Record<VisibilityKey, boolean>;

export const RESUME_TYPES: ResumeTypeDef[] = [
  {
    key: "combination",
    label: "Combination / Hybrid",
    tagline: "Best all-rounder",
    description:
      "Key skills up front, full experience with achievement bullets below. Recommended for most professionals with 3+ years of experience.",
    bestFor: "Experienced professionals switching specialization within their field",
    structure: ["Contact", "Summary", "Key Skills", "Work Experience", "Education"],
    recommendedTemplates: ["classic", "modern-minimal", "two-column"],
    summaryMode: "summary",
    maxPages: 1,
    emphasizedSections: ["summary", "skills", "experience"],
    verbCategories: ["leadership", "achievement", "improvement"],
    suggestedGroups: ["Technical Skills", "Soft Skills"],
  },
  {
    key: "chronological",
    label: "Chronological",
    tagline: "ATS-safest",
    description:
      "The classic reverse-chronological format recruiters and ATS parsers expect. Steady history, every job listed most recent first.",
    bestFor: "Candidates with steady, relevant work history and no major gaps",
    structure: ["Contact", "Summary", "Work Experience", "Education", "Skills"],
    recommendedTemplates: ["classic", "modern-minimal", "executive"],
    summaryMode: "summary",
    maxPages: 1,
    emphasizedSections: ["experience"],
    verbCategories: ["achievement", "improvement", "leadership"],
    suggestedGroups: ["Technical Skills", "Soft Skills"],
  },
  {
    key: "functional",
    label: "Functional / Skills-Based",
    tagline: "Hides gaps, shows strengths",
    description:
      "Leads with grouped core skills and selected achievements, then a brief work history with titles and dates only. Every skill claim still needs proof.",
    bestFor: "Career changers, employment gaps, re-entering the workforce, recent grads",
    structure: ["Contact", "Summary", "Core Skills", "Selected Achievements", "Work History", "Education"],
    recommendedTemplates: ["skills-based", "modern-minimal", "two-column"],
    summaryMode: "objective",
    maxPages: 1,
    emphasizedSections: ["skills", "projects"],
    verbCategories: ["achievement", "analysis", "improvement"],
    suggestedGroups: ["Core Competencies", "Tools & Platforms"],
  },
  {
    key: "executive",
    label: "Executive",
    tagline: "Leadership & scale",
    description:
      "Leadership-framed summary, core competencies, and experience built around P&L, team size, and strategic outcomes. May run to 2 pages.",
    bestFor: "C-suite, VP, and Director-level candidates",
    structure: ["Contact", "Executive Summary", "Core Competencies", "Professional Experience", "Board Roles", "Education", "Awards"],
    recommendedTemplates: ["executive", "two-column", "classic"],
    summaryMode: "summary",
    maxPages: 2,
    emphasizedSections: ["summary", "experience", "awards"],
    verbCategories: ["leadership", "achievement", "communication"],
    suggestedGroups: ["Executive Leadership", "Strategic Competencies"],
  },
  {
    key: "entry-level",
    label: "Entry-Level / Graduate",
    tagline: "No experience? No problem",
    description:
      "Education moves near the top, and projects, internships, coursework, and leadership roles count as real experience with the same bullet structure.",
    bestFor: "Students, new graduates, and first-job seekers",
    structure: ["Contact", "Objective", "Education", "Projects / Internships", "Skills", "Extracurriculars"],
    recommendedTemplates: ["entry-level", "modern-minimal", "portfolio"],
    summaryMode: "objective",
    maxPages: 1,
    emphasizedSections: ["education", "projects", "volunteer"],
    verbCategories: ["creation", "analysis", "leadership"],
    suggestedGroups: ["Coursework", "Tools", "Soft Skills"],
  },
  {
    key: "creative",
    label: "Creative / Portfolio",
    tagline: "Design-forward, still readable",
    description:
      "Bolder visual treatment with a prominent portfolio / work-samples section near the top. Clean enough for ATS in export.",
    bestFor: "Designers, writers, marketers, developers with public work",
    structure: ["Contact", "Portfolio Links", "Summary", "Skills", "Experience", "Projects"],
    recommendedTemplates: ["creative", "portfolio", "modern-minimal"],
    summaryMode: "summary",
    maxPages: 1,
    emphasizedSections: ["portfolio", "projects", "skills"],
    verbCategories: ["creation", "communication", "leadership"],
    suggestedGroups: ["Design Tools", "Platforms", "Craft"],
  },
  {
    key: "cv",
    label: "Curriculum Vitae (Academic)",
    tagline: "Comprehensive, multi-page",
    description:
      "Research summary, detailed education with thesis titles, publications, research and teaching experience, grants, presentations, awards, affiliations, and references. Length is not capped.",
    bestFor: "Academia, research, medical/clinical roles, fellowships, PhD applicants",
    structure: ["Contact", "Research Summary", "Education", "Publications", "Research Experience", "Teaching Experience", "Grants", "Presentations", "Awards", "Affiliations", "Skills", "References"],
    recommendedTemplates: ["academic-cv", "classic"],
    summaryMode: "summary",
    maxPages: 2,
    emphasizedSections: ["publications", "teaching", "grants", "presentations", "awards", "affiliations", "references", "education"],
    verbCategories: ["research", "communication", "leadership"],
    suggestedGroups: ["Technical Competencies", "Languages"],
  },
];

export function getResumeType(key: ResumeTypeKey): ResumeTypeDef {
  return RESUME_TYPES.find((t) => t.key === key) ?? RESUME_TYPES[0];
}

export function defaultVisibility(type: ResumeTypeKey): Record<VisibilityKey, boolean> {
  const base = VIS([
    "summary",
    "objective",
    "experience",
    "education",
    "skills",
    "projects",
    "certifications",
    "languages",
  ]);
  if (type === "cv") {
    return VIS([
      "summary",
      "education",
      "publications",
      "teaching",
      "grants",
      "presentations",
      "awards",
      "affiliations",
      "skills",
      "references",
    ]);
  }
  if (type === "entry-level") {
    return VIS(["objective", "education", "projects", "skills", "certifications", "languages", "volunteer", "awards"]);
  }
  if (type === "creative") {
    return VIS(["summary", "skills", "experience", "projects", "portfolio", "certifications", "languages"]);
  }
  if (type === "functional") {
    return VIS(["summary", "skills", "projects", "experience", "education", "certifications", "languages", "volunteer"]);
  }
  if (type === "executive") {
    return VIS(["summary", "skills", "experience", "education", "awards", "certifications", "languages", "portfolio"]);
  }
  return base;
}

export function defaultSectionOrder(type: ResumeTypeKey): SectionKey[] {
  const def = getResumeType(type);
  const withExtras = (order: SectionKey[]): SectionKey[] => (order.includes("extras") ? order : [...order, "extras"]);
  const order: SectionKey[] = ["summary", "experience", "education", "skills", "projects", "certifications", "languages"];
  if (def.summaryMode === "objective") order[0] = "objective";
  switch (type) {
    case "cv":
      return withExtras(["summary", "education", "publications", "teaching", "grants", "presentations", "awards", "affiliations", "skills", "references"]);
    case "entry-level":
      return withExtras(["objective", "education", "projects", "skills", "certifications", "languages", "volunteer", "awards"]);
    case "creative":
      return withExtras(["summary", "portfolio", "skills", "experience", "projects", "certifications", "languages"]);
    case "functional":
      return withExtras(["summary", "skills", "projects", "experience", "education", "certifications", "languages", "volunteer"]);
    case "executive":
      return withExtras(["summary", "skills", "experience", "awards", "education", "certifications", "languages", "portfolio"]);
    default:
      return withExtras(order);
  }
}

export const INDUSTRY_PRESETS = [
  { key: "tech", label: "Tech / Software" },
  { key: "sales", label: "Sales / Business Development" },
  { key: "marketing", label: "Marketing" },
  { key: "finance", label: "Finance / Accounting" },
  { key: "healthcare", label: "Healthcare / Medical" },
  { key: "education", label: "Education / Teaching" },
  { key: "trades", label: "Skilled Trades" },
  { key: "service", label: "Customer Service / Ops" },
  { key: "legal", label: "Legal" },
  { key: "nonprofit", label: "Non-Profit / NGO" },
] as const;

export type IndustryKey = (typeof INDUSTRY_PRESETS)[number]["key"];

// Sections an industry preset surfaces by default (laid over the type's defaults).
export const INDUSTRY_SECTIONS: Record<IndustryKey, VisibilityKey[]> = {
  tech: ["projects", "certifications"],
  sales: ["awards", "languages"],
  marketing: ["projects", "certifications", "languages"],
  finance: ["certifications", "languages"],
  healthcare: ["certifications", "awards"],
  education: ["publications", "awards", "teaching"],
  trades: ["certifications", "awards"],
  service: ["languages", "awards"],
  legal: ["affiliations", "publications"],
  nonprofit: ["volunteer", "grants", "languages"],
};
