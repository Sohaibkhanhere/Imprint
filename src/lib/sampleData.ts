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

export function createDemoResume(): Resume {
  const base = createBlankResume();
  return {
    ...base,
    meta: { ...base.meta, name: "Sample resume" },
    contact: {
      fullName: "Ayesha Rahman",
      title: "Operations Manager",
      phone: "+92 300 1234567",
      email: "ayesha.rahman@email.com",
      city: "Karachi",
      country: "Pakistan",
      linkedin: "linkedin.com/in/ayesha",
      website: "ayesharahman.com",
      github: "",
      portfolioUrl: "",
      photoUrl: "",
    },
    summary:
      "Operations manager with eight years leading delivery teams. Tightens workflows, keeps clients on schedule, and turns messy handoffs into a process people can actually follow.",
    experience: [
      {
        id: uid(),
        company: "Northwind Logistics",
        role: "Operations Manager",
        location: "Karachi",
        startDate: "2022",
        endDate: "",
        present: true,
        descriptor: "",
        bullets: [
          "Cut order-cycle time 18% by rebuilding the weekly dispatch board.",
          "Lead a team of 12 across warehouse, client success, and planning.",
        ],
      },
      {
        id: uid(),
        company: "Harbor & Co.",
        role: "Team Lead",
        location: "Karachi",
        startDate: "2018",
        endDate: "2022",
        present: false,
        descriptor: "",
        bullets: [
          "Ran onboarding for 40+ hires and kept first-month error rates under 3%.",
          "Built a simple KPI pack that leadership still uses in Monday reviews.",
        ],
      },
    ],
    education: [
      {
        id: uid(),
        institution: "Institute of Business Administration",
        degree: "BBA",
        field: "Management",
        location: "Karachi",
        startDate: "2014",
        endDate: "2018",
        gpa: "",
        honors: "",
        coursework: "",
        thesis: "",
      },
    ],
    skills: [
      { id: uid(), name: "Operations", skills: ["Process design", "Vendor management", "KPI reporting"] },
      { id: uid(), name: "Tools", skills: ["Excel", "Notion", "Power BI"] },
    ],
    projects: [
      {
        id: uid(),
        name: "Dispatch board",
        description: "Replaced a shared spreadsheet with a live board so warehouse and sales see the same queue.",
        tech: "Airtable, Slack",
        link: "",
      },
    ],
    certifications: [{ id: uid(), name: "Lean Six Sigma Green Belt", issuer: "ASQ", year: "2021", expires: "" }],
    languages: [
      { id: uid(), name: "English", level: "Fluent" },
      { id: uid(), name: "Urdu", level: "Native" },
    ],
    visibility: {
      ...base.visibility,
      summary: true,
      experience: true,
      education: true,
      skills: true,
      projects: true,
      certifications: true,
      languages: true,
    },
  };
}

export function resumeLooksEmpty(r: Resume): boolean {
  const named = (r.contact?.fullName || "").trim();
  const sum = (r.summary || "").trim() || (r.objective || "").trim();
  const jobs = (r.experience ?? []).some((j) => (j.role || "").trim() || (j.company || "").trim());
  const edu = (r.education ?? []).some((e) => (e.degree || "").trim() || (e.institution || "").trim());
  const skills = (r.skills ?? []).some((g) => (g.skills ?? []).some((s) => s.trim()));
  return !named && !sum && !jobs && !edu && !skills;
}

/** Gallery thumbs use sample copy when the live resume is still empty. */
export function resumeForGalleryPreview(live: Resume): Resume {
  if (!resumeLooksEmpty(live)) return live;
  const demo = createDemoResume();
  return {
    ...demo,
    theme: {
      ...demo.theme,
      pageSize: live.theme?.pageSize ?? demo.theme.pageSize,
      density: live.theme?.density ?? demo.theme.density,
      atsSafe: live.theme?.atsSafe ?? demo.theme.atsSafe,
      fontPair: live.theme?.fontPair ?? demo.theme.fontPair,
    },
  };
}

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
    extras: [],
    sectionOrder: defaultSectionOrder(type),
    visibility: defaultVisibility(type),
    theme: {
      template: "boardroom",
      accent: "#c9a66b",
      fontPair: "editorial",
      density: "comfortable",
      atsSafe: false,
      pageSize: "a4",
      maxPages: 1,
      citationFormat: "apa",
    },
  };
}


