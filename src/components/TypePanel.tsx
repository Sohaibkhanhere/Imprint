import { ALargeSmall, Baseline, Rows3 } from "lucide-react";
import { useResume } from "../store/resumeStore";
import type { Density, LineHeight, TypeSize } from "../lib/types";

function Chip({
  on,
  children,
  onClick,
}: {
  on: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-sm border px-2.5 py-1.5 text-xs font-medium capitalize ${
        on ? "border-amber-600 bg-amber-50 text-amber-900" : "border-stone-200 text-stone-600 hover:bg-stone-200"
      }`}
    >
      {children}
    </button>
  );
}

export function TypePanel() {
  const { resume, dispatch } = useResume();
  const t = resume.theme;
  const typeSize: TypeSize = t.typeSize === "small" || t.typeSize === "large" ? t.typeSize : "medium";
  const density: Density = t.density === "compact" || t.density === "roomy" ? t.density : "comfortable";
  const lead: LineHeight = t.lineHeight === "tight" || t.lineHeight === "relaxed" ? t.lineHeight : "normal";

  return (
    <div className="mb-5">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
        <ALargeSmall size={12} className="text-stone-500" /> Type
      </p>
      <p className="mb-3 text-xs text-stone-500">Printed type. Use the zoom bar on the preview to make the sheet larger on screen.</p>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-400">Text size</p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {(["small", "medium", "large"] as const).map((size) => (
          <Chip key={size} on={typeSize === size} onClick={() => dispatch({ type: "SET_THEME", theme: { typeSize: size } })}>
            {size}
          </Chip>
        ))}
      </div>
      <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
        <Rows3 size={11} /> Spacing
      </p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {(["compact", "comfortable", "roomy"] as const).map((d) => (
          <Chip key={d} on={density === d} onClick={() => dispatch({ type: "SET_THEME", theme: { density: d } })}>
            {d}
          </Chip>
        ))}
      </div>
      <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
        <Baseline size={11} /> Line height
      </p>
      <div className="flex flex-wrap gap-1.5">
        {(["tight", "normal", "relaxed"] as const).map((h) => (
          <Chip key={h} on={lead === h} onClick={() => dispatch({ type: "SET_THEME", theme: { lineHeight: h } })}>
            {h}
          </Chip>
        ))}
      </div>
    </div>
  );
}
