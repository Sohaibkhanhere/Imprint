import { lazy, Suspense, useMemo } from "react";
import { Link } from "react-router-dom";
import { MarketingChrome } from "./MarketingChrome";
import { FaqList } from "./FaqList";
import { SeoHead } from "../../seo/SeoHead";
import {
  BRAND,
  CITABLE_ANSWER,
  CLAIMS,
  COMPARE_PAGES,
  HOME_DESCRIPTION,
  HOME_FAQS,
  HOME_TITLE,
  TEMPLATE_COUNT,
  faqJsonLd,
  softwareJsonLd,
  webPageJsonLd,
} from "../../seo/brand";

const LivePreview = lazy(() => import("./LivePreview").then((m) => ({ default: m.LivePreview })));
const LandingGallery = lazy(() => import("./LandingGallery").then((m) => ({ default: m.LandingGallery })));

export function LandingPage() {
  const jsonLd = useMemo(() => [softwareJsonLd(), faqJsonLd(HOME_FAQS), webPageJsonLd({ path: "/", title: HOME_TITLE, description: HOME_DESCRIPTION })], []);

  return (
    <MarketingChrome>
      <SeoHead title={HOME_TITLE} description={HOME_DESCRIPTION} path="/" jsonLd={jsonLd} />
      <main>
        <section className="mx-auto grid max-w-6xl items-start gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:pt-14">
          <div>
            <p className="folio text-amber-500">{TEMPLATE_COUNT} templates · {CLAIMS.freeForever}</p>
            <h1 className="mt-3 max-w-[18ch] font-serif text-4xl font-semibold leading-[1.12] tracking-tight text-stone-900 md:text-5xl">
              Free resume builder. No sign-up, no watermark.
            </h1>
            <p className="mt-4 max-w-[46ch] text-lg leading-relaxed text-stone-700">
              {CITABLE_ANSWER}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/app"
                className="inline-flex min-h-11 items-center rounded-sm bg-amber-500 px-4 text-sm font-semibold text-stone-100 transition hover:bg-amber-400 active:scale-[0.98]"
              >
                Open the builder
              </Link>
              <a
                href="#layouts"
                className="inline-flex min-h-11 items-center rounded-sm border border-stone-300 px-4 text-sm font-semibold text-stone-800 transition hover:border-stone-500"
              >
                See layouts
              </a>
            </div>
            <p className="mt-6 max-w-[46ch] text-sm leading-relaxed text-stone-500">
              Includes a Netflix template for creative and tech roles.{" "}
              <a className="font-semibold text-amber-600 hover:text-amber-500" href="#netflix">
                See how it is built
              </a>
            </p>
          </div>
          <Suspense fallback={<div className="min-h-[28rem] rounded-sm border border-stone-300 bg-stone-50" />}>
            <LivePreview />
          </Suspense>
        </section>

        <section className="border-y border-stone-300 bg-stone-50">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <p className="max-w-[62ch] text-stone-600">
              Visible proof, not stock screenshots: live template count, free forever, and a real ATS sheet next to a designed layout.
            </p>
            <dl className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Proof n={String(TEMPLATE_COUNT)} label="original templates" />
              <Proof n="$0" label={CLAIMS.freeForever} />
              <Proof n="0" label="accounts to create" />
              <Proof n="PDF + Word" label={CLAIMS.noWatermark} />
            </dl>
          </div>
        </section>

        <section id="netflix" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="folio text-amber-500">Featured layout</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-stone-900">We also make a Netflix template</h2>
          <p className="mt-4 max-w-[62ch] text-stone-600">
            Most resume builders only ship a white office page. Resume by QD also includes a Netflix layout: black page, red marks, and a poster-style photo, built like a streaming profile rather than a Word document.
          </p>
          <p className="mt-3 max-w-[62ch] text-stone-600">
            Use it when the role is creative, tech, or portfolio-led and a recruiter will actually open the file. Name, title, and photo sit in a hero like a show card. Experience reads as a watch-list of roles. Education and skills sit in tiles. For job sites that parse resumes, keep the same content and turn on ATS Safe before you export.
          </p>
          <p className="mt-6">
            <Link
              to="/app?template=stream"
              className="inline-flex min-h-11 items-center rounded-sm bg-amber-500 px-4 text-sm font-semibold text-stone-100 transition hover:bg-amber-400"
            >
              Open the Netflix template
            </Link>
          </p>
        </section>

        <section id="layouts" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-serif text-3xl font-semibold text-stone-900">Live layouts, not mockups</h2>
          <p className="mt-3 max-w-[60ch] text-stone-600">
            These are the real template components, lazy-loaded as you scroll. Netflix is first. Click one to open it in the builder.
          </p>
          <div className="mt-8">
            <Suspense fallback={<div className="min-h-[24rem] bg-stone-50" />}>
              <LandingGallery />
            </Suspense>
          </div>
        </section>

        <section className="border-t border-stone-300 bg-stone-50">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div>
              <h2 className="font-serif text-3xl font-semibold text-stone-900">Built against the usual paywall</h2>
              <p className="mt-3 max-w-[55ch] text-stone-600">
                Search for a free resume builder and the top results are often Canva, Zety, Novoresume, Resume.io, Resume Genius, Kickresume, and Rezi. Most of those tools still ask for an account, or they cap or charge for a formatted file. {BRAND} does neither.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-stone-700">
                {COMPARE_PAGES.map((p) => (
                  <li key={p.slug}>
                    <Link className="font-semibold text-amber-600 hover:text-amber-500" to={p.path}>
                      {BRAND} vs {p.competitor}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <FaqList items={HOME_FAQS} />
          </div>
        </section>
      </main>
    </MarketingChrome>
  );
}

function Proof({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <dt className="font-serif text-3xl font-semibold text-amber-500">{n}</dt>
      <dd className="mt-1 text-sm text-stone-500">{label}</dd>
    </div>
  );
}
