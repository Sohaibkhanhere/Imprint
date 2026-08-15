import type { ComponentType } from "react";
import type { Resume, TemplateKey } from "../lib/types";
import { ClassicTemplate } from "./classic";
import { ModernMinimalTemplate } from "./modern-minimal";
import { TwoColumnTemplate } from "./two-column";
import { ExecutiveTemplate } from "./executive";
import { CreativeTemplate } from "./creative";
import { AcademicCvTemplate } from "./academic-cv";
import { SkillsBasedTemplate } from "./skills-based";
import { EntryLevelTemplate } from "./entry-level";
import { TechTemplate } from "./tech";
import { PortfolioTemplate } from "./portfolio";
import { PhotoSidebarTemplate } from "./photo-sidebar";
import { DarkModernTemplate } from "./dark-modern";
import { BoldDiagonalTemplate } from "./bold-diagonal";
import { TechDarkTemplate } from "./tech-dark";
import { CompactTemplate } from "./compact";
import { PhotoHeaderTemplate } from "./photo-header";
import { ClassicSerifTemplate } from "./classic-serif";
import { CreativeBorderTemplate } from "./creative-border";
import { ColoredSidebarTemplate } from "./colored-sidebar";
import { ManifestTemplate } from "./manifest";
import { BlueprintTemplate } from "./blueprint";
import { BroadsideTemplate } from "./broadside";
import {
  RibbonNavyTemplate,
  SageOverlapTemplate,
  CircuitDarkTemplate,
  TerraWaveTemplate,
  StadiumBannerTemplate,
  PolaroidBurstTemplate,
  ForestGeoTemplate,
  GoldCutTemplate,
} from "./graphical-pack";
import {
  PlinthTemplate,
  InkwellTemplate,
} from "./studio-pack";
import {
  GiltTemplate,
  BevelTemplate,
  MastTemplate,
  CarmineTemplate,
  BlushTemplate,
  ReelTemplate,
  LagoonTemplate,
  StreamTemplate,
  GroveTemplate,
  BoardroomTemplate,
} from "./html-pack";

export interface TemplateDef {
  key: TemplateKey;
  label: string;
  description: string;
  suitFor: string[];
  atsSafeVariant: boolean;
  photo: boolean;
  dark: boolean;
  component: ComponentType<{ resume: Resume }>;
}

export type FinishFilter = "all" | "ats" | "visual" | "photo" | "dark";
export type RoleFilter = "all" | "Executive" | "Creative" | "Tech" | "CV" | "Entry-level" | "Portfolio";

export const FINISH_FILTERS: { id: FinishFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "ats", label: "ATS safe" },
  { id: "visual", label: "Designed" },
  { id: "photo", label: "Photo" },
  { id: "dark", label: "Dark" },
];

export const ROLE_FILTERS: { id: RoleFilter; label: string }[] = [
  { id: "all", label: "Any role" },
  { id: "Executive", label: "Executive" },
  { id: "Creative", label: "Creative" },
  { id: "Tech", label: "Tech" },
  { id: "CV", label: "Academic" },
  { id: "Entry-level", label: "First job" },
  { id: "Portfolio", label: "Portfolio" },
];

