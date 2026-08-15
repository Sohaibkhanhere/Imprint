import { useEffect, useMemo, useState } from "react";
import { ResumeProvider, useResume } from "./store/resumeStore";
import { HeaderBar } from "./components/HeaderBar";
import { FormPanel } from "./components/form/FormPanel";
import { PreviewPane } from "./components/PreviewPane";
import { HealthPanel } from "./components/HealthPanel";
import { TailorPanel } from "./components/TailorPanel";
import { TypeWizard } from "./components/Wizard";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LayoutGrid } from "lucide-react";
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
  const [showWizard, setShowWizard] = useState(() => !window.localStorage.getItem(STORAGE_KEY));
  const [showTailor, setShowTailor] = useState(false);
  const [pages, setPages] = useState(1);
  const [mobileTab, setMobileTab] = useState<"copy" | "proof">("copy");

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
    <div className="flex h-screen flex-col bg-stone-100">
      <HeaderBar onReset={reset} onOpenTailor={() => setShowTailor((s) => !s)} />
      <div className="no-print flex border-b border-stone-200 bg-white md:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("copy")}
          className={`flex flex-1 items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
            mobileTab === "copy" ? "border-amber-600 text-stone-900" : "border-transparent text-stone-500"
          }`}
        >
          <span className="contents-number">01</span> Copy desk
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("proof")}
          className={`flex flex-1 items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
            mobileTab === "proof" ? "border-amber-600 text-stone-900" : "border-transparent text-stone-500"
          }`}
        >
          <span className="contents-number">02</span> Proof sheet
        </button>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <aside
          className={`no-print flex-col overflow-y-auto border-b border-stone-300 bg-white md:flex md:w-[400px] md:flex-col md:border-b-0 md:border-r ${
            mobileTab === "copy" ? "flex" : "hidden"
          }`}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-stone-200 bg-white px-4 py-3">
            <div>
              <p className="folio text-stone-500">Contents</p>
              <p className="mt-0.5 text-[11px] text-stone-500">{sections.length} section{sections.length === 1 ? "" : "s"} in this issue</p>
            </div>
            <button
              type="button"
              onClick={() => setShowWizard(true)}
              className="inline-flex items-center gap-1.5 rounded-sm border border-stone-300 px-2.5 py-1.5 text-xs font-semibold text-stone-800 transition hover:border-stone-900 hover:text-stone-900"
            >
              <LayoutGrid size={13} /> Format
            </button>
          </div>
          {showTailor ? <div className="border-b border-stone-200 px-4 py-3"><TailorPanel onClose={() => setShowTailor(false)} /></div> : null}
          <div className="px-4 pb-10 pt-3">
            <FormPanel />
          </div>
        </aside>

        <main className={`flex flex-1 flex-col overflow-hidden md:flex ${mobileTab === "proof" ? "flex" : "hidden"}`}>
          <div className="flex-1 overflow-hidden">
            <PreviewPane onPages={setPages} />
          </div>
        </main>
      </div>
      <HealthPanel pages={pages} />
      {showWizard ? <TypeWizard onDone={() => setShowWizard(false)} onSkip={() => setShowWizard(false)} /> : null}
    </div>
  );
}

function Shell() {
  return (
    <ErrorBoundary
      fallback={(reset) => (
        <div className="flex h-screen flex-col items-center justify-center gap-3 bg-stone-100 px-6 text-center">
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
