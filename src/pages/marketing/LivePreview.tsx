import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PAGE_DIMS } from "../../templates/shared";
import { AtsSafeTemplate } from "../../templates/ats-safe";
import { GiltTemplate, StreamTemplate } from "../../templates/html-pack";
import { DEFAULT_PORTRAIT } from "../../templates/graphical";
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

export function NetflixFeatured() {
  const resume = useMemo(() => createDemoResume(), []);
  return (
    <SheetCard label="Netflix layout" note="Black page, red marks, poster photo. Same sample person.">
      <StreamTemplate
        resume={{
          ...resume,
          contact: { ...resume.contact, photoUrl: resume.contact.photoUrl || DEFAULT_PORTRAIT },
          theme: { ...resume.theme, template: "stream", accent: templateDefaultAccent("stream"), atsSafe: false },
        }}
      />
    </SheetCard>
  );
}

function SheetCard({
  label,
  note,
  children,
  className = "",
}: {
  label: string;
  note: string;
  children: ReactNode;
  className?: string;
}) {
  const page = PAGE_DIMS.a4;
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const sync = () => {
      const next = el.clientWidth / page.width;
      setScale((prev) => (Math.abs(prev - next) < 0.004 ? prev : next));
    };
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    sync();
    return () => ro.disconnect();
  }, [page.width]);

  return (
    <figure className={`min-w-0 ${className}`.trim()}>
      <div
        ref={box}
        className="relative overflow-hidden rounded-sm border border-stone-300 bg-white"
        style={{ aspectRatio: `${page.width} / ${page.height}`, contain: "layout paint" }}
      >
        {scale ? (
          <div
            className="pointer-events-none absolute left-0 top-0 origin-top-left [&_.resume-sheet]:shadow-none"
            style={{
              width: page.cssWidth,
              minHeight: page.cssHeight,
              transform: `translateZ(0) scale(${scale})`,
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
