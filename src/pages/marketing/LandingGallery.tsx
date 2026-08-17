import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PAGE_DIMS } from "../../templates/shared";
import { TEMPLATES, templateDefaultAccent } from "../../templates/registry";
import { TEMPLATE_COUNT } from "../../seo/brand";
import { createDemoResume } from "../../lib/sampleData";

const SHOW = TEMPLATES.filter((t) => ["classic", "executive", "gilt", "ribbon-navy", "grove", "boardroom"].includes(t.key));

export function LandingGallery() {
  const resume = useMemo(() => createDemoResume(), []);
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {SHOW.map((tp) => (
          <Thumb key={tp.key} tp={tp} resume={resume} />
        ))}
      </div>
      <p className="mt-4 text-sm text-stone-500">
        {TEMPLATE_COUNT} original templates in the builder, including these six.{" "}
        <Link className="font-semibold text-amber-600 hover:text-amber-500" to="/app">
          Open the full gallery
        </Link>
      </p>
    </div>
  );
}

function Thumb({
  tp,
  resume,
}: {
  tp: (typeof TEMPLATES)[number];
  resume: ReturnType<typeof createDemoResume>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [scale, setScale] = useState(0);
  const page = PAGE_DIMS.a4;
  const Template = tp.component;

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
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

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
    <div ref={ref}>
      <Link
        to={`/app?template=${tp.key}`}
        className="block rounded-sm border border-stone-300 bg-stone-50 p-2 transition hover:border-amber-500"
      >
        <div
          ref={box}
          className="relative overflow-hidden rounded-sm border border-stone-200 bg-white"
          style={{ aspectRatio: `${page.width} / ${page.height}` }}
        >
          {visible && scale ? (
            <span
              className="pointer-events-none absolute left-0 top-0 block origin-top-left [&_.resume-sheet]:shadow-none"
              style={{
                width: page.cssWidth,
                minHeight: page.cssHeight,
                transform: `scale(${scale})`,
              }}
            >
              <Template
                resume={{
                  ...resume,
                  theme: { ...resume.theme, template: tp.key, accent: templateDefaultAccent(tp.key), atsSafe: false },
                }}
              />
            </span>
          ) : (
            <span className="absolute inset-0 bg-stone-50" />
          )}
        </div>
        <p className="mt-2 text-sm font-semibold text-stone-900">{tp.label}</p>
      </Link>
    </div>
  );
}
