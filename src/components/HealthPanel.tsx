import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Sparkles, X } from "lucide-react";
import { useResume } from "../store/resumeStore";
import { runHealthChecks, computeScore, type HealthIssue } from "../lib/validation";
import { evaluateAts, improveAts, onAtsImprove } from "../lib/atsScore";
import { AtsScoreRing } from "./AtsScoreRing";

export function HealthPanel({
  pages,
  mobileHidden = false,
  open: openProp,
  onOpenChange,
}: {
  pages: number;
  mobileHidden?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { resume, dispatch } = useResume();
  const [issues, setIssues] = useState<HealthIssue[]>([]);
  const [innerOpen, setInnerOpen] = useState(false);
  const [applied, setApplied] = useState<string[]>([]);
  const [leftover, setLeftover] = useState<string[]>([]);
  const open = openProp ?? innerOpen;
  const setOpen = (v: boolean) => {
    onOpenChange?.(v);
    if (openProp === undefined) setInnerOpen(v);
  };

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        setIssues(runHealthChecks(resume, pages));
      } catch {
        setIssues([]);
      }
    }, 320);
    return () => window.clearTimeout(id);
  }, [resume, pages]);

  useEffect(() => onAtsImprove((result) => {
    setApplied(result.changes);
    setLeftover(result.leftover);
  }), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const report = useMemo(() => evaluateAts(resume), [resume]);
  const atsScore = report.score;
  const checks = report.checks;
  const failed = checks.filter((c) => !c.pass);
  const score = useMemo(() => computeScore(issues), [issues]);

  const runImprove = () => {
    const result = improveAts(resume);
    dispatch({ type: "LOAD", resume: result.resume });
    setApplied(result.changes);
    setLeftover(result.leftover);
  };
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const infos = issues.filter((i) => i.severity === "info");
  const clean = issues.length === 0;
  const reviewCount = errors.length + warnings.length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Open ATS Compatibility Score and resume notes"
        className={`no-print fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-40 flex items-center gap-2.5 rounded-sm border border-stone-300 bg-stone-50 py-1.5 pl-1.5 pr-3 shadow-[0_8px_24px_-12px_rgba(28,27,23,0.45)] transition hover:border-stone-900 active:scale-[0.98] md:bottom-5 md:left-auto md:right-5 ${mobileHidden ? "max-md:hidden" : ""}`}
      >
        <AtsScoreRing value={atsScore} size={40} />
        <span className="flex min-w-0 flex-col items-start leading-tight">
          <span className="qd-wordmark text-[16px] leading-none tracking-wide">ATS</span>
          <span className="folio mt-0.5 text-stone-500">{reviewCount ? `${reviewCount} to review` : "Ready"}</span>
        </span>
      </button>

      {open ? (
        <div
          className="no-print notes-overlay fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-labelledby="notes-title"
            className="notes-card w-full max-w-lg overflow-hidden rounded-t-lg bg-stone-50 shadow-xl sm:rounded-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="masthead-rule" />
            <div className="flex items-start justify-between gap-3 px-5 py-4">
              <div className="flex min-w-0 items-center gap-4">
                <AtsScoreRing value={atsScore} size={88} />
                <div className="min-w-0">
                  <h3 id="notes-title" className="qd-wordmark text-[22px] leading-none">
                    ATS Compatibility Score
                  </h3>
                  <p className="folio mt-1 text-stone-500">
                    Live check · {failed.length ? `${failed.length} rules to fix` : "Looking solid"}
                  </p>
                  <p className="mt-1.5 text-[12px] leading-snug text-stone-500">
                    {report.disclaimer}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-sm p-1.5 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
                aria-label="Close notes"
              >
                <X size={16} />
              </button>
            </div>

            {applied.length ? (
              <div className="border-t border-stone-200 bg-emerald-950/40 px-5 py-3">
                <p className="folio text-emerald-400">Applied {applied.length} fixes</p>
                <ul className="mt-1.5 space-y-1 text-[12px] leading-snug text-stone-700">
                  {applied.map((c) => (
                    <li key={c}>• {c}</li>
                  ))}
                </ul>
                {leftover.length ? (
                  <p className="mt-2 text-[11px] leading-snug text-stone-500">Still needs you: {leftover[0]}</p>
                ) : null}
              </div>
            ) : null}

            <div className="max-h-[min(48vh,22rem)] overflow-y-auto border-t border-stone-200">
              <div className="space-y-2 border-b border-stone-200 px-5 py-3">
                <p className="folio text-stone-500">Risk flags</p>
                {report.risks.map((risk) => (
                  <div key={risk.label} className="flex items-start gap-2">
                    <span
                      className={`mt-0.5 shrink-0 font-mono text-[10px] font-semibold uppercase tracking-wide ${
                        risk.level === "high" ? "text-red-600" : risk.level === "medium" ? "text-amber-600" : "text-stone-500"
                      }`}
                    >
                      {risk.level}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-stone-800">{risk.label}</p>
                      <p className="mt-0.5 font-mono text-[10.5px] leading-snug text-stone-500">{risk.fix}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-b border-stone-200 px-5 py-3">
                <p className="folio mb-2 text-stone-500">Score breakdown</p>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {report.dimensions.map((d) => (
                    <div key={d.id} className="flex items-baseline justify-between gap-2 text-[11px]">
                      <span className="min-w-0 truncate text-stone-600" title={d.note}>
                        {d.id}. {d.label}
                      </span>
                      <span className="folio shrink-0 tabular-nums text-stone-800">{d.score}</span>
                    </div>
                  ))}
                </div>
                {report.dimensions.find((d) => d.id === "D")?.note ? (
                  <p className="mt-2 font-mono text-[10.5px] leading-snug text-stone-500">
                    {report.dimensions.find((d) => d.id === "D")?.note}
                  </p>
                ) : null}
              </div>
              <div className="divide-y divide-stone-200 px-5">
                {checks.map((c) => (
                  <div key={c.id} className="flex items-start gap-2.5 py-2.5">
                    <span className={`editor-mark mt-px shrink-0 ${c.pass ? "text-emerald-500" : "text-amber-600"}`}>
                      {c.pass ? "✓" : "△"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-stone-800">{c.label}</p>
                      {c.pass ? null : <p className="mt-0.5 font-mono text-[10.5px] leading-snug text-stone-500">{c.hint}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-stone-200 px-5 py-3">
              {clean ? (
                <p className="flex items-center gap-2 text-sm font-medium text-emerald-500">
                  <CheckCircle2 size={16} /> Writing looks good. Ready to export.
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="folio text-stone-500">Writing {score}/100</span>
                  {errors.length ? <Stat label="Fix" count={errors.length} tone="error" /> : null}
                  {warnings.length ? <Stat label="Review" count={warnings.length} tone="warning" /> : null}
                  {infos.length ? <Stat label="Note" count={infos.length} tone="info" /> : null}
                </div>
              )}
            </div>

            {!clean ? (
              <div className="max-h-[min(28vh,12rem)] divide-y divide-stone-200 overflow-y-auto border-t border-stone-200 bg-stone-100 px-5">
                {errors.map((h, i) => (
                  <IssueRow key={`e${i}`} kind="error" text={h.message} detail={h.hint} />
                ))}
                {warnings.map((h, i) => (
                  <IssueRow key={`w${i}`} kind="warning" text={h.message} detail={h.hint} />
                ))}
                {infos.map((h, i) => (
                  <IssueRow key={`i${i}`} kind="info" text={h.message} detail={h.hint} />
                ))}
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-2 border-t border-stone-200 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={runImprove}
                className="inline-flex items-center gap-1.5 rounded-sm bg-amber-500 px-3 py-1.5 text-xs font-semibold text-stone-100 transition hover:bg-amber-400"
              >
                <Sparkles size={13} /> Improve ATS
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-sm border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-200"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Stat({ label, count, tone }: { label: string; count: number; tone: "error" | "warning" | "info" }) {
  const cls = tone === "error" ? "text-amber-700" : tone === "warning" ? "text-amber-600" : "text-stone-500";
  return (
    <span className="shrink-0">
      <span className="editor-mark text-stone-500">{label}</span>{" "}
      <span className={`editor-mark ${cls}`}>{count}</span>
    </span>
  );
}

function IssueRow({ kind, text, detail }: { kind: "error" | "warning" | "info"; text: string; detail?: string }) {
  const mark = kind === "error" ? "✎" : kind === "warning" ? "△" : "¶";
  const cls = kind === "error" ? "text-amber-700" : kind === "warning" ? "text-amber-600" : "text-stone-500";
  return (
    <div className="flex items-start gap-2.5 py-2.5">
      <span className={`editor-mark mt-px shrink-0 ${cls}`}>{mark}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-stone-800">{text}</p>
        {detail ? <p className="mt-0.5 font-mono text-[10.5px] leading-snug text-stone-500">{detail}</p> : null}
      </div>
    </div>
  );
}
