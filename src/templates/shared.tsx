import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Resume, ExperienceEntry, VolunteerEntry, TeachingEntry, PageSize } from "../lib/types";
import { FONT_PAIRS } from "../lib/sampleData";
import { formatRange } from "../lib/date";
import { getResumeType } from "../lib/resumeTypes";
import { t } from "../lib/safe";
import { sanitizeAccent } from "../lib/sanitize";
import { contactItems, safeHref, type ContactItem } from "../lib/href";
import { marginsForTheme, sheetPaddingCss, sheetPadVars, sheetPaddingX } from "../lib/pageLayout";
import { computePageOffsets, offsetsEqual, paginateClassName, PAGE_STACK_GAP } from "./paginate";

export const PAGE_DIMS: Record<PageSize, { width: number; height: number; cssWidth: string; cssHeight: string; label: string }> = {
  a4: { width: 793.7, height: 1122.5, cssWidth: "210mm", cssHeight: "297mm", label: "A4" },
  letter: { width: 816, height: 1056, cssWidth: "8.5in", cssHeight: "11in", label: "Letter" },
};

function sheetVars(resume: Resume, page: (typeof PAGE_DIMS)[PageSize]): CSSProperties {
  const theme = resume.theme;
  const pair = FONT_PAIRS.find((f) => f.key === theme?.fontPair) ?? FONT_PAIRS[0];
  const margins = marginsForTheme(theme);
  return {
    "--accent": sanitizeAccent(theme?.accent, "#1d2130"),
    "--font-display": theme?.atsSafe ? pair.ats : pair.display,
    "--font-body": theme?.atsSafe ? pair.ats : pair.body,
    "--ink": "#1d2130",
    "--page-w": page.cssWidth,
    "--page-h": page.cssHeight,
    ...sheetPadVars(margins),
  } as CSSProperties;
}

