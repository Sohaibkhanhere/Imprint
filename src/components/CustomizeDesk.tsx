import { useState } from "react";
import { ACCENT_PALETTE, FONT_PAIRS } from "../lib/sampleData";
import { RESUME_TYPES, getResumeType } from "../lib/resumeTypes";
import type { ResumeTypeKey } from "../lib/types";
import { useResume } from "../store/resumeStore";
import { PageLayoutPanel } from "./PageLayoutPanel";
import { TypePanel } from "./TypePanel";

type DeskTab = "format" | "page" | "type" | "look";

const TABS: { id: DeskTab; label: string }[] = [
  { id: "format", label: "Format" },
  { id: "page", label: "Page" },
  { id: "type", label: "Type" },
  { id: "look", label: "Look" },
];

const FORMAT_CHIP: Record<ResumeTypeKey, string> = {
  combination: "Combination",
  chronological: "Chronological",
  functional: "Skills-based",
  executive: "Executive",
  "entry-level": "First job",
  creative: "Creative",
  cv: "Academic CV",
};

export function CustomizeDesk() {
  const { resume, dispatch } = useResume();
  const t = resume.theme;
  const [tab, setTab] = useState<DeskTab>("format");
  const typeDef = getResumeType(resume.meta.type);

  return (
    <div className="customize-desk">
      <div className="customize-tabs" role="tablist" aria-label="Customize">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`desk-chip customize-tab${tab === item.id ? " is-on" : ""}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "format" ? (
        <div className="customize-pane" role="tabpanel">
          <div className="customize-line-body">
            {RESUME_TYPES.map((fmt) => {
              const on = resume.meta.type === fmt.key;
              return (
                <button
                  key={fmt.key}
                  type="button"
                  title={fmt.bestFor}
                  onClick={() => dispatch({ type: "SET_TYPE", value: fmt.key })}
                  className={`desk-chip${on ? " is-on" : ""}`}
                >
                  {FORMAT_CHIP[fmt.key]}
                </button>
              );
            })}
          </div>
          <p className="customize-hint">{typeDef.bestFor}</p>
        </div>
      ) : null}

      {tab === "page" ? (
        <div className="customize-pane" role="tabpanel">
          <PageLayoutPanel />
        </div>
      ) : null}

      {tab === "type" ? (
        <div className="customize-pane" role="tabpanel">
          <TypePanel />
        </div>
      ) : null}

      {tab === "look" ? (
        <div className="customize-pane" role="tabpanel">
          <div className="customize-stack">
            <div className="customize-line">
              <p className="customize-label">Accent</p>
              <div className="customize-line-body">
                <div className="customize-swatches">
                  {ACCENT_PALETTE.map((c) => {
                    const on = t.accent === c.value;
                    return (
                      <button key={c.value} type="button" title={c.name} onClick={() => dispatch({ type: "SET_THEME", theme: { accent: c.value } })} className={`customize-swatch${on ? " is-on" : ""}`}>
                        <span style={{ background: c.value }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="customize-line">
              <p className="customize-label">Font</p>
              <div className="customize-line-body">
                {FONT_PAIRS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => dispatch({ type: "SET_THEME", theme: { fontPair: f.key } })}
                    className={`desk-chip customize-font${t.fontPair === f.key ? " is-on" : ""}`}
                  >
                    <span style={{ fontFamily: f.display }}>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="customize-line">
              <p className="customize-label">Cite</p>
              <div className="customize-line-body">
                <label className="customize-cite">
                  <select
                    value={t.citationFormat ?? "apa"}
                    onChange={(e) => dispatch({ type: "SET_THEME", theme: { citationFormat: e.target.value as "apa" | "mla" | "chicago" } })}
                    aria-label="Citation style"
                  >
                    <option value="apa">APA</option>
                    <option value="mla">MLA</option>
                    <option value="chicago">Chicago</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
