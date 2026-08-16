import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, Search, X } from "lucide-react";
import { useResume } from "../store/resumeStore";
import {
  FINISH_FILTERS,
  ROLE_FILTERS,
  TEMPLATES,
  templateDefaultAccent,
  templateMatches,
  type FinishFilter,
  type RoleFilter,
} from "../templates/registry";
import { PAGE_DIMS } from "../templates/shared";
import type { Resume } from "../lib/types";
import { resumeForGalleryPreview, resumeLooksEmpty } from "../lib/sampleData";
import { TemplateStepper } from "./TemplateStepper";

function useInView(rootMargin = "240px") {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);
  return { ref, visible };
}

function useBoxWidth() {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return { box, width };
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-sm border px-2.5 py-1 text-[11px] font-semibold tracking-wide transition ${
        active
          ? "border-amber-600 bg-amber-50 text-amber-800"
          : "border-stone-300 bg-white text-stone-600 hover:border-stone-500 hover:text-stone-900"
      }`}
    >
      {children}
    </button>
  );
}

function LayoutCard({
  tp,
  resume,
  active,
  sample,
  onApply,
}: {
  tp: (typeof TEMPLATES)[number];
  resume: Resume;
  active: boolean;
  sample: boolean;
  onApply: () => void;
}) {
  const { ref, visible } = useInView("280px");
  const { box, width } = useBoxWidth();
  const Template = tp.component;
  const page = PAGE_DIMS[resume.theme?.pageSize] ?? PAGE_DIMS.a4;
  const scale = width ? width / page.width : 0;
  return (
    <div ref={ref} id={`layout-card-${tp.key}`}>
      <button
        type="button"
        onClick={onApply}
        className={`group flex w-full flex-col rounded-sm border bg-white p-3 text-left transition ${
          active ? "border-amber-600 ring-2 ring-amber-500/30" : "border-stone-300 hover:border-stone-500 hover:shadow-md"
        }`}
      >
        <div
          ref={box}
          className="relative w-full overflow-hidden rounded-sm border border-stone-200 bg-white"
          style={{ aspectRatio: `${page.width} / ${page.height}` }}
        >
          {visible && scale ? (
            <span
              className="pointer-events-none absolute left-0 top-0 block origin-top-left overflow-hidden"
              style={{
                width: page.cssWidth,
                minHeight: page.cssHeight,
                transform: `scale(${scale})`,
              }}
            >
              <Template resume={{ ...resume, theme: { ...resume.theme, template: tp.key, accent: templateDefaultAccent(tp.key) } }} />
            </span>
          ) : (
            <span className="absolute inset-0 bg-stone-50" />
          )}
          {sample ? (
            <span className="absolute left-1.5 top-1.5 z-10 rounded-sm bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-500 shadow-sm">
              Sample
            </span>
          ) : null}
          {active ? (
            <span className="absolute right-1.5 top-1.5 z-10 inline-flex items-center gap-1 rounded-sm bg-amber-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
              <Check size={10} /> Current
            </span>
          ) : null}
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-stone-900">{tp.label}</span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-stone-400">{tp.atsSafeVariant ? "ATS safe" : "Visual"}</span>
        </div>
        <p className="mt-1 text-xs leading-snug text-stone-500">{tp.description}</p>
      </button>
    </div>
  );
}

export function TemplateGallery({ onClose }: { onClose: () => void }) {
  const { resume, dispatch } = useResume();
  const [thumbResume] = useState(() => resumeForGalleryPreview(resume));
  const showingSample = resumeLooksEmpty(resume);
  const [query, setQuery] = useState("");
  const [finish, setFinish] = useState<FinishFilter>("all");
  const [role, setRole] = useState<RoleFilter>("all");

  const filtered = useMemo(
    () => TEMPLATES.filter((tp) => templateMatches(tp, query, finish, role)),
    [query, finish, role],
  );

  const filtersActive = finish !== "all" || role !== "all" || query.trim().length > 0;

  const applyLayout = (key: (typeof TEMPLATES)[number]["key"]) => {
    dispatch({ type: "SET_THEME", theme: { template: key, accent: templateDefaultAccent(key) } });
  };

  const clearFilters = () => {
    setQuery("");
    setFinish("all");
    setRole("all");
  };

  useEffect(() => {
    document.getElementById(`layout-card-${resume.theme.template}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [resume.theme.template]);

  return (
    <div className="no-print fixed inset-0 z-50 flex items-end justify-center bg-stone-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="flex max-h-[100dvh] w-full flex-col rounded-none bg-stone-100 shadow-2xl sm:max-h-[92vh] sm:w-[min(1180px,96vw)] sm:rounded-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-wrap items-center gap-2 rounded-none border-b border-stone-300 bg-white px-4 py-3 sm:gap-3 sm:rounded-t-sm sm:px-5">
          <div className="min-w-0 flex-1">
            <p className="font-serif text-base font-bold text-stone-900">Template gallery</p>
            <p className="folio text-stone-500">
              {filtered.length === TEMPLATES.length
                ? `${TEMPLATES.length} layouts`
                : `${filtered.length} of ${TEMPLATES.length} layouts`}
              {showingSample ? " · sample text so you can see the design" : ""}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <TemplateStepper />
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-sm bg-stone-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-stone-800"
            >
              Done
            </button>
            <button type="button" onClick={onClose} className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100" aria-label="Close gallery">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="border-b border-stone-300 bg-white px-5 py-3">
          <label className="relative block">
            <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name"
              className="w-full rounded-sm border border-stone-300 bg-stone-50 py-2 pl-8 pr-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-amber-600 focus:bg-white"
            />
          </label>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {FINISH_FILTERS.map((f) => (
              <Chip key={f.id} active={finish === f.id} onClick={() => setFinish(f.id)}>
                {f.label}
              </Chip>
            ))}
            <span className="mx-1 hidden h-4 w-px bg-stone-300 sm:block" aria-hidden />
            {ROLE_FILTERS.map((f) => (
              <Chip key={f.id} active={role === f.id} onClick={() => setRole(f.id)}>
                {f.label}
              </Chip>
            ))}
            {filtersActive ? (
              <button type="button" onClick={clearFilters} className="ml-auto text-[11px] font-semibold text-amber-700 hover:text-amber-900">
                Clear
              </button>
            ) : null}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-5 py-16 text-center">
            <p className="font-serif text-lg font-bold text-stone-900">No layouts match</p>
            <p className="text-sm text-stone-500">Try another name, or clear the filters.</p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-2 rounded-sm bg-stone-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-stone-800"
            >
              Show all layouts
            </button>
          </div>
        ) : (
          <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tp) => (
              <LayoutCard
                key={tp.key}
                tp={tp}
                resume={thumbResume}
                active={resume.theme.template === tp.key}
                sample={showingSample}
                onApply={() => applyLayout(tp.key)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
