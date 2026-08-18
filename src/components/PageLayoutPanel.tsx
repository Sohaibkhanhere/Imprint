import { useState } from "react";
import { Link2, Link2Off } from "lucide-react";
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

function Chip({ on, children, onClick, title }: { on: boolean; children: string; onClick: () => void; title?: string }) {
  return (
    <button type="button" title={title} onClick={onClick} className={`desk-chip${on ? " is-on" : ""}`}>
      {children}
    </button>
  );
}

function MmField({ label, title, value, onChange }: { label: string; title: string; value: number; onChange: (n: number) => void }) {
  return (
    <label className="page-margin-field" title={title}>
      <span>{label}</span>
      <span className="page-margin-input">
        <input type="number" min={MARGIN_MIN} max={MARGIN_MAX} step={1} value={value} aria-label={`${title} margin in millimetres`} onChange={(e) => onChange(Number(e.target.value))} />
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
    <div className="customize-stack">
      <div className="customize-line">
        <p className="customize-label">Paper</p>
        <div className="customize-line-body">
          {SIZES.map((s) => (
            <Chip key={s.key} on={pageSize === s.key} title={s.hint} onClick={() => dispatch({ type: "SET_THEME", theme: patchPageSize(t, s.key) })}>
              {s.label}
            </Chip>
          ))}
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
      <div className="customize-line">
        <p className="customize-label">Margins</p>
        <div className="customize-line-body">
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
          <MmField label="T" title="Top" value={margins.top} onChange={(n) => setSide("top", n)} />
          <MmField label="L" title="Left" value={margins.left} onChange={(n) => setSide("left", n)} />
          <MmField label="R" title="Right" value={margins.right} onChange={(n) => setSide("right", n)} />
          <MmField label="B" title="Bottom" value={margins.bottom} onChange={(n) => setSide("bottom", n)} />
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
            <span>{linked ? "Linked" : "Unlock"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
