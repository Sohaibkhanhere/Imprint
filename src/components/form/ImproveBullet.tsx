import { useEffect, useMemo, useState } from "react";
import { Sparkles, Check, RotateCcw, X } from "lucide-react";
import { improveBullet, verbSuggestions } from "../../lib/improveBullet";
import { Button } from "../ui";

interface Props {
  bullet: string;
  present: boolean;
  onApply: (text: string) => void;
  onClose: () => void;
}

export function ImproveBulletDialog({ bullet, present, onApply, onClose }: Props) {
  const result = useMemo(() => improveBullet(bullet, { present }), [bullet, present]);
  const [draft, setDraft] = useState(result.suggested);
  const [number, setNumber] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const suggestions = result.verb ? verbSuggestions(result.category) : verbSuggestions("achievement");

  const applyNumber = () => {
    if (!number.trim()) return;
    setDraft((d) => d.replace(/\s*\.$/, "") + ` (e.g. ${number.trim()}) ` + ".");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Sparkles size={16} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-stone-900">Improve this bullet</h3>
              <p className="text-xs text-stone-500">Action verb + what you did + measurable result</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-700" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="mb-2 rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500 line-through decoration-stone-300">
          {bullet.trim() || "—"}
        </div>

        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-amber-300 bg-amber-50/40 px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
        />

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {result.needsNumber ? (
            <>
              <input
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="Add a real number (22%, $50K, 12h/week)"
                className="min-w-0 flex-1 rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                onKeyDown={(e) => e.key === "Enter" && applyNumber()}
              />
              <Button type="button" variant="outline" onClick={applyNumber} className="py-1.5 text-xs">
                Insert
              </Button>
            </>
          ) : null}
        </div>

        {result.fixes.length > 0 ? (
          <ul className="mt-3 space-y-1.5">
            {result.fixes.map((f, i) => (
              <li key={i} className="flex gap-2 text-xs leading-snug text-stone-600">
                <span className="mt-0.5 shrink-0 text-amber-600">•</span>
                {f}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-500">Try a different verb</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((v) => {
              const active = draft.startsWith(v) || draft.startsWith(v.toLowerCase());
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setDraft(draft.replace(/^[A-Za-z]+/, v).replace(/^[a-z]/, (c) => c.toUpperCase()))}
                  className={`rounded-md border px-2 py-1 text-xs font-medium transition ${active ? "border-amber-500 bg-amber-50 text-amber-800" : "border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50"}`}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button type="button" onClick={() => setDraft(bullet)} className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800">
            <RotateCcw size={13} /> Reset to original
          </button>
          <Button onClick={() => onApply(draft.trim())} className="inline-flex items-center gap-1.5">
            <Check size={15} /> Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
