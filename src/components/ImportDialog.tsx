import { useState, useRef } from "react";
import { UploadCloud, FileText, Check, Loader2, AlertTriangle, X } from "lucide-react";
import { useResume } from "../store/resumeStore";
import { extractCvText, parseCvText, resumeFromDraft, hasMeaningfulContent, summarizeDraft, draftFromResume, type CvDraft } from "../lib/cvImport";
import { TEMPLATES } from "../templates/registry";
import type { TemplateKey } from "../lib/types";

export function ImportDialog({ onClose }: { onClose: () => void }) {
  const { resume, dispatch } = useResume();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<CvDraft | null>(null);
  const [fileName, setFileName] = useState("");
  const [template, setTemplate] = useState<TemplateKey | "">("");

  const handleFile = async (file: File | null | undefined) => {
    if (!file) return;
    setBusy(true);
    setError("");
    setDraft(null);
    try {
      const isPdf = /\.pdf$/i.test(file.name || "") || file.type === "application/pdf";
      if (isPdf) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const { readResumePayload } = await import("../lib/resumePayload");
        const embedded = readResumePayload(bytes);
        if (embedded) {
          setDraft(draftFromResume(embedded));
          setFileName(file.name);
          return;
        }
        const replay = new File([bytes], file.name, { type: file.type || "application/pdf" });
        const text = await extractCvText(replay);
        if (!text.trim()) throw new Error("This file has no readable text. Try a Word export, or type the details in Contents.");
        const parsed = parseCvText(text);
        if (!hasMeaningfulContent(parsed)) {
          const blob = text.replace(/\s+/g, " ").trim();
          if (blob.length >= 80) {
            parsed.summary = parsed.summary || blob.slice(0, 1400);
            parsed.warnings.push("This file did not split cleanly into sections. Check Contents and move items if needed.");
          } else {
            throw new Error("Couldn't find recognizable resume content (name, work, education). Try a PDF/DOCX exported from Word or Google Docs.");
          }
        }
        setDraft(parsed);
        setFileName(file.name);
        return;
      }
      const text = await extractCvText(file);
      if (!text.trim()) throw new Error("This file has no readable text. Try a Word export, or type the details in Contents.");
      const parsed = parseCvText(text);
      if (!hasMeaningfulContent(parsed)) {
        const blob = text.replace(/\s+/g, " ").trim();
        if (blob.length >= 80) {
          parsed.summary = parsed.summary || blob.slice(0, 1400);
          parsed.warnings.push("This file did not split cleanly into sections. Check Contents and move items if needed.");
        } else {
          throw new Error("Couldn't find recognizable resume content (name, work, education). Try a PDF/DOCX exported from Word or Google Docs.");
        }
      }
      setDraft(parsed);
      setFileName(file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong while reading the file.");
    } finally {
      setBusy(false);
    }
  };

  const doImport = () => {
    if (!draft) return;
    const theme = template
      ? { ...resume.theme, template }
      : { ...resume.theme };
    const imported = resumeFromDraft(draft, theme);
    dispatch({ type: "LOAD", resume: imported });
    onClose();
  };

  const summary = draft ? summarizeDraft(draft) : [];
  const warns = draft?.warnings ?? [];

  return (
    <div className="no-print fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[min(92dvh,100%)] w-full max-w-xl overflow-y-auto rounded-t-lg bg-stone-50 shadow-xl sm:rounded-sm" onClick={(e) => e.stopPropagation()}>
        <div className="masthead-rule" />
        <div className="flex items-start justify-between gap-3 border-b border-stone-300 px-4 py-3.5 sm:px-5">
          <div>
            <p className="qd-wordmark text-[22px] leading-none">Import resume</p>
            <p className="folio text-stone-500">Rebuilt into QD layouts, still fully editable</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md,.rtf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />

          {!draft ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed border-stone-300 bg-stone-50 px-6 py-10 text-center transition hover:border-amber-600 hover:bg-amber-50/50 disabled:opacity-60"
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
              }}
              onDrop={(e) => {
                e.preventDefault();
                void handleFile(e.dataTransfer.files?.[0]);
              }}
            >
              {busy ? <Loader2 size={28} className="animate-spin text-amber-700" /> : <UploadCloud size={28} className="text-stone-400" />}
              <span className="text-sm font-semibold text-stone-800">{busy ? "Reading the resume…" : "Choose your old resume file"}</span>
              <span className="text-xs text-stone-500">PDF, DOCX, or TXT · designed or scanned PDFs can take a few seconds</span>
            </button>
          ) : (
            <div>
              <div className="flex items-center justify-between rounded-sm border border-emerald-700/50 bg-emerald-950/60 px-3.5 py-2.5">
                <span className="flex items-center gap-2 text-sm font-medium text-emerald-200">
                  <FileText size={16} /> {fileName}
                </span>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="text-xs font-medium text-emerald-300 underline-offset-2 hover:underline"
                >
                  Choose another
                </button>
              </div>

              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-stone-500">What we found</p>
              <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {summary.map((s) => (
                  <span key={s.label} className="flex items-center gap-1.5 rounded-sm bg-stone-100 px-2.5 py-1.5 text-xs text-stone-700">
                    <Check size={13} className="shrink-0 text-emerald-600" />
                    <span className="truncate">{s.label}</span>
                    <span className="ml-auto text-stone-400">{s.count}</span>
                  </span>
                ))}
              </div>

              {warns.length ? (
                <div className="mt-3 rounded-sm border border-amber-200 bg-amber-50 px-3.5 py-2.5">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                    <AlertTriangle size={13} /> Review these after importing
                  </p>
                  <ul className="mt-1 list-inside list-disc text-xs leading-relaxed text-amber-800">
                    {warns.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <label className="mt-4 mb-1.5 block text-xs font-medium text-stone-600">Start with a layout</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setTemplate("")}
                  className={`rounded-sm border px-2.5 py-1.5 text-xs font-medium transition ${
                    template === "" ? "border-amber-600 bg-amber-50 text-amber-900" : "border-stone-300 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  Keep current ({resume.theme.template.replace(/-/g, " ")})
                </button>
                {TEMPLATES.map((tp) => (
                  <button
                    key={tp.key}
                    type="button"
                    onClick={() => setTemplate(tp.key)}
                    className={`rounded-sm border px-2.5 py-1.5 text-xs font-medium transition ${
                      template === tp.key ? "border-amber-600 bg-amber-50 text-amber-900" : "border-stone-300 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {tp.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error ? (
            <p className="mt-3 rounded-sm border border-red-800/60 bg-red-950/70 px-3.5 py-2.5 text-xs leading-relaxed text-red-200">{error}</p>
          ) : null}

          <div className="mt-5 flex flex-col-reverse gap-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] leading-snug text-stone-500">
              Imported resumes are rebuilt automatically. After import you can edit, customize, and switch templates freely.
            </p>
            <button
              type="button"
              onClick={doImport}
              disabled={!draft}
              className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-sm bg-amber-500 px-4 py-2 text-sm font-semibold text-stone-100 shadow-sm transition hover:bg-amber-400 disabled:opacity-40 sm:w-auto"
            >
              Import resume <UploadCloud size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
