import type { ComponentType } from "react";
import type { Resume, TemplateKey, ThemeConfig } from "../lib/types";
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

const TEMPLATE_CATALOG: TemplateDef[] = [
  {
    key: "gilt",
    label: "Gold Ring",
    description: "Black-and-gold sidebar, ring portrait, and a timeline.",
    suitFor: ["Creative", "Executive", "Combination"],
    atsSafeVariant: false,
    photo: true,
    dark: true,
    component: GiltTemplate,
  },
  {
    key: "bevel",
    label: "Pink Cut",
    description: "Angled grey panel, pink photo ring, light experience column.",
    suitFor: ["Creative", "Entry-level", "Combination"],
    atsSafeVariant: false,
    photo: true,
    dark: false,
    component: BevelTemplate,
  },
  {
    key: "mast",
    label: "Poster Name",
    description: "Huge surname on grey paper, photo, and a skills column.",
    suitFor: ["Creative", "Portfolio", "Executive"],
    atsSafeVariant: false,
    photo: true,
    dark: false,
    component: MastTemplate,
  },
  {
    key: "carmine",
    label: "Red Circle",
    description: "Round portrait, red name, compact contact column.",
    suitFor: ["Combination", "Entry-level", "Creative"],
    atsSafeVariant: true,
    photo: true,
    dark: false,
    component: CarmineTemplate,
  },
  {
    key: "blush",
    label: "Blush",
    description: "Blush paper, circled photo, orange section marks.",
    suitFor: ["Creative", "Portfolio", "Combination"],
    atsSafeVariant: false,
    photo: true,
    dark: false,
    component: BlushTemplate,
  },
  {
    key: "reel",
    label: "Night Show",
    description: "Dark hero, numbered jobs, and activity cards.",
    suitFor: ["Creative", "Portfolio", "Tech"],
    atsSafeVariant: false,
    photo: true,
    dark: true,
    component: ReelTemplate,
  },
  {
    key: "lagoon",
    label: "Teal",
    description: "Teal name band, photo, and a two-column body.",
    suitFor: ["Creative", "Combination", "Entry-level"],
    atsSafeVariant: false,
    photo: true,
    dark: false,
    component: LagoonTemplate,
  },
  {
    key: "stream",
    label: "Netflix",
    description: "Black page, red marks, poster photo. Built like a streaming profile.",
    suitFor: ["Creative", "Tech", "Portfolio"],
    atsSafeVariant: false,
    photo: true,
    dark: true,
    component: StreamTemplate,
  },
  {
    key: "grove",
    label: "Forest",
    description: "Deep green header, clipped edge, amber marks, skills rail.",
    suitFor: ["Combination", "Executive", "Tech"],
    atsSafeVariant: true,
    photo: false,
    dark: false,
    component: GroveTemplate,
  },
  {
    key: "boardroom",
    label: "Navy Gold",
    description: "Navy sidebar, gold rules, portrait, and a job timeline.",
    suitFor: ["Executive", "Combination", "CV"],
    atsSafeVariant: false,
    photo: true,
    dark: true,
    component: BoardroomTemplate,
  },
  {
    key: "classic",
    label: "Classic",
    description: "Serif, single column, underline heads. Safe for any ATS.",
    suitFor: ["Chronological", "Combination", "CV", "Executive"],
    atsSafeVariant: true,
    photo: false,
    dark: false,
    component: ClassicTemplate,
  },
  {
    key: "modern-minimal",
    label: "Minimal",
    description: "Clean sans, lots of white space, thin rules. ATS-safe.",
    suitFor: ["Combination", "Chronological", "Entry-level"],
    atsSafeVariant: true,
    photo: false,
    dark: false,
    component: ModernMinimalTemplate,
  },
  {
    key: "two-column",
    label: "Two Column",
    description: "Skills on the side, jobs in the main column. Stacks in ATS mode.",
    suitFor: ["Functional", "Combination", "Creative"],
    atsSafeVariant: true,
    photo: false,
    dark: false,
    component: TwoColumnTemplate,
  },
  {
    key: "executive",
    label: "Executive",
    description: "Centered serif header, wide margins. Built for leadership roles.",
    suitFor: ["Executive", "Combination", "Chronological"],
    atsSafeVariant: true,
    photo: false,
    dark: false,
    component: ExecutiveTemplate,
  },
  {
    key: "creative",
    label: "Color Band",
    description: "Bold color header, initials mark, skill chips.",
    suitFor: ["Creative", "Entry-level", "Portfolio"],
    atsSafeVariant: false,
    photo: false,
    dark: false,
    component: CreativeTemplate,
  },
  {
    key: "academic-cv",
    label: "Academic",
    description: "Dense CV: publications, teaching, grants, talks.",
    suitFor: ["CV"],
    atsSafeVariant: true,
    photo: false,
    dark: false,
    component: AcademicCvTemplate,
  },
  {
    key: "skills-based",
    label: "Skills First",
    description: "Skills on top, then a short job list. For career changers.",
    suitFor: ["Functional", "Combination"],
    atsSafeVariant: true,
    photo: false,
    dark: false,
    component: SkillsBasedTemplate,
  },
  {
    key: "entry-level",
    label: "Fresh Grad",
    description: "Objective first, education up top, skill chips. For new grads.",
    suitFor: ["Entry-level", "Combination"],
    atsSafeVariant: true,
    photo: false,
    dark: false,
    component: EntryLevelTemplate,
  },
  {
    key: "tech",
    label: "Engineer",
    description: "Sans body, monospace kicks, skill chips, GitHub up front.",
    suitFor: ["Combination", "Chronological", "Tech"],
    atsSafeVariant: true,
    photo: false,
    dark: false,
    component: TechTemplate,
  },
  {
    key: "portfolio",
    label: "Portfolio",
    description: "Color header with projects and portfolio links first.",
    suitFor: ["Creative", "Portfolio", "Entry-level"],
    atsSafeVariant: false,
    photo: false,
    dark: false,
    component: PortfolioTemplate,
  },
  {
    key: "photo-sidebar",
    label: "Photo Rail",
    description: "Color sidebar with photo, contact, and skills; light main column.",
    suitFor: ["Creative", "Combination", "Entry-level"],
    atsSafeVariant: false,
    photo: true,
    dark: false,
    component: PhotoSidebarTemplate,
  },
  {
    key: "dark-modern",
    label: "Dark Header",
    description: "Ink header with photo, warm sidebar, light body.",
    suitFor: ["Creative", "Combination", "Entry-level"],
    atsSafeVariant: false,
    photo: true,
    dark: true,
    component: DarkModernTemplate,
  },
  {
    key: "bold-diagonal",
    label: "Slash",
    description: "Big serif name, diagonal flash, dark photo sidebar.",
    suitFor: ["Creative", "Entry-level", "Portfolio"],
    atsSafeVariant: false,
    photo: true,
    dark: true,
    component: BoldDiagonalTemplate,
  },
  {
    key: "tech-dark",
    label: "Dark Tech",
    description: "Dark page, contact bar, headline, carded sections.",
    suitFor: ["Tech", "Combination", "Chronological"],
    atsSafeVariant: false,
    photo: false,
    dark: true,
    component: TechDarkTemplate,
  },
  {
    key: "compact",
    label: "Compact",
    description: "Tight single column. Packs a long career onto one page.",
    suitFor: ["Executive", "Chronological", "Combination"],
    atsSafeVariant: true,
    photo: false,
    dark: false,
    component: CompactTemplate,
  },
  {
    key: "photo-header",
    label: "Banner Photo",
    description: "Color banner with photo and name, chips in a side column.",
    suitFor: ["Creative", "Combination", "Entry-level"],
    atsSafeVariant: false,
    photo: true,
    dark: false,
    component: PhotoHeaderTemplate,
  },
  {
    key: "classic-serif",
    label: "Fine Serif",
    description: "All-serif page, centered name, small-caps heads.",
    suitFor: ["CV", "Executive", "Chronological"],
    atsSafeVariant: true,
    photo: false,
    dark: false,
    component: ClassicSerifTemplate,
  },
  {
    key: "creative-border",
    label: "Frame",
    description: "Color frame, monogram header, two-column body.",
    suitFor: ["Creative", "Portfolio", "Entry-level"],
    atsSafeVariant: false,
    photo: false,
    dark: false,
    component: CreativeBorderTemplate,
  },
  {
    key: "colored-sidebar",
    label: "Color Rail",
    description: "Full-color sidebar with photo and chips, airy main column.",
    suitFor: ["Creative", "Combination", "Entry-level"],
    atsSafeVariant: false,
    photo: true,
    dark: false,
    component: ColoredSidebarTemplate,
  },
  {
    key: "manifest",
    label: "Index",
    description: "Numbered contents list, hairline rules, editorial page.",
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
    label: "Magazine",
    description: "Newspaper masthead, double rule, ruled sidebar.",
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
    label: "Sage",
    description: "Sage-green panel, soft pills, overlapping About bar.",
    suitFor: ["Creative", "Combination", "Entry-level"],
    atsSafeVariant: false,
    photo: true,
    dark: false,
    component: SageOverlapTemplate,
  },
  {
    key: "circuit-dark",
    label: "Neon",
    description: "Night-blue page, floating cards, neon titles.",
    suitFor: ["Creative", "Portfolio", "Tech"],
    atsSafeVariant: false,
    photo: true,
    dark: true,
    component: CircuitDarkTemplate,
  },
  {
    key: "terra-wave",
    label: "Terra",
    description: "Cream page, dark sidebar, orange waves, overlapping photo.",
    suitFor: ["Creative", "Combination", "Portfolio"],
    atsSafeVariant: false,
    photo: true,
    dark: false,
    component: TerraWaveTemplate,
  },
  {
    key: "stadium-banner",
    label: "Curve",
    description: "Curved header with photo, cream index, dark timeline.",
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
    label: "Green Cut",
    description: "Green parallelograms, round photo, bold bar heads.",
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

/** Strongest first-look layouts up front. New users should see designed pages, not empty ATS sheets. */
const FEATURED_ORDER: TemplateKey[] = [
  "boardroom",
  "grove",
  "stream",
  "lagoon",
  "gilt",
  "carmine",
  "colored-sidebar",
  "ribbon-navy",
  "gold-cut",
  "mast",
  "photo-header",
  "sage-overlap",
  "terra-wave",
  "blush",
  "stadium-banner",
  "bevel",
  "photo-sidebar",
  "creative",
  "forest-geo",
  "executive",
  "two-column",
  "manifest",
  "blueprint",
  "broadside",
  "modern-minimal",
  "classic",
  "classic-serif",
  "tech",
  "entry-level",
  "portfolio",
  "creative-border",
  "dark-modern",
  "bold-diagonal",
  "tech-dark",
  "reel",
  "circuit-dark",
  "compact",
  "skills-based",
  "academic-cv",
  "polaroid-burst",
];

export const TEMPLATES: TemplateDef[] = (() => {
  const byKey = new Map(TEMPLATE_CATALOG.map((t) => [t.key, t]));
  const seen = new Set<TemplateKey>();
  const ordered: TemplateDef[] = [];
  for (const key of FEATURED_ORDER) {
    const tp = byKey.get(key);
    if (!tp || seen.has(key)) continue;
    ordered.push(tp);
    seen.add(key);
  }
  for (const tp of TEMPLATE_CATALOG) {
    if (seen.has(tp.key)) continue;
    ordered.push(tp);
  }
  return ordered;
})();

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

export function themePatchForTemplate(key: TemplateKey): Partial<ThemeConfig> {
  const tp = getTemplate(key);
  return {
    template: key,
    accent: templateDefaultAccent(key),
    atsSafe: tp.atsSafeVariant,
  };
}

export const DEFAULT_TEMPLATE: TemplateKey = "classic";
