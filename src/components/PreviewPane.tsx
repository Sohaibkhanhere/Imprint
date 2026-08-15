import { useDeferredValue, useEffect, useRef, useState } from "react";
import { useResume } from "../store/resumeStore";
import { getTemplate } from "../templates/registry";
import { PAGE_DIMS } from "../templates/shared";
import { ErrorBoundary } from "./ErrorBoundary";
import { TemplateStepper } from "./TemplateStepper";
import { applyPageStyle } from "../lib/pdf";

export function PreviewPane({ onPages }: { onPages?: (pages: number) => void }) {
  const { resume } = useResume();
  const deferred = useDeferredValue(resume);
  const frameRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.72);
  const [pages, setPages] = useState(1);

  const template = getTemplate(resume.theme.template);
  const Template = template.component;
  const page = PAGE_DIMS[resume.theme.pageSize] ?? PAGE_DIMS.a4;

  useEffect(() => {
    applyPageStyle(resume.theme.pageSize ?? "a4");
  }, [resume.theme.pageSize]);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      setScale(Math.min(1, (w - 40) / page.width));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [page.width]);

  useEffect(() => {
    setPages(1);
    onPages?.(1);
  }, [onPages, resume.theme.template, resume.theme.pageSize]);

  return (
    <div className="relative h-full">
      <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center px-3">
        <div className="pointer-events-auto no-print">
          <TemplateStepper size="bar" />
        </div>
      </div>
      <div ref={frameRef} id="preview-frame" className="preview-frame">
        <div className="preview-canvas" style={{ transform: `scale(${scale})`, width: page.cssWidth }}>
          <div ref={sheetRef} className="preview-sheet relative">
            <ErrorBoundary
              key={resume.theme.template}
              fallback={() => (
                <div className="flex h-64 flex-col items-center justify-center gap-2 bg-white px-6 text-center">
                  <p className="font-serif text-sm font-bold text-stone-900">The proof couldn't render this data</p>
                  <p className="text-xs text-stone-500">A field in your resume is confusing this template. Try another layout or fix the affected section — your data is safe.</p>
                </div>
              )}
            >
              <Template resume={deferred} />
            </ErrorBoundary>
          </div>
          <div className="preview-folio" style={{ width: page.cssWidth }}>
            <span className="folio">Proof</span>
            <span className="folio truncate text-stone-600">{(resume.contact?.fullName || "").trim() || "Untitled issue"}</span>
            <span className="folio">
              <span className="folio-tick">·</span> {template.label} <span className="folio-tick">·</span> {page.label}
            </span>
          </div>
        </div>
        <div className="preview-pagecount" data-noprint>
          {page.label} / {pages}
        </div>
      </div>
    </div>
  );
}
