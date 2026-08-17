import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PAGE_DIMS } from "../../templates/shared";
import { AtsSafeTemplate } from "../../templates/ats-safe";
import { GiltTemplate } from "../../templates/html-pack";
import { createDemoResume } from "../../lib/sampleData";
import { templateDefaultAccent } from "../../templates/registry";

export function LivePreview() {
  const resume = useMemo(() => createDemoResume(), []);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SheetCard label="ATS Safe layout" note="Parser sheet, same sample person">
        <AtsSafeTemplate
          resume={{
            ...resume,
            theme: { ...resume.theme, template: "classic", accent: templateDefaultAccent("classic"), atsSafe: true },
          }}
        />
      </SheetCard>
      <SheetCard label="Designed layout" note="Gold Ring template, same content">
        <GiltTemplate
          resume={{
            ...resume,
            theme: { ...resume.theme, template: "gilt", accent: templateDefaultAccent("gilt"), atsSafe: false },
          }}
        />
      </SheetCard>
    </div>
  );
}

function SheetCard({ label, note, children }: { label: string; note: string; children: ReactNode }) {
  const page = PAGE_DIMS.a4;
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const sync = () => setScale(el.clientWidth / page.width);
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    sync();
    return () => ro.disconnect();
  }, [page.width]);

  return (
    <figure className="min-w-0">
      <div
        ref={box}
        className="relative overflow-hidden rounded-sm border border-stone-300 bg-white"
        style={{ aspectRatio: `${page.width} / ${page.height}` }}
      >
        {scale ? (
          <div
            className="pointer-events-none absolute left-0 top-0 origin-top-left [&_.resume-sheet]:shadow-none"
            style={{
              width: page.cssWidth,
              minHeight: page.cssHeight,
              transform: `scale(${scale})`,
            }}
          >
            {children}
          </div>
        ) : (
          <div className="absolute inset-0 bg-stone-50" aria-hidden />
        )}
      </div>
      <figcaption className="mt-2">
        <p className="text-sm font-semibold text-stone-900">{label}</p>
        <p className="text-xs text-stone-500">{note}</p>
      </figcaption>
    </figure>
  );
}