function FitSheet({
  resume,
  className,
  children,
  style,
  page,
  vars,
  density,
  ats,
  pagePad,
}: {
  resume: Resume;
  className: string;
  children: ReactNode;
  style?: CSSProperties;
  page: (typeof PAGE_DIMS)[PageSize];
  vars: CSSProperties;
  density: string;
  ats: string;
  pagePad: string;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const measure = () => {
      const avail = outer.clientHeight;
      if (!avail) return;
      const prevTransform = inner.style.transform;
      const prevWidth = inner.style.width;
      const prevHeight = inner.style.height;
      const prevMinHeight = inner.style.minHeight;
      inner.style.transform = "none";
      inner.style.width = "100%";
      inner.style.height = "auto";
      inner.style.minHeight = "0";
      const need = inner.scrollHeight;
      inner.style.transform = prevTransform;
      inner.style.width = prevWidth;
      inner.style.height = prevHeight;
      inner.style.minHeight = prevMinHeight;
      if (!need) return;
      const raw = need > avail + 2 ? avail / need : 1;
      const next = raw < 0.55 ? 1 : raw;
      setFit((prev) => (Math.abs(prev - next) < 0.003 ? prev : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [resume, className, page.cssHeight, pagePad]);

  return (
    <div
      ref={outerRef}
      className="resume-sheet"
      data-density={density}
      data-ats={ats}
      data-page={resume.theme?.pageSize ?? "a4"}
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
          padding: pagePad,
          width: fit < 0.999 ? `${100 / fit}%` : "100%",
          height: fit < 0.999 ? `${100 / fit}%` : "100%",
          minHeight: fit < 0.999 ? 0 : "100%",
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

function PagedSheet({
  resume,
  className,
  children,
  style,
  page,
  vars,
  density,
  ats,
  pagePad,
}: {
  resume: Resume;
  className: string;
  children: ReactNode;
  style?: CSSProperties;
  page: (typeof PAGE_DIMS)[PageSize];
  vars: CSSProperties;
  density: string;
  ats: string;
  pagePad: string;
}) {
  const measureRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);
  const [offsets, setOffsets] = useState<number[]>([0]);
  const [avail, setAvail] = useState(0);
  const maxPages = resume.theme?.maxPages ?? 1;

  useLayoutEffect(() => {
    const content = measureRef.current;
    const probe = probeRef.current;
    if (!content || !probe) return;
    const measure = () => {
      const cs = getComputedStyle(probe);
      const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      const nextAvail = probe.clientHeight - padY;
      if (!nextAvail || nextAvail < 32) return;
      setAvail((prev) => (Math.abs(prev - nextAvail) < 1 ? prev : nextAvail));
      const next = computePageOffsets(content, nextAvail);
      setOffsets((prev) => (offsetsEqual(prev, next) ? prev : next));
    };
    measure();
    void document.fonts.ready.then(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(content);
    ro.observe(probe);
    return () => ro.disconnect();
  }, [resume, className, page.cssHeight, pagePad]);

  const pageStyle: CSSProperties = {
    ...vars,
    width: page.cssWidth,
    maxWidth: page.cssWidth,
    height: page.cssHeight,
    minHeight: page.cssHeight,
    maxHeight: page.cssHeight,
    overflow: "hidden",
    padding: 0,
  };

  return (
    <div
      className="resume-folio-stack"
      data-page-count={offsets.length}
      data-max-pages={maxPages}
      data-over-limit={offsets.length > maxPages ? "true" : "false"}
      style={{ gap: PAGE_STACK_GAP }}
    >
      <div
        className="resume-sheet resume-sheet-measure"
        data-density={density}
        data-ats={ats}
        data-page={resume.theme?.pageSize ?? "a4"}
        aria-hidden="true"
        style={{
          ...pageStyle,
          height: "auto",
          minHeight: 0,
          maxHeight: "none",
          overflow: "visible",
        }}
      >
        <div
          className={`resume-sheet-fit ${className}`}
          data-density={density}
          data-ats={ats}
          style={{
            padding: sheetPaddingX(marginsForTheme(resume.theme)),
            height: "auto",
            minHeight: 0,
            overflow: "visible",
            ...style,
          }}
        >
          <div ref={measureRef} className="resume-page-window">
            {children}
          </div>
        </div>
      </div>

      {offsets.map((offset, i) => (
        <div
          key={`page-${i}-${offset}`}
          className="resume-sheet resume-sheet-paged"
          data-density={density}
          data-ats={ats}
          data-page={resume.theme?.pageSize ?? "a4"}
          data-page-index={i + 1}
          style={pageStyle}
        >
          <div
            ref={i === 0 ? probeRef : undefined}
            className={`resume-sheet-fit ${className}`}
            data-density={density}
            data-ats={ats}
            style={{
              padding: pagePad,
              width: "100%",
              height: "100%",
              minHeight: "100%",
              overflow: "hidden",
              ...style,
            }}
          >
            <div
              className="resume-page-clip"
              style={{
                height: offsets[i + 1] != null ? Math.max(0, offsets[i + 1] - offset) : avail || "100%",
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              <div className="resume-page-window" style={{ transform: `translateY(-${offset}px)` }}>
                {children}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

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
  const page = PAGE_DIMS[theme?.pageSize] ?? PAGE_DIMS.a4;
  const vars = sheetVars(resume, page);
  const density = theme?.density ?? "comfortable";
  const ats = theme?.atsSafe ? "true" : "false";
  const pagePad = sheetPaddingCss(marginsForTheme(theme));
  const shared = { resume, className, children, style, page, vars, density, ats, pagePad };

  if (paginateClassName(className)) {
    return <PagedSheet {...shared} />;
  }
  return <FitSheet {...shared} />;
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
  return contactItems(safeContact(resume)).map((item) => item.text);
}

export function SheetHref({ href, children }: { href?: string; children: ReactNode }) {
  const safe = href ? safeHref(href) : null;
  if (!safe) return <>{children}</>;
  return (
    <a href={safe} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export function ContactLine({
  resume,
  sep = "  ·  ",
  className,
  as: Tag = "p",
  spanParts = false,
}: {
  resume: Resume;
  sep?: string;
  className?: string;
  as?: "p" | "div";
  spanParts?: boolean;
}) {
  const items = contactItems(safeContact(resume));
  if (!items.length) return null;
  const mark = (item: ContactItem) =>
    item.href ? (
      <a href={item.href} target="_blank" rel="noopener noreferrer">
        {item.text}
      </a>
    ) : (
      item.text
    );
  if (spanParts) {
    return (
      <Tag className={className}>
        {items.map((item, i) => (
          <span key={`${item.text}-${i}`}>{mark(item)}</span>
        ))}
      </Tag>
    );
  }
  return (
    <Tag className={className}>
      {items.map((item, i) => (
        <span key={`${item.text}-${i}`}>
          {i > 0 ? sep : null}
          {mark(item)}
        </span>
      ))}
    </Tag>
  );
}

export function markContact(item: ContactItem): ReactNode {
  return item.href ? (
    <a href={item.href} target="_blank" rel="noopener noreferrer">
      {item.text}
    </a>
  ) : (
    item.text
  );
}

export function ContactList({
  resume,
  itemClass,
  as: Tag = "div",
}: {
  resume: Resume;
  itemClass: string;
  as?: "div" | "span";
}) {
  const items = contactItems(safeContact(resume));
  if (!items.length) return null;
  return (
    <>
      {items.map((item, i) => (
        <Tag key={`${item.text}-${i}`} className={itemClass}>
          {markContact(item)}
        </Tag>
      ))}
    </>
  );
}

export function ExtraDetails({ resume }: { resume: Resume }) {
  const rows = (resume.extras ?? []).filter((d) => t(d.label) && t(d.value));
  if (!rows.length) return null;
  return (
    <div className="t-extras">
      {rows.map((d) => (
        <div key={d.id} className="t-extra-row">
          <span className="t-extra-k">{d.label}</span>
          <span className="t-extra-v">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

export function headingFor(section: string, resume: Resume): string {
  const type = resume.meta?.type;
  const ats = Boolean(resume.theme?.atsSafe);
  switch (section) {
    case "summary":
      if (ats) return "Professional Summary";
      return type === "executive" ? "Executive Summary" : "Professional Summary";
    case "objective":
      return "Objective";
    case "experience":
      return ats ? "Work Experience" : type === "functional" ? "Work History" : "Work Experience";
    case "skills":
      return ats ? "Skills" : type === "functional" ? "Core Skills" : "Skills";
    case "education":
      return ats ? "Education" : type === "cv" ? "Education & Training" : "Education";
    case "projects":
      return "Projects";
    case "certifications":
      return "Certifications";
    case "languages":
      return "Languages";
    case "volunteer":
      return ats ? "Volunteer Experience" : type === "entry-level" ? "Leadership & Volunteer" : "Volunteer Experience";
    case "publications":
      return "Publications";
    case "awards":
      return ats ? "Awards" : "Awards & Honors";
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
    case "extras":
      return "Personal Details";
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
    case "extras":
      return (resume.extras ?? []).some((d) => t(d.label) && t(d.value));
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
