import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { useResume } from "../../store/resumeStore";
import { Collapse } from "../ui";
import type { SectionKey, VisibilityKey } from "../../lib/types";
import { PREVIEW_FOCUS_EVENT } from "../PreviewInteract";
import { ContactForm } from "./Contact";
import { SummaryForm, PortfolioForm, SkillsForm } from "./Basic";
import { ExperienceForm, VolunteerForm, TeachingForm } from "./Experience";
import { EducationForm, ProjectsForm, CertificationsForm, LanguagesForm, PublicationsForm, AwardsForm, GrantsForm, PresentationsForm, AffiliationsForm, ReferencesForm } from "./Education";
import { CustomDetailsForm } from "./CustomDetails";

const SECTION_META: Record<SectionKey, { label: string; hint: string }> = {
  contact: { label: "Contact & Header", hint: "Name, title, phone, email, location, links" },
  summary: { label: "Summary", hint: "2–4 sentence professional summary" },
  objective: { label: "Objective", hint: "1–2 sentences for entry-level" },
  experience: { label: "Work Experience", hint: "Reverse-chronological, achievement bullets" },
  education: { label: "Education", hint: "Degrees, most recent first" },
  skills: { label: "Skills", hint: "Tag-style, grouped" },
  projects: { label: "Projects", hint: "Optional but powerful for tech & grads" },
  certifications: { label: "Certifications", hint: "Relevant and current only" },
  languages: { label: "Languages", hint: "With fluency levels" },
  volunteer: { label: "Volunteer Experience", hint: "Same bullet formula as work" },
  publications: { label: "Publications", hint: "Academic citations" },
  awards: { label: "Awards & Honors", hint: "2–4 most relevant" },
  teaching: { label: "Teaching Experience", hint: "For academic CVs" },
  grants: { label: "Grants & Fellowships", hint: "Funded research" },
  presentations: { label: "Conference Presentations", hint: "Talks, posters, seminars" },
  affiliations: { label: "Professional Affiliations", hint: "Memberships & societies" },
  references: { label: "References", hint: "Named references only" },
  portfolio: { label: "Portfolio", hint: "Prominent links for creative roles" },
  extras: { label: "Personal details", hint: "Date of birth, father name, CNIC, or any field you add" },
};

function isOptional(s: SectionKey): s is VisibilityKey {
  return s !== "contact";
}

function ContentsSection({
  sectionKey,
  num,
  label,
  hint,
  active,
  canUp,
  canDown,
  onUp,
  onDown,
  onHide,
  children,
}: {
  sectionKey: SectionKey;
  num: string;
  label: string;
  hint: string;
  active: boolean;
  canUp: boolean;
  canDown: boolean;
  onUp: () => void;
  onDown: () => void;
  onHide?: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const onFocus = (e: Event) => {
      const key = (e as CustomEvent<SectionKey>).detail;
      if (key !== sectionKey) return;
      setOpen(true);
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>(`[data-key="${sectionKey}"]`)?.scrollIntoView({ block: "start", behavior: "smooth" });
      });
    };
    window.addEventListener(PREVIEW_FOCUS_EVENT, onFocus);
    return () => window.removeEventListener(PREVIEW_FOCUS_EVENT, onFocus);
  }, [sectionKey]);
  return (
    <section data-key={sectionKey} className={`contents-entry${active ? " contents-active" : ""}`}>
      <div className="contents-head">
        <button type="button" className="contents-head-main" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <span className="contents-number">{num}</span>
          <span className="contents-label truncate">{label}</span>
          <ChevronDown size={15} className={`desk-chevron${open ? " is-open" : ""}`} />
        </button>
        <span className="ml-auto flex shrink-0 items-center">
          {canUp ? (
            <button type="button" onClick={onUp} className="rounded-md px-1.5 py-1 text-stone-400 transition-[color,background-color,transform] duration-150 hover:bg-stone-100 hover:text-stone-900 active:scale-95" title="Move section up">
              <ChevronUp size={14} />
            </button>
          ) : null}
          {canDown ? (
            <button type="button" onClick={onDown} className="rounded-md px-1.5 py-1 text-stone-400 transition-[color,background-color,transform] duration-150 hover:bg-stone-100 hover:text-stone-900 active:scale-95" title="Move section down">
              <ChevronDown size={14} />
            </button>
          ) : null}
          {onHide ? (
            <button
              type="button"
              onClick={onHide}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-stone-400 transition-[color,background-color] duration-150 hover:bg-stone-100 hover:text-stone-800"
              title="Hide section"
            >
              <EyeOff size={12} /> Hide
            </button>
          ) : null}
        </span>
      </div>
      <div className={`desk-fold${open ? " is-open" : ""}`}>
        <div className="desk-fold-inner">
          <p className="contents-hint">{hint}</p>
          {children}
        </div>
      </div>
    </section>
  );
}

