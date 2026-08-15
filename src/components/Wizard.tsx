import { useMemo, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { BrandMark } from "./BrandMark";
import { useResume } from "../store/resumeStore";
import { RESUME_TYPES, getResumeType, INDUSTRY_PRESETS } from "../lib/resumeTypes";
import type { IndustryKey } from "../lib/resumeTypes";
import type { ResumeTypeKey } from "../lib/types";

const INDUSTRY_HINTS: Record<IndustryKey, string> = {
  tech: "Emphasize tech stack, GitHub, system scale, latency/uptime wins",
  sales: "Lead every bullet with numbers: quota %, revenue, deal size",
  marketing: "Campaign metrics: CTR, conversion, ROAS, reach, tools used",
  finance: "Certifications prominent (CFA/CPA), $ figures managed, compliance",
  healthcare: "Licensure near the top, patient-outcome framing, clinical hours",
  education: "Certifications, grades/subjects taught, measurable student outcomes",
  trades: "Licenses/certs prominent, safety record, equipment expertise",
  service: "Volume handled, satisfaction scores, resolution time, process wins",
  legal: "Bar admission, practice areas, case types, notable matters",
  nonprofit: "Program impact, funds raised, community reach, grant writing",
};

export function TypeWizard({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const { resume, dispatch } = useResume();
  const [selected, setSelected] = useState<ResumeTypeKey>(resume.meta.type);
  const [industry, setIndustry] = useState<IndustryKey | "">("");

  const def = useMemo(() => getResumeType(selected), [selected]);

  const choose = () => {
    dispatch({ type: "SET_TYPE", value: selected });
    if (industry) dispatch({ type: "APPLY_INDUSTRY", value: industry });
    onDone();
  };

  return (
    <div className="no-print fixed inset-0 z-50 overflow-y-auto bg-stone-100">
      <div className="masthead-rule" />
      <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-end justify-between border-b border-stone-300 pb-4">
          <div className="flex items-center gap-2.5">
            <BrandMark size={36} />
            <div className="leading-tight">
              <p className="font-serif text-lg font-bold tracking-tight text-stone-900">Imprint</p>
              <p className="folio text-stone-500">Setting up the first issue</p>
            </div>
          </div>
          <span className="folio hidden text-stone-500 sm:block">Issue 01 · Cover</span>
        </div>

        <h1 className="font-serif text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">Which format suits this issue?</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-600">
          The format sets your section order, what the form emphasizes, and how your copy is structured. Your issue starts blank — you can change the format anytime, and nothing you type is lost.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {RESUME_TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setSelected(t.key)}
              className={`group relative rounded-sm border p-4 text-left transition ${
                selected === t.key
                  ? "border-amber-600 bg-white shadow-md ring-2 ring-amber-500/25"
                  : "border-stone-300 bg-white hover:border-stone-500 hover:shadow-sm"
              }`}
            >
              {selected === t.key ? (
                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-white">
                  <Check size={12} />
                </span>
              ) : null}
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-[15px] font-semibold text-stone-900">{t.label}</h3>
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-stone-500">{t.tagline}</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-stone-500">{t.description}</p>
              <p className="mt-2 text-[11px] font-medium text-stone-500">Best for: {t.bestFor}</p>
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-sm border border-stone-300 bg-white p-4">
          <label className="mb-1.5 block text-xs font-semibold text-stone-600">Optional: industry preset</label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value as IndustryKey | "")}
            className="w-full rounded-sm border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40 sm:w-72"
          >
            <option value="">No specific industry</option>
            {INDUSTRY_PRESETS.map((p) => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
          {industry ? <p className="mt-2 text-xs text-stone-500">{INDUSTRY_HINTS[industry]}</p> : null}
        </div>

        <div className="mt-4 rounded-sm border border-stone-300 bg-white p-4">
          <p className="folio mb-2 text-stone-500">Recommended section order for {def.label.toLowerCase()}:</p>
          <p className="text-xs leading-relaxed text-stone-700">{def.structure.join(" → ")}</p>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button type="button" onClick={onSkip} className="text-sm text-stone-500 underline-offset-2 hover:text-stone-800 hover:underline">
            Skip — I'll fill it in myself
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={choose}
              className="inline-flex items-center gap-2 rounded-sm bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800"
            >
              Build my resume <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
