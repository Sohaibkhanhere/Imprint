import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useResume } from "../store/resumeStore";
import { getTemplate } from "../templates/registry";
import { PAGE_DIMS } from "../templates/shared";
import { PAGE_STACK_GAP } from "../templates/paginate";
import { ErrorBoundary } from "./ErrorBoundary";
import { TemplateStepper } from "./TemplateStepper";
import { PreviewInteract } from "./PreviewInteract";
import { applyPageStyle } from "../lib/pdf";

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 1.6;
const ZOOM_STEP = 0.1;

function countPreviewPages(host: HTMLElement | null): number {
  if (!host) return 1;
  const stack = host.querySelector(".resume-folio-stack");
  if (stack) {
    const n = Number(stack.getAttribute("data-page-count"));
    if (n > 0) return n;
  }
  return host.querySelectorAll(".resume-sheet:not(.resume-sheet-measure)").length || 1;
}

function clampZoom(n: number) {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(n * 20) / 20));
}

export function PreviewPane({ onPages }: { onPages?: (pages: number) => void }) {
  const { resume } = useResume();
  const frameRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(0.72);
  const [zoom, setZoom] = useState<number | null>(null);
  const [pages, setPages] = useState(1);
  const zoomRef = useRef(zoom);
  const fitRef = useRef(fitScale);
  zoomRef.current = zoom;
  fitRef.current = fitScale;

  const liveTheme = resume.theme;
  const template = getTemplate(liveTheme.template);
  const Template = template.component;
  const page = PAGE_DIMS[liveTheme.pageSize] ?? PAGE_DIMS.a4;
  const maxPages = liveTheme.maxPages ?? 1;
  const scale = zoom ?? fitScale;
  const innerH = pages * page.height + Math.max(0, pages - 1) * PAGE_STACK_GAP;
  const visualW = page.width * scale;
  const visualH = innerH * scale;
  const overLimit = pages > maxPages;
  const zoomPct = Math.round(scale * 100);

  useEffect(() => {
    applyPageStyle(resume.theme.pageSize ?? "a4");
  }, [resume.theme.pageSize]);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const gutter = w < 640 ? 16 : w < 1024 ? 28 : 40;
      const next = Math.min(1, Math.max(0.28, (w - gutter) / page.width));
      setFitScale((prev) => (Math.abs(prev - next) < 0.004 ? prev : next));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [page.width]);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const current = zoomRef.current ?? fitRef.current;
      const next = clampZoom(current + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
      setZoom(next);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useLayoutEffect(() => {
    const host = sheetRef.current;
    if (!host) return;
    const update = () => {
      const n = countPreviewPages(host);
      setPages((prev) => (prev === n ? prev : n));
      onPages?.(n);
    };
    update();
    const mo = new MutationObserver(update);
    mo.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-page-count"] });
    return () => mo.disconnect();
  }, [onPages, liveTheme.template, liveTheme.pageSize]);

  const bump = (dir: -1 | 1) => {
    const current = zoom ?? fitScale;
    setZoom(clampZoom(current + dir * ZOOM_STEP));
  };

  return (
    <div className="relative h-full">
      <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center px-3">
        <div className="pointer-events-auto no-print">
          <TemplateStepper size="bar" />
        </div>
      </div>
      <div ref={frameRef} id="preview-frame" className="preview-frame">
        <div className="preview-canvas" style={{ width: visualW }}>
          {overLimit ? (
            <div className="preview-overflow-warn no-print" role="status">
              Your content doesn't fit in {maxPages} page(s). Trim content or increase the page limit.
            </div>
          ) : null}
          <div className="preview-canvas-clip" style={{ width: visualW, height: visualH }}>
            <div
              className="preview-canvas-inner"
              style={{
                width: page.cssWidth,
                height: innerH,
                transform: `translateZ(0) scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              <div ref={sheetRef} className="preview-sheet relative">
                <ErrorBoundary
                  key={liveTheme.template}
                  fallback={() => (
                    <div className="flex h-64 flex-col items-center justify-center gap-2 bg-white px-6 text-center">
                      <p className="text-sm font-bold text-[#151c24]">This layout couldn't render this data</p>
                      <p className="text-xs text-[#5c5c5c]">A field in your resume is confusing this template. Try another layout or fix the affected section. Your data is safe.</p>
                    </div>
                  )}
                >
                  <Template resume={resume} />
                </ErrorBoundary>
                <PreviewInteract hostRef={sheetRef} />
              </div>
            </div>
          </div>
          <div className="preview-folio">
            <span className={`folio ${liveTheme.atsSafe ? "text-[#5eead4]" : ""}`}>{liveTheme.atsSafe ? "ATS Safe" : "Preview"}</span>
            <span className="folio truncate text-stone-600">{(resume.contact?.fullName || "").trim() || "Untitled resume"}</span>
            <span className="folio">
              <span className="folio-tick">·</span> {template.label} <span className="folio-tick">·</span> {page.label}
              <span className="folio-tick">·</span> {pages} page{pages === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <div className="preview-pagecount" data-noprint>
          {page.label} / {pages}
        </div>
        <div className="preview-zoom no-print" data-noprint>
          <button type="button" title="Zoom out" aria-label="Zoom out" onClick={() => bump(-1)} disabled={scale <= ZOOM_MIN + 0.001}>
            <Minus size={14} />
          </button>
          <button
            type="button"
            className={`preview-zoom-fit${zoom == null ? " is-on" : ""}`}
            title="Fit to pane"
            onClick={() => setZoom(null)}
          >
            {zoom == null ? "Fit" : `${zoomPct}%`}
          </button>
          <button type="button" title="Zoom in" aria-label="Zoom in" onClick={() => bump(1)} disabled={scale >= ZOOM_MAX - 0.001}>
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
