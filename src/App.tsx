import { useEffect, useMemo, useState } from "react";
import { ResumeProvider, useResume } from "./store/resumeStore";
import { HeaderBar } from "./components/HeaderBar";
import { FormPanel } from "./components/form/FormPanel";
import { PreviewPane } from "./components/PreviewPane";
import { HealthPanel } from "./components/HealthPanel";
import { TailorPanel } from "./components/TailorPanel";
import { ErrorBoundary } from "./components/ErrorBoundary";
import type { TemplateKey } from "./lib/types";
import { STORAGE_KEY } from "./lib/storage";

export function App() {
  return (
    <ResumeProvider>
      <Shell />
    </ResumeProvider>
  );
}

function ShellInner() {
  const { resume, dispatch } = useResume();
  const [showTailor, setShowTailor] = useState(false);
  const [pages, setPages] = useState(1);
  const [mobileTab, setMobileTab] = useState<"copy" | "proof">("copy");
  const [firstIssue] = useState(() => !window.localStorage.getItem(STORAGE_KEY));

  const sections = useMemo(
    () => resume.sectionOrder.filter((k) => k === "contact" || resume.visibility?.[k as keyof typeof resume.visibility]),
    [resume.sectionOrder, resume.visibility],
  );

  useEffect(() => {
    const tpl = new URLSearchParams(window.location.search).get("template") as TemplateKey | null;
    if (tpl) dispatch({ type: "SET_THEME", theme: { template: tpl } });
  }, [dispatch]);

  const reset = () => {
    if (window.confirm("Clear the current resume and start with blank fields?")) {
      dispatch({ type: "RESET_BLANK" });
    }
  };

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-stone-100">
      <HeaderBar onReset={reset} onOpenTailor={() => setShowTailor((s) => !s)} startInGallery={firstIssue} />
      <div className="no-print flex shrink-0 border-b border-stone-200 bg-white md:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("copy")}
          className={`flex min-h-11 flex-1 items-center justify-center gap-2 border-b-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
            mobileTab === "copy" ? "border-amber-600 text-stone-900" : "border-transparent text-stone-500"
          }`}
        >
          <span className="contents-number">01</span> Copy
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("proof")}
          className={`flex min-h-11 flex-1 items-center justify-center gap-2 border-b-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
            mobileTab === "proof" ? "border-amber-600 text-stone-900" : "border-transparent text-stone-500"
          }`}
        >
          <span className="contents-number">02</span> Proof
        </button>
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:flex-row">
        <aside
          className={`no-print min-h-0 min-w-0 flex-col overflow-y-auto overflow-x-hidden border-b border-stone-300 bg-white md:flex md:w-[min(22rem,40vw)] md:flex-none md:border-b-0 md:border-r lg:w-[28rem] ${
            mobileTab === "copy" ? "flex flex-1" : "hidden"
          }`}
        >
          <div className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 px-4 py-3.5 backdrop-blur-[6px]">
            <div className="masthead-rule mb-2.5 w-10" />
            <div className="flex items-end justify-between gap-3">
              <h2 className="font-serif text-[22px] font-semibold leading-none tracking-tight text-stone-900">Contents</h2>
              <p className="folio text-stone-500">{String(sections.length).padStart(2, "0")} · this issue</p>
            </div>
            <p className="mt-1.5 text-[12px] leading-snug text-stone-500">Every field updates the proof live.</p>
          </div>
          {showTailor ? <div className="border-b border-stone-200 px-4 py-3"><TailorPanel onClose={() => setShowTailor(false)} /></div> : null}
          <div className="px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-3">
            <FormPanel />
          </div>
        </aside>

        <main className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:flex ${mobileTab === "proof" ? "flex" : "hidden"}`}>
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
            <PreviewPane onPages={setPages} />
          </div>
        </main>
      </div>
      <HealthPanel pages={pages} mobileHidden={mobileTab === "copy"} />
    </div>
  );
}

function Shell() {
  return (
    <ErrorBoundary
      fallback={(reset) => (
        <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-stone-100 px-6 text-center">
          <p className="font-serif text-lg font-bold text-stone-900">Imprint hit a snag</p>
          <p className="max-w-sm text-sm text-stone-600">Your saved data is safe. Reset to a blank resume to keep working.</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={reset}
              className="rounded-sm bg-stone-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => {
                window.localStorage.removeItem(STORAGE_KEY);
                window.location.reload();
              }}
              className="rounded-sm border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              Reset to blank
            </button>
          </div>
        </div>
      )}
    >
      <ShellInner />
    </ErrorBoundary>
  );
}
