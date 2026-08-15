import { BrandMark } from "./BrandMark";
import { FileDown, FileText, Palette, Type, LayoutGrid, ShieldCheck, RotateCcw, EyeOff, Sparkles, Upload, Loader2 } from "lucide-react";
import { useState } from "react";
import { useResume } from "../store/resumeStore";
import { exportPdf } from "../lib/pdf";
import { ACCENT_PALETTE, FONT_PAIRS } from "../lib/sampleData";
import { ImportDialog } from "./ImportDialog";
import { TemplateGallery } from "./TemplateGallery";
import { TemplateStepper } from "./TemplateStepper";

export function HeaderBar({ onReset, onOpenTailor }: { onReset: () => void; onOpenTailor: () => void }) {
  const { resume, dispatch } = useResume();
  const t = resume.theme;
  const [panel, setPanel] = useState<null | "template" | "customize">(null);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [exportingWord, setExportingWord] = useState(false);
  const issueName = (resume.contact?.fullName || "").trim() || "Untitled issue";

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

  return (
    <header id="app-chrome" className="no-print border-b border-stone-300 bg-white">
      <div className="masthead-rule" />
      <div className="flex items-center gap-3 px-4 py-2.5 sm:px-6">
        <button type="button" onClick={() => setPanel(panel === "template" ? null : "template")} className="group flex items-center gap-2.5">
          <BrandMark size={32} />
          <span className="flex flex-col items-start leading-tight">
            <span className="font-serif text-[15px] font-bold tracking-tight text-stone-900">Imprint</span>
            <span className="folio hidden text-stone-500 sm:block">The resume press</span>
          </span>
        </button>

        <nav className="ml-2 flex flex-1 items-center gap-0.5 overflow-x-auto xl:gap-1">
          <button
            type="button"
            onClick={() => setPanel(panel === "template" ? null : "template")}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-sm font-medium transition ${
              panel === "template" ? "bg-amber-50 text-amber-700" : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <LayoutGrid size={15} /> <span className="hidden sm:inline">Template</span>
          </button>
          <button
            type="button"
            onClick={() => setPanel(panel === "customize" ? null : "customize")}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-sm font-medium transition ${
              panel === "customize" ? "bg-amber-50 text-amber-700" : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <Palette size={15} /> <span className="hidden sm:inline">Customize</span>
          </button>
          <button type="button" onClick={() => setShowChecklist((s) => !s)} className={`inline-flex shrink-0 items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-sm font-medium transition ${showChecklist ? "bg-amber-50 text-amber-700" : "text-stone-500 hover:text-stone-900"}`}>
            <Sparkles size={15} /> <span className="hidden lg:inline">Writing tips</span>
          </button>
          <button
            type="button"
            onClick={onOpenTailor}
            title="Tailor to a job"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-sm font-medium text-stone-500 transition hover:text-stone-900"
          >
            <ShieldCheck size={15} /> <span className="hidden xl:inline">Tailor to a job</span>
          </button>
          <button
            type="button"
            onClick={() => setShowImport(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-sm font-medium text-stone-500 transition hover:text-stone-900"
          >
            <Upload size={15} /> <span className="hidden lg:inline">Import CV</span>
          </button>
        </nav>

        <div className="flex shrink-0 items-center gap-1.5">
          <select
            value={t.pageSize ?? "a4"}
            onChange={(e) => dispatch({ type: "SET_THEME", theme: { pageSize: e.target.value as "a4" | "letter" } })}
            title="Page size"
            className="hidden rounded-sm border border-stone-300 bg-white px-2 py-1.5 text-xs font-medium text-stone-600 focus:outline-none focus:ring-1 focus:ring-amber-500 2xl:block"
          >
            <option value="a4">A4</option>
            <option value="letter">Letter</option>
          </select>
          <button
            type="button"
            title={t.atsSafe ? "ATS-safe mode on" : "Toggle ATS-safe mode"}
            onClick={() => dispatch({ type: "SET_THEME", theme: { atsSafe: !t.atsSafe } })}
            className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-1.5 text-xs font-medium transition ${
              t.atsSafe ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-stone-300 text-stone-500 hover:bg-stone-50"
            }`}
          >
            <ShieldCheck size={14} /> <span className="hidden sm:inline">ATS Safe</span>
          </button>
          <button
            type="button"
            title="Start fresh — clear all fields"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-sm border border-stone-300 px-2.5 py-1.5 text-xs font-medium text-stone-500 transition hover:bg-stone-50"
          >
            <RotateCcw size={14} />
          </button>
          <div className="flex shrink-0 flex-col items-stretch gap-0.5">
            <span className="folio hidden text-right text-stone-400 2xl:block">Export</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  try {
                    exportPdf(resume);
                  } catch (e) {
                    window.alert((e as Error).message || "Could not export PDF.");
                  }
                }}
                title="Download a PDF that matches this template exactly (print to PDF from the dialog)"
                className="inline-flex items-center gap-1.5 rounded-sm bg-stone-900 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800"
              >
                <FileDown size={15} /> <span className="hidden sm:inline">PDF</span>
                <span className="hidden text-[10px] font-normal text-stone-300 xl:inline">exact</span>
              </button>
              <button
                type="button"
                onClick={() => void exportWord()}
                disabled={exportingWord}
                title="Download a Word file that matches this template, same look as PDF"
                className="inline-flex items-center gap-1.5 rounded-sm border border-stone-300 px-2.5 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-wait disabled:opacity-60"
              >
                {exportingWord ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
                <span className="hidden sm:inline">{exportingWord ? "Exporting" : "Word"}</span>
                <span className="hidden text-[10px] text-stone-400 xl:inline">exact</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-stone-200 px-4 py-1.5 sm:px-6">
        <span className="folio text-stone-500">The current issue</span>
        <span className="folio text-stone-500">·</span>
        <span className="folio truncate text-stone-600">{issueName}</span>
        <span className="ml-auto flex shrink-0 items-center gap-3">
          <TemplateStepper keyboard />
          <span className="folio hidden text-stone-500 sm:inline">{t.pageSize?.toUpperCase() ?? "A4"}</span>
          {t.fontPair === "editorial" ? <span className="folio hidden text-stone-500 sm:inline">Editorial</span> : null}
        </span>
      </div>

      {panel === "template" ? <TemplateGallery onClose={() => setPanel(null)} /> : null}

      {panel === "customize" ? (
        <div className="border-t border-stone-200 bg-white px-4 py-3 sm:px-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                <Palette size={12} className="text-stone-500" /> Accent color
              </p>
              <div className="flex flex-wrap gap-2">
                {ACCENT_PALETTE.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.name}
                    onClick={() => dispatch({ type: "SET_THEME", theme: { accent: c.value } })}
                    className={`h-7 w-7 rounded-full transition ${t.accent === c.value ? "ring-2 ring-amber-600 ring-offset-2" : "hover:scale-110"}`}
                    style={{ background: c.value }}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                <Type size={12} className="text-stone-500" /> Font pairing
              </p>
              <div className="flex flex-col gap-1.5">
                {FONT_PAIRS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => dispatch({ type: "SET_THEME", theme: { fontPair: f.key } })}
                    className={`flex items-center justify-between rounded-sm border px-3 py-1.5 text-left text-xs transition ${t.fontPair === f.key ? "border-amber-600 bg-amber-50 text-amber-900" : "border-stone-200 text-stone-600 hover:bg-stone-50"}`}
                  >
                    <span style={{ fontFamily: f.display }}>{f.label}</span>
                    <span className="text-[10px] text-stone-500">{f.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                <LayoutGrid size={12} className="text-stone-500" /> Density
              </p>
              <div className="flex flex-col gap-1.5">
                {(["comfortable", "compact"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => dispatch({ type: "SET_THEME", theme: { density: d } })}
                    className={`rounded-sm border px-3 py-1.5 text-left text-xs capitalize transition ${t.density === d ? "border-amber-600 bg-amber-50 text-amber-900" : "border-stone-200 text-stone-600 hover:bg-stone-50"}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-500">Citation style</p>
                <select
                  value={t.citationFormat ?? "apa"}
                  onChange={(e) => dispatch({ type: "SET_THEME", theme: { citationFormat: e.target.value as "apa" | "mla" | "chicago" } })}
                  className="w-full rounded-sm border border-stone-300 px-2 py-1.5 text-xs text-stone-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="apa">APA</option>
                  <option value="mla">MLA</option>
                  <option value="chicago">Chicago</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showChecklist ? <WritingTips onClose={() => setShowChecklist(false)} /> : null}
      {showImport ? <ImportDialog onClose={() => setShowImport(false)} /> : null}
    </header>
  );
}

function WritingTips({ onClose }: { onClose: () => void }) {
  return (
    <div className="border-t border-stone-200 bg-stone-50 px-4 py-3 sm:px-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="folio mb-2 text-stone-500">Copy desk — bullet formula &amp; writing rules</p>
          <div className="grid grid-cols-1 gap-x-8 gap-y-1 text-xs leading-relaxed text-stone-700 sm:grid-cols-2">
            <p>• Formula: <strong>Action verb + task + method + quantified result</strong>.</p>
            <p>• No first-person pronouns (I, my, me) — implied first person only.</p>
            <p>• Quantify at least half your bullets (%, $, team size, time saved).</p>
            <p>• Keep bullets to 1–2 lines (~12–22 words).</p>
            <p>• Past tense for past roles, present tense for your current role. Never mix.</p>
            <p>• Avoid vague filler: hardworking, team player, detail-oriented.</p>
            <p>• Skip “Responsible for” / “Duties included” openers.</p>
            <p>• Never fabricate numbers — ask for a real figure.</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100">
          <EyeOff size={15} />
        </button>
      </div>
    </div>
  );
}
