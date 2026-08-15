import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { TEMPLATES } from "../src/templates/registry";
import { createBlankResume } from "../src/lib/sampleData";
import { hydrateResume } from "../src/lib/storage";
import { runHealthChecks } from "../src/lib/validation";
import { buildResumeDocx } from "../src/lib/docx";
import { uid } from "../src/lib/date";
import type { Resume, TemplateKey, ThemeConfig } from "../src/lib/types";

function fullResume(theme: Partial<ThemeConfig> = {}): Resume {
  const blank = createBlankResume();
  const vis = Object.fromEntries(Object.keys(blank.visibility).map((k) => [k, true])) as Resume["visibility"];
  return hydrateResume({
    ...blank,
    contact: {
      fullName: "Ayesha Khan",
      title: "Senior Marketing Manager",
      phone: "+1 555-014-2233",
      email: "ayesha@example.com",
      city: "San Francisco",
      country: "USA",
      linkedin: "linkedin.com/in/ayesha",
      website: "ayesha.example.com",
      github: "github.com/ayesha",
      portfolioUrl: "ayesha.example.com/work",
      photoUrl: "",
    },
    summary: "Marketing lead with 8 years building demand programs for B2B SaaS.",
    objective: "Seeking a growth marketing role at a product-led company.",
    useObjective: false,
    experience: [
      {
        id: uid(),
        company: "Lumenly",
        role: "Senior Marketing Manager",
        location: "San Francisco, CA",
        startDate: "2021",
        endDate: "",
        present: true,
        descriptor: "B2B SaaS analytics",
        bullets: ["Grew qualified pipeline 42% in 12 months.", "Launched a content engine that drove 12k visits."],
      },
      {
        id: uid(),
        company: "Northwind",
        role: "Marketing Manager",
        location: "Chicago, IL",
        startDate: "2018",
        endDate: "2021",
        present: false,
        descriptor: "",
        bullets: ["Cut CAC 18% by rebuilding paid search."],
      },
    ],
    education: [
      {
        id: uid(),
        institution: "Northwestern University",
        degree: "B.A.",
        field: "Marketing",
        location: "Evanston, IL",
        startDate: "2012",
        endDate: "2016",
        gpa: "3.8",
        honors: "Magna cum laude",
        coursework: "Brand Strategy",
        thesis: "",
      },
    ],
    skills: [{ id: uid(), name: "Technical", skills: ["GA4", "SQL", "Figma"] }],
    projects: [{ id: uid(), name: "Growth Playbook", description: "Playbook used by 40+ marketers.", tech: "Notion", link: "example.com" }],
    certifications: [{ id: uid(), name: "GA4 Certified", issuer: "Google", year: "2023", expires: "2025" }],
    languages: [{ id: uid(), name: "English", level: "Native" }],
    volunteer: [
      {
        id: uid(),
        title: "Mentor",
        org: "Women in Tech",
        location: "SF",
        startDate: "2022",
        endDate: "",
        present: true,
        bullets: ["Mentored 6 early-career marketers."],
      },
    ],
    publications: [{ id: uid(), title: "Demand in a downturn", venue: "Journal of Growth", year: "2022", authors: "Khan, A.", url: "doi.org/10" }],
    awards: [{ id: uid(), title: "Team of the Year", org: "Lumenly", year: "2023" }],
    teaching: [
      {
        id: uid(),
        role: "Guest lecturer",
        institution: "Stanford",
        course: "Growth 101",
        location: "Stanford, CA",
        startDate: "2020",
        endDate: "2021",
        bullets: ["Taught a 6-week seminar."],
      },
    ],
    grants: [{ id: uid(), name: "Research grant", funder: "NSF", amount: "138000", year: "2021", description: "Funding for research." }],
    presentations: [{ id: uid(), title: "Pipeline math", event: "SaaStr", year: "2023", location: "SF" }],
    affiliations: [{ id: uid(), name: "AMA", role: "Member", years: "2019 – Present" }],
    references: [{ id: uid(), name: "Dr. Sarah Lin", title: "Professor", org: "Northwestern", email: "s.lin@example.edu", phone: "+1 555-010-0000" }],
    sectionOrder: [
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
    ],
    visibility: vis,
    theme: { ...blank.theme, ...theme },
  });
}

const failures: string[] = [];

function renderOne(label: string, key: TemplateKey, resume: Resume) {
  const def = TEMPLATES.find((t) => t.key === key);
  if (!def) {
    failures.push(`${label}: missing template ${key}`);
    return;
  }
  try {
    const html = renderToString(createElement(def.component, { resume }));
    if (!html || html.length < 20) failures.push(`${label}: empty render (${html.length} chars)`);
  } catch (e) {
    failures.push(`${label}: ${(e as Error).message}`);
  }
}

function main() {
  const keys = TEMPLATES.map((t) => t.key);
  console.log(`Auditing ${keys.length} layouts...`);

  const blank = createBlankResume();
  const broken = hydrateResume({} as Resume);
  const full = fullResume();
  const variants: [string, Resume][] = [
    ["blank", blank],
    ["broken-hydrated", broken],
    ["full", full],
    ["ats", fullResume({ atsSafe: true })],
    ["letter", fullResume({ pageSize: "letter" })],
    ["compact", fullResume({ density: "compact" })],
    ["mla", fullResume({ citationFormat: "mla" })],
    ["chicago", fullResume({ citationFormat: "chicago" })],
    ["objective", { ...full, useObjective: true }],
    ["long-name", { ...full, contact: { ...full.contact, fullName: "Muhammad Sohaib Khan" } }],
    [
      "no-side",
      {
        ...full,
        visibility: {
          ...full.visibility,
          skills: false,
          languages: false,
          certifications: false,
          education: false,
        },
      },
    ],
  ];

  for (const key of keys) {
    for (const [name, resume] of variants) {
      renderOne(`${key}/${name}`, key, { ...resume, theme: { ...resume.theme, template: key } });
    }
  }

  try {
    runHealthChecks(blank, 1);
    runHealthChecks(full, 2);
    runHealthChecks(broken, 1);
  } catch (e) {
    failures.push(`health: ${(e as Error).message}`);
  }

  try {
    buildResumeDocx(blank);
    buildResumeDocx(full);
    buildResumeDocx(broken);
  } catch (e) {
    failures.push(`docx: ${(e as Error).message}`);
  }

  if (failures.length) {
    console.error(`FAILED ${failures.length} checks:`);
    for (const f of failures) console.error(" -", f);
    process.exit(1);
  }
  console.log(`OK ${keys.length} layouts x ${variants.length} variants + health + docx`);
}

main();
