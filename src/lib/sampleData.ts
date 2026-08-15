import type { Resume } from "./types";
import { defaultSectionOrder, defaultVisibility } from "./resumeTypes";
import { todayISO, uid } from "./date";

export const ACCENT_PALETTE = [
  { name: "Ink", value: "#1d2130" },
  { name: "Editorial Red", value: "#b0302a" },
  { name: "Slate", value: "#334155" },
  { name: "Deep Blue", value: "#1e3a5f" },
  { name: "Forest", value: "#2f5d50" },
  { name: "Burgundy", value: "#6d2a33" },
  { name: "Marine", value: "#16647a" },
  { name: "Oxblood", value: "#7a1f2b" },
  { name: "Plum", value: "#5b2a6b" },
  { name: "Bronze", value: "#8a5a24" },
  { name: "Midnight", value: "#262a43" },
  { name: "Navy", value: "#1b365d" },
  { name: "Sage", value: "#3d6b52" },
  { name: "Ember", value: "#c45c26" },
  { name: "Citrus", value: "#e85d04" },
  { name: "Cobalt", value: "#1d4ed8" },
  { name: "Teal", value: "#0f766e" },
  { name: "Indigo", value: "#4338ca" },
];

export const FONT_PAIRS = [
  {
    key: "serif-academic",
    label: "Classic Serif",
    display: "'Source Serif 4', Georgia, serif",
    body: "'Source Serif 4', Georgia, serif",
    desc: "Traditional, ATS-safe, scholarly",
    ats: "'Georgia', serif",
  },
  {
    key: "sans-modern",
    label: "Modern Sans",
    display: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    body: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    desc: "Clean, contemporary, SaaS-native",
    ats: "'Arial', sans-serif",
  },
  {
    key: "editorial",
    label: "Editorial Mix",
    display: "'Playfair Display', Georgia, serif",
    body: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    desc: "Distinctive headings, readable body",
    ats: "'Georgia', 'Arial', sans-serif",
  },
];

export function createBlankResume(): Resume {
  const type = "combination";
  return {
    meta: { id: uid(), name: "My Resume", type, createdAt: todayISO(), updatedAt: todayISO() },
    target: { jobDescription: "", enabled: false },
    contact: { fullName: "", title: "", phone: "", email: "", city: "", country: "", linkedin: "", website: "", github: "", portfolioUrl: "", photoUrl: "" },
    summary: "",
    objective: "",
    useObjective: false,
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    volunteer: [],
    publications: [],
    awards: [],
    teaching: [],
    grants: [],
    presentations: [],
    affiliations: [],
    references: [],
    sectionOrder: defaultSectionOrder(type),
    visibility: defaultVisibility(type),
    theme: {
      template: "classic",
      accent: ACCENT_PALETTE[0].value,
      fontPair: "editorial",
      density: "comfortable",
      atsSafe: false,
      pageSize: "a4",
      maxPages: 1,
      citationFormat: "apa",
    },
  };
}


