import { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useResume } from "../store/resumeStore";
import { TEMPLATES, adjacentTemplate, templatesForStepper, themePatchForTemplate } from "../templates/registry";

export function useCycleTemplate(opts?: { keyboard?: boolean }) {
  const { resume, dispatch } = useResume();
  const atsOnly = Boolean(resume.theme.atsSafe);
  const list = templatesForStepper(atsOnly);
  const index = Math.max(0, list.findIndex((t) => t.key === resume.theme.template));
  const current = list[index] ?? list[0] ?? TEMPLATES[0];

  const go = (dir: -1 | 1) => {
    const next = adjacentTemplate(resume.theme.template, dir, atsOnly);
    dispatch({ type: "SET_THEME", theme: themePatchForTemplate(next.key) });
  };

  useEffect(() => {
    if (!opts?.keyboard) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const next = adjacentTemplate(resume.theme.template, e.key === "ArrowLeft" ? -1 : 1, atsOnly);
      dispatch({ type: "SET_THEME", theme: themePatchForTemplate(next.key) });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [opts?.keyboard, resume.theme.template, atsOnly, dispatch]);

  return { current, index, total: list.length, go };
}

export function TemplateStepper({
  keyboard = false,
  size = "compact",
}: {
  keyboard?: boolean;
  size?: "compact" | "bar";
}) {
  const { current, index, total, go } = useCycleTemplate({ keyboard });
  const bar = size === "bar";

  return (
    <div className={`flex items-center gap-1 ${bar ? "rounded-sm border border-stone-300 bg-stone-50/95 px-1.5 py-1 shadow-sm backdrop-blur-sm" : ""}`}>
      <button
        type="button"
        onClick={() => go(-1)}
        title="Previous layout"
        aria-label="Previous layout"
        className={`inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 hover:text-stone-900 ${bar ? "border border-transparent hover:border-stone-200" : "border border-stone-300"}`}
      >
        <ChevronLeft size={14} />
        <span className={bar ? "hidden sm:inline" : "hidden lg:inline"}>Previous</span>
      </button>
      <div className={`min-w-0 px-1.5 text-center ${bar ? "min-w-[6.5rem] sm:min-w-[9.5rem]" : ""}`}>
        <p className="truncate text-xs font-semibold text-stone-900">{current.label}</p>
        <p className="folio text-[10px] text-stone-400">
          {index + 1} / {total}
        </p>
      </div>
      <button
        type="button"
        onClick={() => go(1)}
        title="Next layout"
        aria-label="Next layout"
        className={`inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 hover:text-stone-900 ${bar ? "border border-transparent hover:border-stone-200" : "border border-stone-300"}`}
      >
        <span className={bar ? "hidden sm:inline" : "hidden lg:inline"}>Next</span>
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
