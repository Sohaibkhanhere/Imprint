import { BrandMark } from "./BrandMark";
import { FileDown, FileText, Palette, LayoutGrid, ShieldCheck, RotateCcw, EyeOff, Sparkles, Upload, Loader2, MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useResume } from "../store/resumeStore";
import { exportPdf } from "../lib/pdf";
import { ImportDialog } from "./ImportDialog";
import { TemplateGallery } from "./TemplateGallery";
import { TemplateStepper, OPEN_TEMPLATES_EVENT } from "./TemplateStepper";
import { AtsScoreRing } from "./AtsScoreRing";
import { computeAtsScore, improveAts } from "../lib/atsScore";
import { themePatchForAtsSafe } from "../templates/registry";
import { patchPageSize } from "../lib/pageLayout";
import { CustomizeDesk } from "./CustomizeDesk";

type HeaderPanel = "template" | "customize" | "tips";

export function HeaderBar({
  onReset,
  onOpenTailor,
  onOpenNotes,
  startInGallery = false,
}: {
  onReset: () => void;
  onOpenTailor: () => void;
  onOpenNotes?: () => void;
  startInGallery?: boolean;
}) {
  const { resume, dispatch } = useResume();
  const t = resume.theme;
  const [panel, setPanel] = useState<HeaderPanel | null>(startInGallery ? "template" : null);
  const [showImport, setShowImport] = useState(false);
  const [exportingWord, setExportingWord] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const issueName = (resume.contact?.fullName || "").trim() || "Untitled resume";
  const atsScore = computeAtsScore(resume);

  const togglePanel = (next: HeaderPanel) => {
    setShowImport(false);
    setPanel((p) => (p === next ? null : next));
  };

  const openImport = () => {
    setPanel(null);
    setShowImport(true);
  };

  const openTailor = () => {
    setPanel(null);
    onOpenTailor();
  };

  useEffect(() => {
    const onOpen = () => {
      setShowImport(false);
      setPanel("template");
    };
    window.addEventListener(OPEN_TEMPLATES_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_TEMPLATES_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!moreOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  const exportWord = async () => {
    if (exportingWord) return;
    setExportingWord(true);
    try {
      const m = await import("../lib/docx");
      await m.exportDocx(resume);
    } catch (e) {
      window.alert((e as Error).message || "Could not export Word file.");
    } finally {
      setExportingWord(false);
    }
  };

  const exportPdfFile = async () => {
    if (exportingPdf) return;
    setExportingPdf(true);
    try {
      await exportPdf(resume);
    } catch (e) {
      window.alert((e as Error).message || "Could not export PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

  const applyImprove = () => {
    const result = improveAts(resume);
    dispatch({ type: "LOAD", resume: result.resume });
    onOpenNotes?.();
  };

  return (
    <header id="app-chrome" className="no-print border-b border-stone-300 bg-stone-50">
      <div className="masthead-rule" />
      <div className="flex min-w-0 items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5 lg:px-6">
          <Link to="/" className="group flex min-w-0 shrink-0 items-center gap-2 sm:gap-2.5" aria-label="Resume Maker by QD home">
          <BrandMark size={36} />
          <span className="qd-lockup">
            <span className="qd-lockup-name">Resume Maker</span>
            <span className="qd-lockup-by">by QD</span>
          </span>
        </Link>

        <nav className="ml-1 hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto sm:flex xl:gap-1">
          <button
            type="button"
            onClick={() => togglePanel("template")}
            aria-expanded={panel === "template"}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-sm font-medium transition ${
              panel === "template" ? "bg-amber-50 text-amber-700" : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <LayoutGrid size={15} /> <span className="hidden sm:inline">Template</span>
          </button>
          <button
            type="button"
            onClick={() => togglePanel("customize")}
            aria-expanded={panel === "customize"}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-sm font-medium transition ${
              panel === "customize" ? "bg-amber-50 text-amber-700" : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <Palette size={15} /> <span className="hidden sm:inline">Customize</span>
          </button>
          <button
            type="button"
            onClick={() => togglePanel("tips")}
            aria-expanded={panel === "tips"}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-sm font-medium transition ${
              panel === "tips" ? "bg-amber-50 text-amber-700" : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <Sparkles size={15} /> <span className="hidden lg:inline">Writing tips</span>
          </button>
          <button
            type="button"
            onClick={openTailor}
            title="Tailor to a job"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-sm font-medium text-stone-500 transition hover:text-stone-900"
          >
            <ShieldCheck size={15} /> <span className="hidden xl:inline">Tailor to a job</span>
          </button>
          <button
            type="button"
            onClick={openImport}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-sm font-medium text-stone-500 transition hover:text-stone-900"
          >
            <Upload size={15} /> <span className="hidden lg:inline">Import CV</span>
          </button>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:ml-0 sm:gap-1.5">
          <button
            type="button"
            onClick={() => {
              setMoreOpen(false);
              openImport();
            }}
            className="inline-flex min-h-10 min-w-10 items-center justify-center gap-1.5 rounded-sm px-2 py-1.5 text-sm font-medium text-stone-600 transition hover:bg-stone-200 hover:text-stone-900 sm:hidden"
            title="Import CV"
          >
            <Upload size={16} />
          </button>
          <select
            value={t.pageSize ?? "a4"}
            onChange={(e) => dispatch({ type: "SET_THEME", theme: patchPageSize(t, e.target.value as "a4" | "letter") })}
            title="Page size"
            className="hidden rounded-sm border border-stone-300 bg-stone-50 px-2 py-1.5 text-xs font-medium text-stone-600 focus:outline-none focus:ring-1 focus:ring-amber-500 2xl:block"
          >
            <option value="a4">A4</option>
            <option value="letter">Letter</option>
          </select>
          <div
            title={`ATS Compatibility Score ${atsScore}%. Not a guarantee.`}
            className="inline-flex items-center rounded-full p-0.5"
          >
            <AtsScoreRing value={atsScore} size={36} />
          </div>
          <button
            type="button"
            title={t.atsSafe ? "ATS Safe on: Next and Previous only cycle parser-friendly layouts. Click to restore the designed page." : "ATS Safe off. Click to use parser-friendly layouts only."}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              dispatch({ type: "SET_THEME", theme: themePatchForAtsSafe(t.template, !t.atsSafe) });
            }}
            className={`ats-safe-toggle${t.atsSafe ? " is-on" : ""}`}
            aria-pressed={t.atsSafe}
          >
            <ShieldCheck size={14} /> ATS Safe
          </button>
          <button
            type="button"
            title="Rewrite weak wording and apply ATS layout. Does not invent jobs, metrics, or keywords."
            onClick={applyImprove}
            className="hidden items-center gap-1.5 rounded-sm border border-amber-500 px-2 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 sm:inline-flex"
          >
            <Sparkles size={14} /> <span className="hidden lg:inline">Improve ATS</span>
          </button>
          <button
            type="button"
            title="Start fresh: clear all fields"
            onClick={onReset}
            className="hidden min-h-9 items-center gap-1.5 rounded-sm border border-stone-300 px-2 py-1.5 text-xs font-medium text-stone-500 transition hover:bg-stone-200 sm:inline-flex"
          >
            <RotateCcw size={14} />
          </button>
          <button
            type="button"
            onClick={() => void exportPdfFile()}
            disabled={exportingPdf}
            title="Download a PDF of this resume"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-sm bg-amber-500 px-2.5 py-1.5 text-sm font-semibold text-stone-100 shadow-sm transition hover:bg-amber-400 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
          >
            {exportingPdf ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
            <span className="hidden sm:inline">{exportingPdf ? "Saving" : "PDF"}</span>
          </button>
          <button
            type="button"
            onClick={() => void exportWord()}
            disabled={exportingWord}
            title="Download an editable Word file"
            className="hidden min-h-9 items-center gap-1.5 rounded-sm border border-stone-300 px-2.5 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-200 disabled:cursor-wait disabled:opacity-60 sm:inline-flex"
          >
            {exportingWord ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
            <span className="hidden md:inline">{exportingWord ? "Exporting" : "Word"}</span>
          </button>
          <div ref={moreRef} className="relative sm:hidden">
            <button
              type="button"
              onClick={() => setMoreOpen((o) => !o)}
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-sm border border-stone-300 text-stone-600 transition hover:bg-stone-200"
              aria-expanded={moreOpen}
              aria-label="More actions"
            >
              <MoreHorizontal size={16} />
            </button>
            {moreOpen ? (
              <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-52 overflow-hidden rounded-sm border border-stone-200 bg-stone-50 py-1 shadow-lg">
                {(
                  [
                    { label: "Template", run: () => togglePanel("template") },
                    { label: "Customize", run: () => togglePanel("customize") },
                    { label: "Writing tips", run: () => togglePanel("tips") },
                    { label: "Tailor to a job", run: openTailor },
                    { label: "Import CV", run: openImport },
                    { label: exportingWord ? "Exporting Word…" : "Export Word", run: () => void exportWord() },
                    { label: "ATS Compatibility Score", run: () => onOpenNotes?.() },
                    { label: "Improve ATS", run: applyImprove },
                    { label: t.atsSafe ? "ATS Safe on" : "ATS Safe off", run: () => {
                      dispatch({ type: "SET_THEME", theme: themePatchForAtsSafe(t.template, !t.atsSafe) });
                    } },
                    { label: "Start fresh", run: onReset },
                  ] as { label: string; run: () => void }[]
                ).map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      item.run();
                    }}
                    className="block w-full px-3 py-2.5 text-left text-sm text-stone-700 transition hover:bg-stone-200"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-2 border-t border-stone-200 px-3 py-1.5 sm:gap-3 sm:px-4 lg:px-6">
        <span className="folio hidden text-stone-500 sm:inline">Resume</span>
        <span className="folio truncate text-stone-600">{issueName}</span>
        <span className="ml-auto flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
          <TemplateStepper keyboard />
          <span className="folio hidden text-stone-500 md:inline">{t.pageSize?.toUpperCase() ?? "A4"}</span>
        </span>
      </div>

      {panel === "template" ? <TemplateGallery onClose={() => setPanel(null)} /> : null}

      {panel === "customize" ? <CustomizeDesk /> : null}

      {panel === "tips" ? <WritingTips onClose={() => setPanel(null)} /> : null}
      {showImport ? <ImportDialog onClose={() => setShowImport(false)} /> : null}
    </header>
  );
}

function WritingTips({ onClose }: { onClose: () => void }) {
  return (
    <div className="max-h-[min(50dvh,22rem)] overflow-y-auto border-t border-stone-200 bg-stone-50 px-4 py-3 sm:px-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="folio mb-2 text-stone-500">Writing rules</p>
          <div className="grid grid-cols-1 gap-x-8 gap-y-1 text-xs leading-relaxed text-stone-700 sm:grid-cols-2">
            <p>• Formula: <strong>Action verb + task + method + quantified result</strong>.</p>
            <p>• No first-person pronouns (I, my, me). Implied first person only.</p>
            <p>• Quantify at least half your bullets (%, $, team size, time saved).</p>
            <p>• Keep bullets to 1–2 lines (~12–22 words).</p>
            <p>• Past tense for past roles, present tense for your current role. Never mix.</p>
            <p>• Avoid vague filler: hardworking, team player, detail-oriented.</p>
            <p>• Skip “Responsible for” / “Duties included” openers.</p>
            <p>• Never fabricate numbers. Ask for a real figure.</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100">
          <EyeOff size={15} />
        </button>
      </div>
    </div>
  );
}
