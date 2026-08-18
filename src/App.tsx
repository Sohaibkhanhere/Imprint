import { useEffect, useState } from "react";
import { ResumeProvider, useResume } from "./store/resumeStore";
import { HeaderBar } from "./components/HeaderBar";
import { FormPanel } from "./components/form/FormPanel";
import { PreviewPane } from "./components/PreviewPane";
import { HealthPanel } from "./components/HealthPanel";
import { TailorPanel } from "./components/TailorPanel";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { STORAGE_KEY } from "./lib/storage";
import { isKnownTemplateKey, themePatchForAtsSafe, themePatchForTemplate } from "./templates/registry";

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
  const [notesOpen, setNotesOpen] = useState(false);
  const [firstIssue] = useState(() => !window.localStorage.getItem(STORAGE_KEY));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tpl = params.get("template");
    const atsOn = params.get("atsSafe") === "1" || params.get("atsSafe") === "true";
    if (tpl && isKnownTemplateKey(tpl)) {
      const base = themePatchForTemplate(tpl);
      dispatch({
        type: "SET_THEME",
        theme: atsOn ? { ...base, ...themePatchForAtsSafe(tpl, true) } : { ...base, atsSafe: false },
      });
      return;
    }
    if (atsOn) dispatch({ type: "SET_THEME", theme: themePatchForAtsSafe("classic", true) });
  }, [dispatch]);

  useEffect(() => {
    const onFocus = () => setMobileTab("copy");
    window.addEventListener("rs:focus-section", onFocus);
    return () => window.removeEventListener("rs:focus-section", onFocus);
  }, []);

  useEffect(() => {
    if (resume.theme.template !== "tech-dark") return;
    if ((resume.theme.accent || "").toLowerCase() !== "#262a43") return;
    dispatch({ type: "SET_THEME", theme: { accent: "#e50914" } });
  }, [dispatch, resume.theme.template, resume.theme.accent]);

  const reset = () => {
    if (window.confirm("Clear the current resume and start with blank fields?")) {
      dispatch({ type: "RESET_BLANK" });
    }
  };

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-stone-100">
      <HeaderBar onReset={reset} onOpenTailor={() => setShowTailor((s) => !s)} onOpenNotes={() => setNotesOpen(true)} startInGallery={firstIssue} />
      <div className="no-print flex shrink-0 border-b border-stone-200 bg-stone-50 md:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("copy")}
          className={`flex min-h-11 flex-1 items-center justify-center gap-2 border-b-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
            mobileTab === "copy" ? "border-amber-600 text-stone-900" : "border-transparent text-stone-500"
          }`}
        >
          <span className="contents-number">01</span> Contents
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("proof")}
          className={`flex min-h-11 flex-1 items-center justify-center gap-2 border-b-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
            mobileTab === "proof" ? "border-amber-600 text-stone-900" : "border-transparent text-stone-500"
          }`}
        >
            <span className="contents-number">02</span> Preview
        </button>
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:flex-row">
        <aside
          className={`no-print min-h-0 min-w-0 flex-col overflow-y-auto overflow-x-hidden border-b border-stone-300 bg-stone-50 md:flex md:w-[min(22rem,40vw)] md:flex-none md:border-b-0 md:border-r lg:w-[28rem] ${
            mobileTab === "copy" ? "flex flex-1" : "hidden"
          }`}
        >
          {showTailor ? <div className="border-b border-stone-200 px-4 py-3"><TailorPanel onClose={() => setShowTailor(false)} /></div> : null}
          <FormPanel />
        </aside>

        <main className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:flex ${mobileTab === "proof" ? "flex" : "hidden"}`}>
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
            <PreviewPane onPages={setPages} />
          </div>
        </main>
      </div>
      <HealthPanel pages={pages} mobileHidden={mobileTab === "copy"} open={notesOpen} onOpenChange={setNotesOpen} />
    </div>
  );
}

function Shell() {
  return (
    <ErrorBoundary
      fallback={(reset) => (
        <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-stone-100 px-6 text-center">
          <p className="qd-wordmark text-[28px]">Resume by QD</p>
          <p className="text-sm font-semibold text-amber-500">Something went wrong</p>
          <p className="max-w-sm text-sm text-stone-600">Your saved data is safe. Reset to a blank resume to keep working.</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={reset}
              className="rounded-sm bg-amber-500 px-4 py-2 text-sm font-semibold text-stone-100 shadow-sm transition hover:bg-amber-400"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => {
                window.localStorage.removeItem(STORAGE_KEY);
                window.location.reload();
              }}
              className="rounded-sm border border-stone-300 bg-stone-50 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
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
