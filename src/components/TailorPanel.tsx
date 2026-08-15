import { useEffect, useMemo, useState } from "react";
import { useResume } from "../store/resumeStore";
import { extractKeywords, tailorResume, type TailorReport } from "../lib/jdTailor";
import { Check, X, Wand2, X as Close } from "lucide-react";

export function TailorPanel({ onClose }: { onClose: () => void }) {
  const { resume, dispatch } = useResume();
  const [jd, setJd] = useState("");
  const [report, setReport] = useState<TailorReport | null>(null);

  const keywords = useMemo(() => extractKeywords(jd), [jd]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (jd.trim().length > 20) setReport(tailorResume(resume, jd));
    }, 300);
    return () => window.clearTimeout(id);
  }, [jd, resume]);

  const apply = () => {
    dispatch({ type: "LOAD", resume: report?.tailored ?? resume });
    onClose();
  };

  return (
    <div className="rounded-sm border border-stone-300 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
        <h3 className="flex items-center gap-2 font-serif text-[15px] font-semibold text-stone-900">
          <Wand2 size={15} className="text-stone-500" /> Tailor to a job description
        </h3>
        <button type="button" onClick={onClose} className="rounded-md p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-700">
          <Close size={15} />
        </button>
      </div>

      <div className="space-y-4 px-4 py-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-600">Paste the job description</label>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={5}
            placeholder="Paste the job posting here. We'll pull the keywords and re-order your skills and experience to match."
            className="w-full resize-y rounded-sm border border-stone-300 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-500 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {jd.trim().length > 20 && keywords.length > 0 ? (
          <div>
            <p className="mb-1.5 text-xs font-semibold text-stone-600">
              Detected {keywords.length} keyword{keywords.length === 1 ? "" : "s"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {keywords.slice(0, 12).map((k) => (
                <span key={k.term} className="rounded-sm bg-stone-100 px-2.5 py-1 font-mono text-[10.5px] font-medium text-stone-700">
                  {k.term}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {report ? (
          <div className="space-y-3 rounded-sm border border-stone-200 bg-stone-50 p-3">
            <p className="folio text-stone-500">Copy-desk analysis</p>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-700">Keyword coverage</span>
              <span className="folio text-stone-900">
                {report.coverage}% <span className="font-normal text-stone-500">({report.matchedKeywords.length}/{report.totalKeywords})</span>
              </span>
            </div>
            <div className="space-y-1">
              {report.matchedKeywords.map((k) => (
                <p key={k} className="flex items-center gap-1.5 text-xs text-emerald-700">
                  <Check size={13} /> {k}
                </p>
              ))}
              {report.missingKeywords.slice(0, 8).map((k) => (
                <p key={k} className="flex items-center gap-1.5 text-xs text-stone-500">
                  <X size={13} /> {k}
                </p>
              ))}
            </div>
            {report.recommendations.length ? (
              <div>
                <p className="mb-1 text-xs font-semibold text-stone-700">Recommendations</p>
                <ul className="list-inside list-disc space-y-0.5 text-[11px] text-stone-600">
                  {report.recommendations.slice(0, 5).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <button type="button" onClick={apply} className="w-full rounded-sm bg-stone-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-stone-800">
              Re-order skills &amp; experience for this job
            </button>
          </div>
        ) : jd.trim().length > 20 ? (
          <p className="text-xs text-stone-500">Analyzing…</p>
        ) : (
          <p className="text-xs text-stone-500">Paste a description to see the analysis.</p>
        )}
      </div>
    </div>
  );
}