export function FormPanel() {
  const { resume, dispatch } = useResume();
  const order = resume.sectionOrder;
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<SectionKey | null>(null);

  const isHidden = (key: SectionKey) => {
    if (!isOptional(key)) return false;
    return resume.visibility?.[key] === false;
  };

  const baseOrder: SectionKey[] = resume.sectionOrder.includes("contact") ? resume.sectionOrder : ["contact", ...resume.sectionOrder];
  const visibleOrder = baseOrder.filter((k) => !isHidden(k) && SECTION_META[k]);
  const visibleKey = visibleOrder.join(",");

  useEffect(() => {
    const rootEl = rootRef.current;
    if (!rootEl) return;
    let root: HTMLElement | null = rootEl;
    while (root && root.scrollHeight <= root.clientHeight + 1) root = root.parentElement;
    const entries = Array.from(rootEl.querySelectorAll<HTMLElement>(".contents-entry"));
    const obs = new IntersectionObserver(
      (obsEntries) => {
        let best: HTMLElement | null = null;
        let bestTop = Infinity;
        for (const e of obsEntries) {
          if (!e.isIntersecting) continue;
          const top = e.boundingClientRect.top;
          if (top < bestTop) {
            bestTop = top;
            best = e.target as HTMLElement;
          }
        }
        setActive((best?.dataset.key as SectionKey | undefined) ?? null);
      },
      { root, rootMargin: "0px 0px -55% 0px", threshold: [0, 0.5, 1] }
    );
    entries.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [visibleKey]);

  const move = (key: SectionKey, dir: -1 | 1) => {
    const idx = order.indexOf(key);
    const to = idx + dir;
    if (idx < 0 || to < 0 || to >= order.length) return;
    const next = [...order];
    const [k] = next.splice(idx, 1);
    next.splice(to, 0, k);
    dispatch({ type: "SET_ORDER", order: next });
  };

  const renderSection = (key: SectionKey) => {
    switch (key) {
      case "contact":
        return <ContactForm />;
      case "summary":
        return <SummaryForm />;
      case "objective":
        return <SummaryForm />;
      case "experience":
        return <ExperienceForm />;
      case "education":
        return <EducationForm />;
      case "skills":
        return <SkillsForm />;
      case "projects":
        return <ProjectsForm />;
      case "certifications":
        return <CertificationsForm />;
      case "languages":
        return <LanguagesForm />;
      case "volunteer":
        return <VolunteerForm />;
      case "publications":
        return <PublicationsForm />;
      case "awards":
        return <AwardsForm />;
      case "teaching":
        return <TeachingForm />;
      case "grants":
        return <GrantsForm />;
      case "presentations":
        return <PresentationsForm />;
      case "affiliations":
        return <AffiliationsForm />;
      case "references":
        return <ReferencesForm />;
      case "portfolio":
        return <PortfolioForm />;
      case "extras":
        return <CustomDetailsForm />;
      default:
        return null;
    }
  };

  const hidden = order.filter((k) => isOptional(k) && resume.visibility?.[k] === false && SECTION_META[k]);

  return (
    <div ref={rootRef} className="space-y-1">
      {visibleOrder.map((key) => {
        const meta = SECTION_META[key];
        const num = String(visibleOrder.indexOf(key) + 1).padStart(2, "0");
        const idx = order.indexOf(key);
        return (
          <ContentsSection
            key={key}
            sectionKey={key}
            num={num}
            label={meta.label}
            hint={meta.hint}
            active={active === key}
            canUp={idx > 0}
            canDown={idx >= 0 && idx < order.length - 1}
            onUp={() => move(key, -1)}
            onDown={() => move(key, 1)}
            onHide={isOptional(key) ? () => dispatch({ type: "SET_VISIBILITY", key, visible: false }) : undefined}
          >
            {renderSection(key)}
          </ContentsSection>
        );
      })}

      <div className="pt-3">
        <Collapse title="Hidden sections" subtitle="tap to show" defaultOpen={false}>
          <div className="flex flex-wrap gap-2">
            {hidden.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => dispatch({ type: "SET_VISIBILITY", key: k as VisibilityKey, visible: true })}
                className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-medium text-stone-600 transition-[border-color,color,transform] duration-150 hover:border-stone-900 hover:text-stone-900 active:scale-[0.98]"
              >
                <Eye size={13} /> {SECTION_META[k].label}
              </button>
            ))}
            {hidden.length === 0 ? <p className="text-xs text-stone-500">No sections hidden.</p> : null}
          </div>
        </Collapse>
      </div>
    </div>
  );
}
