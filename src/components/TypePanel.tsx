import { useResume } from "../store/resumeStore";
import type { Density, LineHeight, TypeSize } from "../lib/types";

function Chip({ on, children, onClick }: { on: boolean; children: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`desk-chip${on ? " is-on" : ""}`}>
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
    <div className="customize-stack">
      <div className="customize-line">
        <p className="customize-label">Size</p>
        <div className="customize-line-body">
          {([
            ["small", "Small"],
            ["medium", "Medium"],
            ["large", "Large"],
          ] as const).map(([size, label]) => (
            <Chip key={size} on={typeSize === size} onClick={() => dispatch({ type: "SET_THEME", theme: { typeSize: size } })}>
              {label}
            </Chip>
          ))}
        </div>
      </div>
      <div className="customize-line">
        <p className="customize-label">Space</p>
        <div className="customize-line-body">
          {([
            ["compact", "Compact"],
            ["comfortable", "Comfortable"],
            ["roomy", "Roomy"],
          ] as const).map(([d, label]) => (
            <Chip key={d} on={density === d} onClick={() => dispatch({ type: "SET_THEME", theme: { density: d } })}>
              {label}
            </Chip>
          ))}
        </div>
      </div>
      <div className="customize-line">
        <p className="customize-label">Lead</p>
        <div className="customize-line-body">
          {([
            ["tight", "Tight"],
            ["normal", "Normal"],
            ["relaxed", "Relaxed"],
          ] as const).map(([h, label]) => (
            <Chip key={h} on={lead === h} onClick={() => dispatch({ type: "SET_THEME", theme: { lineHeight: h } })}>
              {label}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}
