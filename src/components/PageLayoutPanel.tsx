import { useState } from "react";
import { Link2, Link2Off, Ruler } from "lucide-react";
import { useResume } from "../store/resumeStore";
import type { PageMargins, PageSize } from "../lib/types";
import {
  DEFAULT_MARGINS,
  MARGIN_MAX,
  MARGIN_MIN,
  activeMarginPreset,
  marginsEqual,
  patchPageSize,
  presetMargins,
} from "../lib/pageLayout";

const SIZES: { key: PageSize; label: string; hint: string }[] = [
  { key: "a4", label: "A4", hint: "210 × 297 mm" },
  { key: "letter", label: "Letter", hint: "8.5 × 11 in" },
];

const PRESETS = [
  { key: "tight" as const, label: "Tight" },
  { key: "standard" as const, label: "Standard" },
  { key: "wide" as const, label: "Wide" },
];

function Chip({
  on,
  children,
  onClick,
  title,
}: {
  on: boolean;
  children: string;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-sm border px-2.5 py-1.5 text-left text-xs font-medium transition ${
        on ? "border-amber-600 bg-amber-50 text-amber-900" : "border-stone-200 text-stone-600 hover:bg-stone-200"
      }`}
    >
      {children}
    </button>
  );
}

function MmField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="page-margin-field">
      <span>{label}</span>
      <span className="page-margin-input">
        <input
          type="number"
          min={MARGIN_MIN}
          max={MARGIN_MAX}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <abbr title="millimetres">mm</abbr>
      </span>
    </label>
  );
}

export function PageLayoutPanel() {
  const { resume, dispatch } = useResume();
  const t = resume.theme;
  const pageSize: PageSize = t.pageSize === "letter" ? "letter" : "a4";
  const margins = t.margins ?? DEFAULT_MARGINS[pageSize];
  const preset = activeMarginPreset(margins, pageSize);
  const [linked, setLinked] = useState(() => marginsEqual(margins, { top: margins.top, right: margins.top, bottom: margins.top, left: margins.top }));

  const setMargins = (next: PageMargins) => {
    dispatch({ type: "SET_THEME", theme: { margins: next } });
  };

  const setSide = (side: keyof PageMargins, raw: number) => {
    if (linked) {
      const n = Number.isFinite(raw) ? raw : margins.top;
      setMargins({ top: n, right: n, bottom: n, left: n });
      return;
    }
    setMargins({ ...margins, [side]: raw });
  };

  return (
    <div className="mb-5">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
        <Ruler size={12} className="text-stone-500" /> Page layout
      </p>

      <div className="mb-3">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-400">Paper</p>
        <div className="flex flex-wrap gap-1.5">
          {SIZES.map((s) => (
            <Chip
              key={s.key}
              on={pageSize === s.key}
              title={s.hint}
              onClick={() => dispatch({ type: "SET_THEME", theme: patchPageSize(t, s.key) })}
            >
              {`${s.label} · ${s.hint}`}
            </Chip>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-400">Page limit</p>
        <div className="flex flex-wrap gap-1.5">
          {([1, 2] as const).map((n) => (
            <Chip
              key={n}
              on={(t.maxPages ?? 1) === n}
              title={n === 1 ? "Warn if the resume runs past one page" : "Allow two pages before the overflow warning"}
              onClick={() => dispatch({ type: "SET_THEME", theme: { maxPages: n } })}
            >
              {n === 1 ? "1 page" : "2 pages"}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-400">Margins</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <Chip
              key={p.key}
              on={preset === p.key}
              onClick={() => {
                const next = presetMargins(p.key, pageSize);
                setLinked(marginsEqual(next, { top: next.top, right: next.top, bottom: next.top, left: next.top }));
                setMargins(next);
              }}
            >
              {p.label}
            </Chip>
          ))}
          {preset === "custom" ? (
            <span className="rounded-sm border border-amber-600/40 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-900">Custom</span>
          ) : null}
        </div>

        <div className="page-layout-map">
          <MmField label="Top" value={margins.top} onChange={(n) => setSide("top", n)} />
          <div className="page-layout-mid">
            <MmField label="Left" value={margins.left} onChange={(n) => setSide("left", n)} />
            <div className={`page-layout-sheet${pageSize === "letter" ? " is-letter" : ""}`} aria-hidden>
              <span />
              <span />
              <span />
            </div>
            <MmField label="Right" value={margins.right} onChange={(n) => setSide("right", n)} />
          </div>
          <MmField label="Bottom" value={margins.bottom} onChange={(n) => setSide("bottom", n)} />
          <button
            type="button"
            className={`page-layout-link${linked ? " is-on" : ""}`}
            onClick={() => {
              const next = !linked;
              setLinked(next);
              if (next) setMargins({ top: margins.top, right: margins.top, bottom: margins.top, left: margins.top });
            }}
            title={linked ? "All sides use the same margin" : "Set each side separately"}
          >
            {linked ? <Link2 size={13} /> : <Link2Off size={13} />}
            {linked ? "Same on all sides" : "Sides unlocked"}
          </button>
        </div>
        <p className="mt-2 text-[11px] leading-snug text-stone-500">
          Live on Classic, ATS Safe, and other text layouts. Full-bleed designed templates keep their own edge.
        </p>
      </div>
    </div>
  );
}
