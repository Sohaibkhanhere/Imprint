import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Resume, ExperienceEntry, VolunteerEntry, TeachingEntry, PageSize } from "../lib/types";
import { FONT_PAIRS } from "../lib/sampleData";
import { formatRange, cleanUrl } from "../lib/date";
import { getResumeType } from "../lib/resumeTypes";
import { t } from "../lib/safe";

export const PAGE_DIMS: Record<PageSize, { width: number; height: number; cssWidth: string; cssHeight: string; label: string }> = {
  a4: { width: 793.7, height: 1122.5, cssWidth: "210mm", cssHeight: "297mm", label: "A4" },
  letter: { width: 816, height: 1056, cssWidth: "8.5in", cssHeight: "11in", label: "Letter" },
};

export const SHEET_PADDING = "48px 53px";

export function Sheet({
  resume,
  className = "",
  children,
  style,
}: {
  resume: Resume;
  className?: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const theme = resume.theme;
  const pair = FONT_PAIRS.find((f) => f.key === theme?.fontPair) ?? FONT_PAIRS[0];
  const page = PAGE_DIMS[theme?.pageSize] ?? PAGE_DIMS.a4;
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);
  const vars = {
    "--accent": theme?.accent ?? "#1d2130",
    "--font-display": theme?.atsSafe ? pair.ats : pair.display,
    "--font-body": theme?.atsSafe ? pair.ats : pair.body,
    "--ink": "#1d2130",
    "--page-w": page.cssWidth,
    "--page-h": page.cssHeight,
  } as CSSProperties;
  const density = theme?.density ?? "comfortable";
  const ats = theme?.atsSafe ? "true" : "false";

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const measure = () => {
      const avail = outer.clientHeight;
      const need = inner.scrollHeight;
      if (!avail || !need) return;
      const next = need > avail + 2 ? avail / need : 1;
      setFit((prev) => (Math.abs(prev - next) < 0.003 ? prev : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [resume, className, page.cssHeight]);

  return (
    <div
      ref={outerRef}
      className="resume-sheet"
      data-density={density}
      data-ats={ats}
      data-page={theme?.pageSize ?? "a4"}
      style={{
        ...vars,
        width: page.cssWidth,
        maxWidth: page.cssWidth,
        height: page.cssHeight,
        minHeight: page.cssHeight,
        maxHeight: page.cssHeight,
        overflow: "hidden",
        padding: 0,
      }}
    >
      <div
        ref={innerRef}
        className={`resume-sheet-fit ${className}`}
        data-density={density}
        data-ats={ats}
        style={{
          padding: SHEET_PADDING,
          width: "100%",
          minHeight: "100%",
          transform: fit < 0.999 ? `scale(${fit})` : undefined,
          transformOrigin: "top left",
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function SectionHead({ label }: { label: string }) {
  return <h2 className="sheet-section-head">{label}</h2>;
}

export function Bullets({ items, className = "sheet-bullets" }: { items: string[]; className?: string }) {
  const clean = (items ?? []).map((b) => t(b)).filter(Boolean);
  if (clean.length === 0) return null;
  return (
    <ul className={className}>
      {clean.map((b, i) => (
        <li key={i}>{b}</li>
      ))}
    </ul>
  );
}

export function Dates({ start, end, present }: { start: string; end: string; present: boolean }) {
  return <>{formatRange(start, end, present)}</>;
}

export function initialsOf(name?: string): string {
  const parts = t(name).split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function safeContact(resume: Resume): Resume["contact"] {
  const c = resume?.contact;
  return {
    fullName: t(c?.fullName),
    title: t(c?.title),
    phone: t(c?.phone),
    email: t(c?.email),
    city: t(c?.city),
    country: t(c?.country),
    linkedin: t(c?.linkedin),
    website: t(c?.website),
    github: t(c?.github),
    portfolioUrl: t(c?.portfolioUrl),
    photoUrl: t(c?.photoUrl),
  };
}

export function contactParts(resume: Resume): string[] {
  const c = safeContact(resume);
  const parts: string[] = [];
  if (t(c.phone)) parts.push(t(c.phone));
  if (t(c.email)) parts.push(t(c.email));
  const loc = [t(c.city), t(c.country)].filter(Boolean).join(", ");
  if (loc) parts.push(loc);
  if (t(c.linkedin)) parts.push(cleanUrl(c.linkedin));
  if (t(c.github)) parts.push(cleanUrl(c.github));
  if (t(c.website)) parts.push(cleanUrl(c.website));
  return parts;
}

export function headingFor(section: string, resume: Resume): string {
  const type = resume.meta?.type;
  switch (section) {
    case "summary":
      return type === "executive" ? "Executive Summary" : "Professional Summary";
    case "objective":
      return "Objective";
    case "experience":
      return type === "functional" ? "Work History" : "Work Experience";
    case "skills":
      return type === "functional" ? "Core Skills" : "Skills";
    case "education":
      return type === "cv" ? "Education & Training" : "Education";
    case "projects":
      return "Projects";
    case "certifications":
      return "Certifications";
    case "languages":
      return "Languages";
    case "volunteer":
      return type === "entry-level" ? "Leadership & Volunteer" : "Volunteer Experience";
    case "publications":
      return "Publications";
    case "awards":
      return "Awards & Honors";
    case "teaching":
      return "Teaching Experience";
    case "grants":
      return "Grants & Fellowships";
    case "presentations":
      return "Conference Presentations";
    case "affiliations":
      return "Professional Affiliations";
    case "references":
      return "References";
    case "portfolio":
      return "Portfolio";
    default:
      return section;
  }
}

export function shouldRender(section: string, resume: Resume): boolean {
  switch (section) {
    case "summary":
      return t(resume.summary).length > 0;
    case "objective":
      return t(resume.objective).length > 0;
    case "experience":
      return (resume.experience ?? []).length > 0;
    case "education":
      return (resume.education ?? []).length > 0;
    case "skills":
      return (resume.skills ?? []).some((g) => Array.isArray(g?.skills) && g.skills.length > 0);
    case "projects":
      return (resume.projects ?? []).length > 0;
    case "certifications":
      return (resume.certifications ?? []).length > 0;
    case "languages":
      return (resume.languages ?? []).length > 0;
    case "volunteer":
      return (resume.volunteer ?? []).length > 0;
    case "publications":
      return (resume.publications ?? []).length > 0;
    case "awards":
      return (resume.awards ?? []).length > 0;
    case "teaching":
      return (resume.teaching ?? []).length > 0;
    case "grants":
      return (resume.grants ?? []).length > 0;
    case "presentations":
      return (resume.presentations ?? []).length > 0;
    case "affiliations":
      return (resume.affiliations ?? []).length > 0;
    case "references":
      return (resume.references ?? []).length > 0;
    case "portfolio":
      return t(resume.contact?.portfolioUrl).length > 0;
    default:
      return true;
  }
}

export function effectiveSections(resume: Resume): string[] {
  const def = getResumeType(resume.meta?.type);
  let order = resume.sectionOrder?.length ? resume.sectionOrder : def.structure.map((s) => s.toLowerCase().replace(/\s+/g, "_"));
  order = order.filter((s) => s !== "contact");
  const summaryKey = resume.useObjective ? "objective" : "summary";
  order = order.map((s) => (s === "summary" ? summaryKey : s === "objective" ? summaryKey : s));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of order) {
    if (s === "contact") continue;
    if (seen.has(s)) continue;
    seen.add(s);
    if (!resume.visibility?.[s as keyof typeof resume.visibility] && s !== "summary" && s !== "objective") continue;
    if (!shouldRender(s, resume)) continue;
    out.push(s);
  }
  return out;
}

export function citePublication(p: { title: string; venue: string; year: string; authors: string }, format: string): string {
  const title = t(p.title);
  const v = t(p.venue);
  const y = t(p.year);
  const a = t(p.authors);
  switch (format) {
    case "mla":
      return `${a ? a + ". " : ""}${title ? `\u201c${title}.\u201d ` : ""}${v}${y ? ", " + y : ""}.`;
    case "chicago":
      return `${a ? a + ". " : ""}${title ? `\u201c${title}.\u201d ` : ""}${v}${y ? " (" + y + ")" : ""}.`;
    case "apa":
    default:
      return `${a ? a + " " : ""}(${y || "n.d."}). ${title}. ${v}.`;
  }
}

export function ExperienceBlock({
  entry,
  showBullets = true,
  classic = true,
}: {
  entry: ExperienceEntry | VolunteerEntry | TeachingEntry;
  showBullets?: boolean;
  classic?: boolean;
}) {
  if (classic) {
    return (
      <div className="sheet-entry c-exp">
        <div className="c-entry-head">
          <span className="c-role">{"role" in entry && entry.role ? entry.role : "title" in entry && entry.title ? entry.title : "course" in entry ? entry.course : ""}</span>
          <span className="c-dates">
            <Dates start={entry.startDate} end={entry.endDate} present={"present" in entry ? entry.present : false} />
          </span>
        </div>
        <div className="c-org">
          <strong>
            {"company" in entry ? entry.company : "institution" in entry ? entry.institution : "org" in entry ? entry.org : ""}
          </strong>
          {"location" in entry && entry.location ? <span className="c-loc">{entry.location}</span> : null}
        </div>
        {showBullets && "bullets" in entry ? <Bullets items={(entry as { bullets: string[] }).bullets} /> : null}
      </div>
    );
  }
  return null;
}
