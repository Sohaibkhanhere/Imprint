import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { useResume } from "../../store/resumeStore";
import { Collapse } from "../ui";
import type { SectionKey, VisibilityKey } from "../../lib/types";
import { focusContentsSection, PREVIEW_FOCUS_EVENT } from "../PreviewInteract";
import { ContactForm } from "./Contact";
import { SummaryForm, PortfolioForm, SkillsForm } from "./Basic";
import { ExperienceForm, VolunteerForm, TeachingForm } from "./Experience";
import { EducationForm, ProjectsForm, CertificationsForm, LanguagesForm, PublicationsForm, AwardsForm, GrantsForm, PresentationsForm, AffiliationsForm, ReferencesForm } from "./Education";
import { CustomDetailsForm } from "./CustomDetails";

export const SECTION_META: Record<SectionKey, { label: string; hint: string }> = {
  contact: { label: "Contact & Header", hint: "Name, title, phone, email, location, links" },
  summary: { label: "Summary", hint: "2–4 sentence professional summary" },
  objective: { label: "Objective", hint: "1–2 sentences for entry-level" },
  experience: { label: "Work Experience", hint: "Reverse-chronological, achievement bullets" },
  education: { label: "Education", hint: "Degrees, most recent first" },
  skills: { label: "Skills", hint: "Skill names only, like tags" },
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

const SHORT_LABEL: Record<SectionKey, string> = {
  contact: "Contact",
  summary: "Summary",
  objective: "Objective",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certs",
  languages: "Languages",
  volunteer: "Volunteer",
  publications: "Papers",
  awards: "Awards",
  teaching: "Teaching",
  grants: "Grants",
  presentations: "Talks",
  affiliations: "Societies",
  references: "Refs",
  portfolio: "Portfolio",
  extras: "Details",
};

function isOptional(s: SectionKey): s is VisibilityKey {
  return s !== "contact";
}

export function FormPanel() {
  const { resume, dispatch } = useResume();
  const order = resume.sectionOrder;
  const editorRef = useRef<HTMLDivElement>(null);
  const [openKey, setOpenKey] = useState<SectionKey>("contact");

  const isHidden = (key: SectionKey) => {
    if (!isOptional(key)) return false;
    return resume.visibility?.[key] === false;
  };

  const baseOrder: SectionKey[] = resume.sectionOrder.includes("contact") ? resume.sectionOrder : ["contact", ...resume.sectionOrder];
  const visibleOrder = baseOrder.filter((k) => !isHidden(k) && SECTION_META[k]);
  const current = visibleOrder.includes(openKey) ? openKey : (visibleOrder[0] ?? "contact");

  const scrollEditor = () => {
    const editor = editorRef.current;
    const aside = editor?.closest("aside");
    const chrome = aside?.querySelector<HTMLElement>(".contents-chrome");
    if (!editor || !aside) return;
    const gap = (chrome?.getBoundingClientRect().height ?? 0) + 8;
    const next = aside.scrollTop + (editor.getBoundingClientRect().top - aside.getBoundingClientRect().top) - gap;
    aside.scrollTo({ top: Math.max(0, next), behavior: "smooth" });
  };

  useEffect(() => {
    const onFocus = (e: Event) => {
      const key = (e as CustomEvent<SectionKey>).detail;
      if (!key || !SECTION_META[key]) return;
      setOpenKey(key);
      requestAnimationFrame(scrollEditor);
    };
    window.addEventListener(PREVIEW_FOCUS_EVENT, onFocus);
    return () => window.removeEventListener(PREVIEW_FOCUS_EVENT, onFocus);
  }, []);

  const jump = (key: SectionKey) => {
    setOpenKey(key);
    focusContentsSection(key);
  };

  const move = (key: SectionKey, dir: -1 | 1) => {
    const idx = visibleOrder.indexOf(key);
    const to = idx + dir;
    if (idx < 0 || to < 0 || to >= visibleOrder.length) return;
    const next = [...order];
    const from = next.indexOf(key);
    const swap = next.indexOf(visibleOrder[to]);
    if (from < 0 || swap < 0) return;
    [next[from], next[swap]] = [next[swap], next[from]];
    dispatch({ type: "SET_ORDER", order: next });
  };

  const renderSection = (key: SectionKey): ReactNode => {
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
  const meta = SECTION_META[current];

  const visIdx = visibleOrder.indexOf(current);
  const canUp = visIdx > 0;
  const canDown = visIdx >= 0 && visIdx < visibleOrder.length - 1;

  return (
    <div>
      <div className="contents-chrome">
        <div className="flex items-end justify-between gap-3">
          <h2 className="qd-wordmark text-[22px] leading-none">Contents</h2>
          <p className="folio text-stone-500">{String(visibleOrder.length).padStart(2, "0")}</p>
        </div>
        <nav className="contents-index" aria-label="Jump to section">
          {visibleOrder.map((key) => (
            <button
              key={key}
              type="button"
              className={`contents-jump${key === current ? " is-on" : ""}`}
              aria-current={key === current ? "page" : undefined}
              onClick={() => jump(key)}
            >
              {SHORT_LABEL[key] ?? SECTION_META[key].label}
            </button>
          ))}
        </nav>
      </div>

      <div ref={editorRef} className="contents-editor">
        <div className="contents-kicker">
          <span className="contents-number">{String(Math.max(1, visIdx + 1)).padStart(2, "0")}</span>
          <span className="min-w-0 truncate">{meta.label}</span>
          <span className="ml-auto flex shrink-0 items-center">
            {canUp ? (
              <button type="button" onClick={() => move(current, -1)} className="rounded-md px-1.5 py-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-900" title="Move section up">
                <ChevronUp size={14} />
              </button>
            ) : null}
            {canDown ? (
              <button type="button" onClick={() => move(current, 1)} className="rounded-md px-1.5 py-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-900" title="Move section down">
                <ChevronDown size={14} />
              </button>
            ) : null}
            {isOptional(current) ? (
              <button
                type="button"
                onClick={() => dispatch({ type: "SET_VISIBILITY", key: current, visible: false })}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-stone-400 transition hover:bg-stone-100 hover:text-stone-800"
                title="Hide section"
              >
                <EyeOff size={12} /> Hide
              </button>
            ) : null}
          </span>
        </div>
        <p className="contents-hint">{meta.hint}</p>
        {renderSection(current)}
      </div>

      <div className="px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-4">
        <Collapse title="Hidden sections" subtitle="tap to show" defaultOpen={false}>
          <div className="flex flex-wrap gap-2">
            {hidden.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  dispatch({ type: "SET_VISIBILITY", key: k as VisibilityKey, visible: true });
                  setOpenKey(k);
                  requestAnimationFrame(() => focusContentsSection(k));
                }}
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