export function templateMatches(tp: TemplateDef, query: string, finish: FinishFilter, role: RoleFilter): boolean {
  const q = query.trim().toLowerCase();
  if (q) {
    const hay = [tp.label, tp.description, tp.key.replace(/-/g, " "), ...tp.suitFor].join(" ").toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (finish === "ats" && !tp.atsSafeVariant) return false;
  if (finish === "visual" && tp.atsSafeVariant) return false;
  if (finish === "photo" && !tp.photo) return false;
  if (finish === "dark" && !tp.dark) return false;
  if (role !== "all" && !tp.suitFor.includes(role)) return false;
  return true;
}

export const TEMPLATES: TemplateDef[] = [
  {
    key: "gilt",
    label: "Gilt Edge",
    description: "Dark sidebar, gold rings, and a timeline for work and school.",
    suitFor: ["Creative", "Executive", "Combination"],
    atsSafeVariant: false,
    photo: true,
    dark: true,
    component: GiltTemplate,
  },
  {
    key: "bevel",
    label: "Bevel Cut",
    description: "Angled grey panel, pink photo ring, and a clean experience column.",
    suitFor: ["Creative", "Entry-level", "Combination"],
    atsSafeVariant: false,
    photo: true,
    dark: false,
    component: BevelTemplate,
  },
  {
    key: "mast",
    label: "Masthead",
    description: "Oversized surname on grey paper with a photo and skills column.",
    suitFor: ["Creative", "Portfolio", "Executive"],
    atsSafeVariant: false,
    photo: true,
    dark: false,
    component: MastTemplate,
  },
  {
    key: "carmine",
    label: "Carmine",
    description: "Circle portrait, red name, and a compact contact column.",
    suitFor: ["Combination", "Entry-level", "Creative"],
    atsSafeVariant: true,
    photo: true,
    dark: false,
    component: CarmineTemplate,
  },
  {
    key: "blush",
    label: "Blush Ring",
    description: "Blush paper, circled photo, and orange section marks.",
    suitFor: ["Creative", "Portfolio", "Combination"],
    atsSafeVariant: false,
    photo: true,
    dark: false,
    component: BlushTemplate,
  },
  {
    key: "reel",
    label: "Night Reel",
    description: "Dark hero, numbered jobs, and activity cards.",
    suitFor: ["Creative", "Portfolio", "Tech"],
    atsSafeVariant: false,
    photo: true,
    dark: true,
    component: ReelTemplate,
  },
  {
    key: "lagoon",
    label: "Lagoon",
    description: "Teal name, objective band, and a two-column body.",
    suitFor: ["Creative", "Combination", "Entry-level"],
    atsSafeVariant: false,
    photo: true,
    dark: false,
    component: LagoonTemplate,
  },
  {
    key: "stream",
    label: "Playbill",
    description: "Dark profile cards and red accent bars, built like a watch page.",
    suitFor: ["Creative", "Tech", "Portfolio"],
    atsSafeVariant: false,
    photo: true,
    dark: true,
    component: StreamTemplate,
  },
  {
    key: "grove",
    label: "Grove",
    description: "Forest header with a clipped edge, amber marks, and a skills rail.",
    suitFor: ["Combination", "Executive", "Tech"],
    atsSafeVariant: true,
    photo: false,
    dark: false,
    component: GroveTemplate,
  },
  {
    key: "boardroom",
    label: "Boardroom",
    description: "Navy sidebar, gold rules, and a timeline of roles.",
    suitFor: ["Executive", "Combination", "CV"],
    atsSafeVariant: false,
    photo: true,
    dark: true,
    component: BoardroomTemplate,
  },
  {
    key: "plinth",
    label: "Letterhead",
    description: "Clean name and contact as a designed letterhead, then work plus a quiet sidebar.",
    suitFor: ["Creative", "Combination", "Executive"],
    atsSafeVariant: true,
    photo: false,
    dark: false,
    component: PlinthTemplate,
  },
  {
    key: "inkwell",
    label: "Inkwell",
    description: "Ink frame around a white panel. Portrait, work, and skills like a printed folio.",
    suitFor: ["Creative", "Combination", "Executive"],
    atsSafeVariant: false,
    photo: true,
    dark: false,
    component: InkwellTemplate,
  },
  {
    key: "classic",
    label: "Gazette",
    description: "Serif, conservative, single column. The ATS-safe default that recruiters never stumble on.",
    suitFor: ["Chronological", "Combination", "CV", "Executive"],
    atsSafeVariant: true,
    photo: false,
    dark: false,
    component: ClassicTemplate,
  },
  {
    key: "modern-minimal",
    label: "Hairline",
    description: "Clean sans-serif, generous whitespace, hairline accents. Tracks well in ATS.",
    suitFor: ["Combination", "Chronological", "Entry-level"],
    atsSafeVariant: true,
    photo: false,
    dark: false,
    component: ModernMinimalTemplate,
  },
  {
    key: "two-column",
    label: "Twin Column",
    description: "Sidebar for skills and certifications, main column for history. Stacks to one column in ATS mode.",
    suitFor: ["Functional", "Combination", "Creative"],
    atsSafeVariant: true,
    photo: false,
    dark: false,
    component: TwoColumnTemplate,
  },
  {
    key: "executive",
    label: "Chairman",
    description: "Refined serif, centered header, room to breathe. Built for C-level and leadership resumes.",
    suitFor: ["Executive", "Combination", "Chronological"],
    atsSafeVariant: true,
    photo: false,
    dark: false,
    component: ExecutiveTemplate,
  },
  {
    key: "creative",
    label: "Studio Mark",
    description: "Bold accent band, initials mark, skill chips. Personality with structure.",
    suitFor: ["Creative", "Entry-level", "Portfolio"],
    atsSafeVariant: false,
    photo: false,
    dark: false,
    component: CreativeTemplate,
  },
  {
    key: "academic-cv",
    label: "Faculty CV",
    description: "Dense, structured, citation-aware. Publications, teaching, grants, presentations and more.",
    suitFor: ["CV"],
    atsSafeVariant: true,
    photo: false,
    dark: false,
    component: AcademicCvTemplate,
  },
  {
    key: "skills-based",
    label: "Skill Matrix",
    description: "Core skills first as a matrix, then work history. Ideal for functional formats and career changers.",
    suitFor: ["Functional", "Combination"],
    atsSafeVariant: true,
    photo: false,
    dark: false,
    component: SkillsBasedTemplate,
  },
  {
    key: "entry-level",
    label: "First Issue",
    description: "Objective-first, education-forward, friendly sans with skill chips. Built for grads.",
    suitFor: ["Entry-level", "Combination"],
    atsSafeVariant: true,
    photo: false,
    dark: false,
    component: EntryLevelTemplate,
  },
  {
    key: "tech",
    label: "Commit Log",
    description: "Sans body with monospace accents, skill chips, GitHub link emphasized. Engineer-credible.",
    suitFor: ["Combination", "Chronological", "Tech"],
    atsSafeVariant: true,
    photo: false,
    dark: false,
    component: TechTemplate,
  },
  {
    key: "portfolio",
    label: "Lookbook",
    description: "Accent band header, portfolio and project links front and center.",
    suitFor: ["Creative", "Portfolio", "Entry-level"],
    atsSafeVariant: false,
    photo: false,
    dark: false,
    component: PortfolioTemplate,
  },
  {
    key: "photo-sidebar",
    label: "Portrait Rail",
    description: "Accent sidebar with avatar mark, contact and skills; bright main column.",
    suitFor: ["Creative", "Combination", "Entry-level"],
    atsSafeVariant: false,
    photo: true,
    dark: false,
    component: PhotoSidebarTemplate,
  },
  {
    key: "dark-modern",
    label: "Night Press",
    description: "Ink header with portrait and tag, warm sidebar, crisp modern body.",
    suitFor: ["Creative", "Combination", "Entry-level"],
    atsSafeVariant: false,
    photo: true,
    dark: true,
    component: DarkModernTemplate,
  },
  {
    key: "bold-diagonal",
    label: "Slash Mark",
    description: "Strong serif name, diagonal accent flash, dark index sidebar with portrait.",
    suitFor: ["Creative", "Entry-level", "Portfolio"],
    atsSafeVariant: false,
    photo: true,
    dark: true,
    component: BoldDiagonalTemplate,
  },
  {
    key: "tech-dark",
    label: "Night Shift",
    description: "Dark engineering layout: contact bar, headline, carded sections.",
    suitFor: ["Tech", "Combination", "Chronological"],
    atsSafeVariant: false,
    photo: false,
    dark: true,
    component: TechDarkTemplate,
  },
  {
    key: "compact",
    label: "Digest",
    description: "Dense single-column with hairline heads. Packs a senior profile onto one page.",
    suitFor: ["Executive", "Chronological", "Combination"],
    atsSafeVariant: true,
    photo: false,
    dark: false,
    component: CompactTemplate,
  },
  {
    key: "photo-header",
    label: "Banner Shot",
    description: "Accent banner with avatar mark, headline, contact; chips sidebar beside the main column.",
    suitFor: ["Creative", "Combination", "Entry-level"],
    atsSafeVariant: false,
    photo: true,
    dark: false,
    component: PhotoHeaderTemplate,
  },
  {
    key: "classic-serif",
    label: "Caslon",
    description: "Elegant full-serif layout with centered name and refined small-caps section heads.",
    suitFor: ["CV", "Executive", "Chronological"],
    atsSafeVariant: true,
    photo: false,
    dark: false,
    component: ClassicSerifTemplate,
  },
  {
    key: "creative-border",
    label: "Plate Frame",
    description: "Accent-framed canvas with monogram header and corner marks; two-column body.",
    suitFor: ["Creative", "Portfolio", "Entry-level"],
    atsSafeVariant: false,
    photo: false,
    dark: false,
    component: CreativeBorderTemplate,
  },
  {
    key: "colored-sidebar",
    label: "Ink Column",
    description: "Full-bleed accent sidebar with avatar and light chip skills; airy main column.",
    suitFor: ["Creative", "Combination", "Entry-level"],
    atsSafeVariant: false,
    photo: true,
    dark: false,
    component: ColoredSidebarTemplate,
  },
  {
    key: "manifest",
    label: "Manifest",
    description: "Editorial table-of-contents layout with index numbers and hairline rules.",
    suitFor: ["Executive", "Combination", "Chronological"],
    atsSafeVariant: true,
    photo: false,
    dark: false,
    component: ManifestTemplate,
  },
  {
    key: "blueprint",
    label: "Blueprint",
    description: "Technical drawing feel: crosshair corners, monospace section kicks, timeline entries.",
    suitFor: ["Tech", "Combination", "Chronological"],
    atsSafeVariant: true,
    photo: false,
    dark: false,
    component: BlueprintTemplate,
  },
  {
    key: "broadside",
    label: "Broadside",
    description: "Magazine masthead header with double rule and a ruled sidebar column.",
    suitFor: ["Creative", "Combination", "Executive"],
    atsSafeVariant: false,
    photo: false,
    dark: false,
    component: BroadsideTemplate,
  },
  {
    key: "ribbon-navy",
    label: "Navy Ribbon",
    description: "Dark sidebar, circular portrait, ribbon section heads. Strong corporate-creative look.",
    suitFor: ["Creative", "Combination", "Executive"],
    atsSafeVariant: false,
    photo: true,
    dark: true,
    component: RibbonNavyTemplate,
  },
  {
    key: "sage-overlap",
    label: "Sage Fold",
    description: "Forest panel, sage pills, overlapping About bar. Soft and modern.",
    suitFor: ["Creative", "Combination", "Entry-level"],
    atsSafeVariant: false,
    photo: true,
    dark: false,
    component: SageOverlapTemplate,
  },
  {
    key: "circuit-dark",
    label: "Circuit",
    description: "Night-blue canvas, floating cards, neon titles. Built for design and tech portfolios.",
    suitFor: ["Creative", "Portfolio", "Tech"],
    atsSafeVariant: false,
    photo: true,
    dark: true,
    component: CircuitDarkTemplate,
  },
  {
    key: "terra-wave",
    label: "Terra Wave",
    description: "Cream page, dark sidebar, orange corner waves, overlapping portrait.",
    suitFor: ["Creative", "Combination", "Portfolio"],
    atsSafeVariant: false,
    photo: true,
    dark: false,
    component: TerraWaveTemplate,
  },
  {
    key: "stadium-banner",
    label: "Arena",
    description: "Curved header with portrait, cream index, dark timeline column.",
    suitFor: ["Creative", "Combination", "Executive"],
    atsSafeVariant: false,
    photo: true,
    dark: false,
    component: StadiumBannerTemplate,
  },
  {
    key: "polaroid-burst",
    label: "Polaroid",
    description: "Tilted photo frame, sunburst, orange About band, yellow experience column.",
    suitFor: ["Creative", "Portfolio", "Entry-level"],
    atsSafeVariant: false,
    photo: true,
    dark: false,
    component: PolaroidBurstTemplate,
  },
  {
    key: "forest-geo",
    label: "Canopy",
    description: "Green parallelograms, rounded portrait frame, bold bar headings.",
    suitFor: ["Creative", "Combination", "Entry-level"],
    atsSafeVariant: false,
    photo: true,
    dark: false,
    component: ForestGeoTemplate,
  },
  {
    key: "gold-cut",
    label: "Gold Cut",
    description: "Charcoal sidebar, gold geometry, circular portrait, timeline markers.",
    suitFor: ["Creative", "Combination", "Executive"],
    atsSafeVariant: false,
    photo: true,
    dark: true,
    component: GoldCutTemplate,
  },
];

export function getTemplate(key: TemplateKey): TemplateDef {
  return TEMPLATES.find((t) => t.key === key) ?? TEMPLATES[0];
}

export function templateIndex(key: TemplateKey): number {
  const i = TEMPLATES.findIndex((t) => t.key === key);
  return i < 0 ? 0 : i;
}

export function adjacentTemplate(key: TemplateKey, dir: -1 | 1): TemplateDef {
  const i = templateIndex(key);
  return TEMPLATES[(i + dir + TEMPLATES.length) % TEMPLATES.length];
}

const DEFAULT_ACCENTS: Record<TemplateKey, string> = {
  classic: "#1d2130",
  "modern-minimal": "#334155",
  "two-column": "#334155",
  executive: "#1d2130",
  creative: "#b0302a",
  "academic-cv": "#1d2130",
  "skills-based": "#1e3a5f",
  "entry-level": "#16647a",
  tech: "#16647a",
  portfolio: "#8a5a24",
  "photo-sidebar": "#1e3a5f",
  "dark-modern": "#7a1f2b",
  "bold-diagonal": "#b0302a",
  "tech-dark": "#262a43",
  compact: "#1d2130",
  "photo-header": "#6d2a33",
  "classic-serif": "#1d2130",
  "creative-border": "#5b2a6b",
  "colored-sidebar": "#2f5d50",
  manifest: "#b0302a",
  blueprint: "#16647a",
  broadside: "#7a1f2b",
  "ribbon-navy": "#1b365d",
  "sage-overlap": "#2f5d50",
  "circuit-dark": "#0d3b4c",
  "terra-wave": "#c45c26",
  "stadium-banner": "#4a3728",
  "polaroid-burst": "#e85d04",
  "forest-geo": "#2d6a32",
  "gold-cut": "#c9a227",
  plinth: "#0f766e",
  inkwell: "#1e3a5f",
  gilt: "#c9a876",
  bevel: "#f2a0b5",
  mast: "#5c6650",
  carmine: "#c0392b",
  blush: "#e0713c",
  reel: "#4caf7d",
  lagoon: "#5fa8ac",
  stream: "#e50914",
  grove: "#173f35",
  boardroom: "#c9a66b",
};

export function templateDefaultAccent(key: TemplateKey): string {
  return DEFAULT_ACCENTS[key] ?? "#1d2130";
}

export const DEFAULT_TEMPLATE: TemplateKey = "classic";
