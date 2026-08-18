export type ID = string;

export type ResumeTypeKey =
  | "chronological"
  | "functional"
  | "combination"
  | "cv"
  | "executive"
  | "entry-level"
  | "creative";

export type TemplateKey =
  | "classic"
  | "modern-minimal"
  | "two-column"
  | "executive"
  | "creative"
  | "academic-cv"
  | "skills-based"
  | "entry-level"
  | "tech"
  | "portfolio"
  | "photo-sidebar"
  | "dark-modern"
  | "bold-diagonal"
  | "tech-dark"
  | "compact"
  | "photo-header"
  | "classic-serif"
  | "creative-border"
  | "colored-sidebar"
  | "manifest"
  | "blueprint"
  | "broadside"
  | "ribbon-navy"
  | "sage-overlap"
  | "circuit-dark"
  | "terra-wave"
  | "stadium-banner"
  | "polaroid-burst"
  | "forest-geo"
  | "gold-cut"
  | "gilt"
  | "bevel"
  | "mast"
  | "carmine"
  | "blush"
  | "reel"
  | "lagoon"
  | "stream"
  | "grove"
  | "boardroom";

export type Density = "compact" | "comfortable";
export type PageSize = "a4" | "letter";
export type CitationFormat = "apa" | "mla" | "chicago";

export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
export type FluencyLevel = "Native" | "Fluent" | "Professional" | "Conversational";

export interface Contact {
  fullName: string;
  title: string;
  phone: string;
  email: string;
  city: string;
  country: string;
  linkedin: string;
  website: string;
  github: string;
  portfolioUrl: string;
  photoUrl: string;
}

export interface ExperienceEntry {
  id: ID;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  present: boolean;
  descriptor: string;
  bullets: string[];
}

export interface EducationEntry {
  id: ID;
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa: string;
  honors: string;
  coursework: string;
  thesis: string;
}

export interface SkillGroup {
  id: ID;
  name: string;
  skills: string[];
}

export interface ProjectEntry {
  id: ID;
  name: string;
  description: string;
  tech: string;
  link: string;
}

export interface CertificationEntry {
  id: ID;
  name: string;
  issuer: string;
  year: string;
  expires: string;
}

export interface LanguageEntry {
  id: ID;
  name: string;
  level: FluencyLevel;
}

export interface VolunteerEntry {
  id: ID;
  title: string;
  org: string;
  location: string;
  startDate: string;
  endDate: string;
  present: boolean;
  bullets: string[];
}

export interface PublicationEntry {
  id: ID;
  title: string;
  venue: string;
  year: string;
  authors: string;
  url: string;
}

export interface AwardEntry {
  id: ID;
  title: string;
  org: string;
  year: string;
}

export interface TeachingEntry {
  id: ID;
  role: string;
  institution: string;
  course: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface GrantEntry {
  id: ID;
  name: string;
  funder: string;
  amount: string;
  year: string;
  description: string;
}

export interface PresentationEntry {
  id: ID;
  title: string;
  event: string;
  year: string;
  location: string;
}

export interface AffiliationEntry {
  id: ID;
  name: string;
  role: string;
  years: string;
}

export interface ReferenceEntry {
  id: ID;
  name: string;
  title: string;
  org: string;
  email: string;
  phone: string;
}

export interface CustomDetail {
  id: ID;
  label: string;
  value: string;
}

export type SectionKey =
  | "contact"
  | "summary"
  | "objective"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "languages"
  | "volunteer"
  | "publications"
  | "awards"
  | "teaching"
  | "grants"
  | "presentations"
  | "affiliations"
  | "references"
  | "portfolio"
  | "extras";

export type VisibilityKey = Exclude<SectionKey, "contact">;

export type SectionVisibility = Record<VisibilityKey, boolean>;

export interface ThemeConfig {
  template: TemplateKey;
  accent: string;
  fontPair: string;
  density: Density;
  atsSafe: boolean;
  pageSize: PageSize;
  maxPages: 1 | 2;
  margins: PageMargins;
  citationFormat: CitationFormat;
}

export interface Resume {
  meta: {
    id: ID;
    name: string;
    type: ResumeTypeKey;
    industry?: string;
    createdAt: string;
    updatedAt: string;
  };
  target: {
    jobDescription: string;
    enabled: boolean;
  };
  contact: Contact;
  summary: string;
  objective: string;
  useObjective: boolean;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillGroup[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
  languages: LanguageEntry[];
  volunteer: VolunteerEntry[];
  publications: PublicationEntry[];
  awards: AwardEntry[];
  teaching: TeachingEntry[];
  grants: GrantEntry[];
  presentations: PresentationEntry[];
  affiliations: AffiliationEntry[];
  references: ReferenceEntry[];
  extras: CustomDetail[];
  sectionOrder: SectionKey[];
  visibility: SectionVisibility;
  theme: ThemeConfig;
}

export type ListSectionKey =
  | "experience"
  | "education"
  | "projects"
  | "certifications"
  | "languages"
  | "volunteer"
  | "publications"
  | "awards"
  | "teaching"
  | "grants"
  | "presentations"
  | "affiliations"
  | "references"
  | "extras";

export interface FieldDef<T extends SectionKey> {
  key: T;
  label: string;
  visible: boolean;
}
