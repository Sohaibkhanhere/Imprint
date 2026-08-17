import { useEffect, useMemo, useState } from "react";
import { useResume } from "../store/resumeStore";
import { extractKeywords, tailorResume, type TailorReport } from "../lib/jdTailor";
import { Check, Minus, X, Wand2, X as Close } from "lucide-react";

export function TailorPanel({ onClose }: { onClose: () => void }) {
  const { resume, dispatch } = useResume();
  const [jd, setJd] = useState(() => resume.target?.jobDescription ?? "");
  const [report, setReport] = useState<TailorReport | null>(null);

  const keywords = useMemo(() => extractKeywords(jd), [jd]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      dispatch({
        type: "PATCH",
        patch: { target: { jobDescription: jd, enabled: jd.trim().length > 20 } },
      });
    }, 400);
    return () => window.clearTimeout(id);
  }, [jd, dispatch]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (jd.trim().length > 20) setReport(tailorResume(resume, jd));
      else setReport(null);
    }, 300);
    return () => window.clearTimeout(id);
  }, [jd, resume]);

  const apply = () => {
    if (!report) return;
    dispatch({ type: "LOAD", resume: report.tailored });
    onClose();
  };

  return (
    <div className="rounded-sm border border-stone-300 bg-stone-50 shadow-sm">
      <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
        <h3 className="qd-wordmark flex items-center gap-2 text-[22px] leading-none">
          <Wand2 size={15} className="text-amber-500" /> Tailor to a job
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
            placeholder="Paste the job posting. We match your existing wording and reorder skills and jobs. Missing terms are never invented."
            className="w-full resize-y rounded-sm border border-stone-300 bg-stone-100 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-500 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
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
            <p className="folio text-stone-500">Job match</p>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-700">Keyword coverage</span>
              <span className="folio text-stone-900">
                {report.coverage}%{" "}
                <span className="font-normal text-stone-500">
                  ({report.matchedKeywords.length} matched · {report.partialKeywords.length} partial · {report.missingKeywords.length} missing)
                </span>
              </span>
            </div>
            <KeywordBucket title="Matched" tone="matched" items={report.matchedKeywords} />
            <KeywordBucket title="Partial" tone="partial" items={report.partialKeywords} />
            <KeywordBucket title="Missing" tone="missing" items={report.missingKeywords.slice(0, 10)} />
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
            <button type="button" onClick={apply} className="w-full rounded-sm bg-amber-500 px-3 py-2 text-xs font-semibold text-stone-100 shadow-sm transition hover:bg-amber-400">
              Reorder existing skills and jobs. Will not add missing keywords.
            </button>
          </div>
        ) : jd.trim().length > 20 ? (
          <p className="text-xs text-stone-500">Analyzing…</p>
        ) : (
          <p className="text-xs text-stone-500">Paste a description to see matched, partial, and missing terms.</p>
        )}
      </div>
    </div>
  );
}

function KeywordBucket({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "matched" | "partial" | "missing";
  items: string[];
}) {
  if (!items.length) return null;
  const Icon = tone === "matched" ? Check : tone === "partial" ? Minus : X;
  const cls =
    tone === "matched" ? "text-emerald-700" : tone === "partial" ? "text-amber-700" : "text-stone-500";
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-stone-500">{title}</p>
      <div className="space-y-1">
        {items.map((k) => (
          <p key={`${tone}-${k}`} className={`flex items-center gap-1.5 text-xs ${cls}`}>
            <Icon size={13} /> {k}
          </p>
        ))}
      </div>
    </div>
  );
}
