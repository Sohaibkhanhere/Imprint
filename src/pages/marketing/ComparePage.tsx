import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { MarketingChrome } from "./MarketingChrome";
import { FaqList } from "./FaqList";
import { SeoHead } from "../../seo/SeoHead";
import {
  BRAND,
  COMPARE_HUB_DESCRIPTION,
  COMPARE_HUB_TITLE,
  COMPARE_PAGES,
  CITABLE_ANSWER,
  faqJsonLd,
  softwareJsonLd,
  webPageJsonLd,
  type ComparePage as CompareDef,
} from "../../seo/brand";

export function CompareHubPage() {
  const jsonLd = useMemo(
    () => [softwareJsonLd(), webPageJsonLd({ path: "/compare", title: COMPARE_HUB_TITLE, description: COMPARE_HUB_DESCRIPTION })],
    [],
  );
  return (
    <MarketingChrome>
      <SeoHead title={COMPARE_HUB_TITLE} description={COMPARE_HUB_DESCRIPTION} path="/compare" jsonLd={jsonLd} />
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="font-serif text-4xl font-semibold text-stone-900">{BRAND} vs other resume builders</h1>
        <p className="mt-6 text-lg leading-relaxed text-stone-800">{CITABLE_ANSWER}</p>
        <p className="mt-4 text-stone-600">
          Each page is a factual comparison of signup rules, watermarks, free PDF and Word, and ATS features. Other products change their plans. Confirm details on their site before you pay.
        </p>
        <ul className="mt-10 space-y-4">
          {COMPARE_PAGES.map((p) => (
            <li key={p.slug}>
              <Link to={p.path} className="font-serif text-2xl font-semibold text-amber-600 hover:text-amber-500">
                {BRAND} vs {p.competitor}
              </Link>
              <p className="mt-1 text-sm text-stone-500">{p.lede}</p>
            </li>
          ))}
        </ul>
      </main>
    </MarketingChrome>
  );
}

export function ComparePage() {
  const { slug } = useParams();
  const page = COMPARE_PAGES.find((p) => p.slug === slug);
  if (!page) return <Navigate to="/compare" replace />;
  return <CompareArticle page={page} />;
}

function CompareArticle({ page }: { page: CompareDef }) {
  const jsonLd = useMemo(
    () => [
      softwareJsonLd(),
      faqJsonLd(page.faqs),
      webPageJsonLd({ path: page.path, title: page.title, description: page.description }),
    ],
    [page],
  );

  return (
    <MarketingChrome>
      <SeoHead title={page.title} description={page.description} path={page.path} jsonLd={jsonLd} />
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <p className="folio text-amber-500">Comparison</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold leading-[1.15] text-stone-900">{page.h1}</h1>
        <p className="mt-6 text-lg leading-relaxed text-stone-800">{page.lede}</p>

        <h2 className="mt-12 text-xl font-semibold text-stone-900">What {page.competitor} does well</h2>
        <ul className="mt-3 max-w-[65ch] space-y-2 text-stone-600">
          {page.theyDoWell.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>

        <h2 className="mt-10 text-xl font-semibold text-stone-900">Typical limits</h2>
        <ul className="mt-3 max-w-[65ch] space-y-2 text-stone-600">
          {page.typicalLimits.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>

        <h2 className="mt-10 text-xl font-semibold text-stone-900">What {BRAND} includes</h2>
        <ul className="mt-3 max-w-[65ch] space-y-2 text-stone-600">
          {page.weOffer.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>

        <p className="mt-10 max-w-[65ch] text-stone-600">{page.fairNote}</p>

        <div className="mt-12">
          <FaqList items={page.faqs} />
        </div>

        <p className="mt-10 flex flex-wrap gap-4">
          <Link
            to="/app"
            className="inline-flex min-h-11 items-center rounded-sm bg-amber-500 px-4 text-sm font-semibold text-stone-100 transition hover:bg-amber-400"
          >
            Open the builder
          </Link>
          <Link to="/compare" className="inline-flex min-h-11 items-center text-sm font-semibold text-amber-600 hover:text-amber-500">
            All comparisons
          </Link>
        </p>
      </main>
    </MarketingChrome>
  );
}
