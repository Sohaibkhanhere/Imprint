import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { useResume } from "../store/resumeStore";
import { runHealthChecks, computeScore, type HealthIssue } from "../lib/validation";

export function HealthPanel({ pages, mobileHidden = false }: { pages: number; mobileHidden?: boolean }) {
  const { resume } = useResume();
  const [issues, setIssues] = useState<HealthIssue[]>([]);
  const [open, setOpen] = useState(false);

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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const score = useMemo(() => computeScore(issues), [issues]);
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
        title="Open editor's notes"
        className={`no-print fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-40 flex items-center gap-2.5 rounded-sm border border-stone-300 bg-white px-3 py-2 shadow-[0_8px_24px_-12px_rgba(28,27,23,0.45)] transition hover:border-stone-900 active:scale-[0.98] md:bottom-5 md:left-auto md:right-5 ${mobileHidden ? "max-md:hidden" : ""}`}
      >
        <span className="font-serif text-[13px] font-bold tracking-tight text-stone-900">Notes</span>
        {reviewCount ? (
          <span className="editor-mark text-amber-700">{reviewCount}</span>
        ) : (
          <span className="editor-mark text-emerald-700">OK</span>
        )}
        <span className="h-3.5 w-px bg-stone-300" />
        <span className={`folio ${score >= 80 ? "text-emerald-700" : "text-amber-700"}`}>{score}/100</span>
      </button>

      {open ? (
        <div
          className="no-print notes-overlay fixed inset-0 z-50 flex items-end justify-center bg-stone-900/45 p-0 sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-labelledby="notes-title"
            className="notes-card w-full max-w-md overflow-hidden rounded-t-lg bg-white shadow-xl sm:rounded-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="masthead-rule" />
            <div className="flex items-start justify-between gap-3 px-5 py-4">
              <div>
                <h3 id="notes-title" className="font-serif text-[17px] font-bold tracking-tight text-stone-900">
                  Editor&rsquo;s notes
                </h3>
                <p className="folio mt-0.5 text-stone-500">Copy-desk review</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`folio ${score >= 80 ? "text-emerald-700" : "text-amber-700"}`}>{score}/100</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-sm p-1.5 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
                  aria-label="Close notes"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="border-t border-stone-200 px-5 py-3">
              {clean ? (
                <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                  <CheckCircle2 size={16} /> Clean sheet. Ready for the printer.
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  {errors.length ? <Stat label="Fix" count={errors.length} tone="error" /> : null}
                  {warnings.length ? <Stat label="Review" count={warnings.length} tone="warning" /> : null}
                  {infos.length ? <Stat label="Note" count={infos.length} tone="info" /> : null}
                </div>
              )}
            </div>

            {!clean ? (
              <div className="max-h-[min(52vh,22rem)] divide-y divide-stone-200 overflow-y-auto border-t border-stone-200 bg-stone-50/70 px-5">
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

            <div className="flex justify-end border-t border-stone-200 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-sm bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-stone-800 active:scale-[0.98]"
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
