import type { FluencyLevel, Resume, SocialLink } from "./types";
import { sanitizePhotoUrl, sanitizePlainText } from "./sanitize";
import { uid } from "./date";

const FLUENCY: FluencyLevel[] = ["Native", "Fluent", "Professional", "Conversational"];

function str(v: unknown): string {
  return sanitizePlainText(v).trim();
}

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]).filter((x) => x != null && typeof x !== "function") : [];
}

function obj<T extends object>(v: T | null | undefined): T {
  return v && typeof v === "object" && !Array.isArray(v) ? v : ({} as T);
}

function fluency(v: unknown): FluencyLevel {
  return FLUENCY.includes(v as FluencyLevel) ? (v as FluencyLevel) : "Native";
}

function idOf(v: unknown): string {
  return typeof v === "string" ? str(v) : "";
}

export function sanitizeSocials(raw: unknown): SocialLink[] {
  return arr(raw)
    .map((item) => {
      const x = obj(item as object);
      return {
        id: idOf((x as { id?: unknown }).id) || uid(),
        label: str((x as { label?: unknown }).label),
        url: str((x as { url?: unknown }).url),
      };
    });
}

export function coerceResume(resume: Resume): Resume {
  const c = obj(resume?.contact);
  return {
    meta: obj(resume?.meta),
    target: obj(resume?.target),
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
      photoUrl: sanitizePhotoUrl(c.photoUrl),
      socials: sanitizeSocials((c as { socials?: unknown }).socials),
    },
    summary: str(resume?.summary),
    objective: str(resume?.objective),
    useObjective: Boolean(resume?.useObjective),
    visibility: obj(resume?.visibility),
    sectionOrder: Array.isArray(resume?.sectionOrder) ? resume.sectionOrder : [],
    theme: obj(resume?.theme),
    experience: arr<Resume["experience"][number]>(resume?.experience).map((raw) => {
      const j = obj(raw);
      return {
        id: idOf(j.id),
        company: str(j.company),
        role: str(j.role),
        location: str(j.location),
        startDate: str(j.startDate),
        endDate: str(j.endDate),
        present: Boolean(j.present),
        descriptor: str(j.descriptor),
        bullets: arr<string>(j.bullets).map(str),
      };
    }),
    education: arr<Resume["education"][number]>(resume?.education).map((raw) => {
      const e = obj(raw);
      return {
        id: idOf(e.id),
        institution: str(e.institution),
        degree: str(e.degree),
        field: str(e.field),
        location: str(e.location),
        startDate: str(e.startDate),
        endDate: str(e.endDate),
        gpa: str(e.gpa),
        honors: str(e.honors),
        coursework: str(e.coursework),
        thesis: str(e.thesis),
      };
    }),
    skills: arr<Resume["skills"][number]>(resume?.skills).map((raw) => {
      const g = obj(raw);
      return {
        id: idOf(g.id),
        name: str(g.name),
        skills: arr<string>(g.skills).map(str),
      };
    }),
    projects: arr<Resume["projects"][number]>(resume?.projects).map((raw) => {
      const p = obj(raw);
      return {
        id: idOf(p.id),
        name: str(p.name),
        description: str(p.description),
        tech: str(p.tech),
        link: str(p.link),
      };
    }),
    certifications: arr<Resume["certifications"][number]>(resume?.certifications).map((raw) => {
      const x = obj(raw);
      return {
        id: idOf(x.id),
        name: str(x.name),
        issuer: str(x.issuer),
        year: str(x.year),
        expires: str(x.expires),
      };
    }),
    languages: arr<Resume["languages"][number]>(resume?.languages).map((raw) => {
      const x = obj(raw);
      return {
        id: idOf(x.id),
        name: str(x.name),
        level: fluency(x.level),
      };
    }),
    volunteer: arr<Resume["volunteer"][number]>(resume?.volunteer).map((raw) => {
      const x = obj(raw);
      return {
        id: idOf(x.id),
        title: str(x.title),
        org: str(x.org),
        location: str(x.location),
        startDate: str(x.startDate),
        endDate: str(x.endDate),
        present: Boolean(x.present),
        bullets: arr<string>(x.bullets).map(str),
      };
    }),
    publications: arr<Resume["publications"][number]>(resume?.publications).map((raw) => {
      const x = obj(raw);
      return {
        id: idOf(x.id),
        title: str(x.title),
        venue: str(x.venue),
        year: str(x.year),
        authors: str(x.authors),
        url: str(x.url),
      };
    }),
    awards: arr<Resume["awards"][number]>(resume?.awards).map((raw) => {
      const x = obj(raw);
      return {
        id: idOf(x.id),
        title: str(x.title),
        org: str(x.org),
        year: str(x.year),
      };
    }),
    teaching: arr<Resume["teaching"][number]>(resume?.teaching).map((raw) => {
      const x = obj(raw);
      return {
        id: idOf(x.id),
        role: str(x.role),
        institution: str(x.institution),
        course: str(x.course),
        location: str(x.location),
        startDate: str(x.startDate),
        endDate: str(x.endDate),
        bullets: arr<string>(x.bullets).map(str),
      };
    }),
    grants: arr<Resume["grants"][number]>(resume?.grants).map((raw) => {
      const x = obj(raw);
      return {
        id: idOf(x.id),
        name: str(x.name),
        funder: str(x.funder),
        amount: str(x.amount),
        year: str(x.year),
        description: str(x.description),
      };
    }),
    presentations: arr<Resume["presentations"][number]>(resume?.presentations).map((raw) => {
      const x = obj(raw);
      return {
        id: idOf(x.id),
        title: str(x.title),
        event: str(x.event),
        year: str(x.year),
        location: str(x.location),
      };
    }),
    affiliations: arr<Resume["affiliations"][number]>(resume?.affiliations).map((raw) => {
      const x = obj(raw);
      return {
        id: idOf(x.id),
        name: str(x.name),
        role: str(x.role),
        years: str(x.years),
      };
    }),
    references: arr<Resume["references"][number]>(resume?.references).map((raw) => {
      const x = obj(raw);
      return {
        id: idOf(x.id),
        name: str(x.name),
        title: str(x.title),
        org: str(x.org),
        email: str(x.email),
        phone: str(x.phone),
      };
    }),
    extras: arr<Resume["extras"][number]>(resume?.extras).map((raw) => {
      const x = obj(raw);
      return {
        id: idOf(x.id),
        label: str(x.label),
        value: str(x.value),
      };
    }),
  };
}
