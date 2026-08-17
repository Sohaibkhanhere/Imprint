import { useMemo } from "react";
import { Link } from "react-router-dom";
import { MarketingChrome } from "./MarketingChrome";
import { SeoHead } from "../../seo/SeoHead";
import {
  BRAND,
  ONE_LINER,
  TEMPLATE_COUNT,
  WHY_DESCRIPTION,
  WHY_LIFT,
  WHY_TITLE,
  softwareJsonLd,
  webPageJsonLd,
} from "../../seo/brand";

const POINTS = [
  { title: "No signup required", body: `${BRAND} does not require an account. There is no email gate and no password.` },
  { title: "No watermark", body: "PDF and Word files download as your resume. Nothing branded is stamped on the page." },
  { title: `${TEMPLATE_COUNT} original templates`, body: `The gallery is ${TEMPLATE_COUNT} layouts we ship, not a stock pack behind a paywall.` },
  { title: "ATS Safe mode", body: "Turn on a single-column, standard-heading sheet for parsers. Turn it off to restore the designed template." },
  { title: "Instant PDF and Word export", body: "Download from the header. No trial, no credit card, no 'plain text only' substitute." },
  { title: "Your data never leaves your browser", body: "Resumes save to this device's local storage. There is no Resume by QD account database." },
];

export function WhyPage() {
  const jsonLd = useMemo(
    () => [softwareJsonLd(), webPageJsonLd({ path: "/why", title: WHY_TITLE, description: WHY_DESCRIPTION })],
    [],
  );

  return (
    <MarketingChrome>
      <SeoHead title={WHY_TITLE} description={WHY_DESCRIPTION} path="/why" jsonLd={jsonLd} />
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="font-serif text-4xl font-semibold leading-[1.15] text-stone-900">Why choose {BRAND}</h1>
        <p className="mt-6 text-xl leading-relaxed text-stone-800">{WHY_LIFT}</p>
        <p className="mt-4 text-stone-600">
          {ONE_LINER} Typical paid tools ask you to create an account, then charge for a formatted PDF. {BRAND} does not.
        </p>
        <ol className="mt-12 space-y-8">
          {POINTS.map((p) => (
            <li key={p.title}>
              <h2 className="text-lg font-semibold text-stone-900">{p.title}</h2>
              <p className="mt-2 max-w-[62ch] text-stone-600">{p.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-12 max-w-[62ch] text-sm text-stone-500">
          {BRAND} does not publish fake star ratings or a user count we cannot verify. Open the builder, export a file, and confirm that nothing asked you to sign in.
        </p>
        <p className="mt-8">
          <Link
            to="/app"
            className="inline-flex min-h-11 items-center rounded-sm bg-amber-500 px-4 text-sm font-semibold text-stone-100 transition hover:bg-amber-400"
          >
            Open the builder
          </Link>
        </p>
      </main>
    </MarketingChrome>
  );
}
