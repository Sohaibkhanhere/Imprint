import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Eye, EyeOff, GripVertical } from "lucide-react";
import { useResume } from "../../store/resumeStore";
import { Collapse } from "../ui";
import type { SectionKey, VisibilityKey } from "../../lib/types";
import { ContactForm } from "./Contact";
import { SummaryForm, PortfolioForm, SkillsForm } from "./Basic";
import { ExperienceForm, VolunteerForm, TeachingForm } from "./Experience";
import { EducationForm, ProjectsForm, CertificationsForm, LanguagesForm, PublicationsForm, AwardsForm, GrantsForm, PresentationsForm, AffiliationsForm, ReferencesForm } from "./Education";

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
};

function isOptional(s: SectionKey): s is VisibilityKey {
  return s !== "contact";
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
      default:
        return null;
    }
  };

  return (
    <div ref={rootRef} className="space-y-5">
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <div>
          <p className="folio text-stone-500">Your copy</p>
          <p className="mt-0.5 text-xs text-stone-500">Every field updates the proof live.</p>
        </div>
      </div>

      {visibleOrder.map((key) => {
        const meta = SECTION_META[key];
        const num = String(visibleOrder.indexOf(key) + 1).padStart(2, "0");
        return (
          <div key={key} data-key={key} className={`contents-entry${active === key ? " contents-active" : ""}`}>
            <div className="flex items-center gap-2 border-b border-stone-200/80 pb-1.5">
              <span className="contents-number">{num}</span>
              <GripVertical size={13} className="text-stone-300" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-600">{meta.label}</span>
              <span className="ml-auto flex items-center gap-0.5">
                {order.indexOf(key) > 0 ? (
                  <button type="button" onClick={() => move(key, -1)} className="rounded-sm px-1.5 py-0.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900" title="Move earlier in the issue"><ChevronUp size={14} /></button>
                ) : null}
                {order.indexOf(key) < order.length - 1 ? (
                  <button type="button" onClick={() => move(key, 1)} className="rounded-sm px-1.5 py-0.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900" title="Move later in the issue"><ChevronDown size={14} /></button>
                ) : null}
                {isOptional(key) ? (
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "SET_VISIBILITY", key, visible: false })}
                    className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                    title="Hide section"
                  >
                    <EyeOff size={12} /> Hide
                  </button>
                ) : null}
              </span>
            </div>
            <Collapse title="" defaultOpen>
              <div className="p-0 pt-2">{renderSection(key)}</div>
            </Collapse>
          </div>
        );
      })}

      <Collapse title="Held copy" subtitle="tap to show" defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {order
            .filter((k) => isOptional(k) && resume.visibility?.[k] === false && SECTION_META[k])
            .map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => dispatch({ type: "SET_VISIBILITY", key: k as VisibilityKey, visible: true })}
                className="inline-flex items-center gap-1.5 rounded-sm border border-dashed border-stone-300 px-2.5 py-1.5 text-xs font-medium text-stone-600 transition hover:border-stone-900 hover:text-stone-900"
              >
                <Eye size={13} /> {SECTION_META[k].label}
              </button>
            ))}
          {order.filter((k) => isOptional(k) && resume.visibility?.[k] === false).length === 0 ? (
            <p className="text-xs text-stone-500">No sections hidden.</p>
          ) : null}
        </div>
      </Collapse>
    </div>
  );
}
