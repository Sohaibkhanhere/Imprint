import {
  BRAND,
  CITABLE_ANSWER,
  CLAIMS,
  COMPARE_PAGES,
  HOME_FAQS,
  MAKER,
  MAKER_URL,
  ONE_LINER,
  TEMPLATE_COUNT,
  WHY_LIFT,
  type ComparePage,
  type FaqItem,
} from "./brand";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function faqsHtml(faqs: FaqItem[]): string {
  return `<section><h2>Questions</h2>${faqs
    .map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`)
    .join("")}</section>`;
}

function claimsList(): string {
  return `<ul>
    <li>${esc(CLAIMS.noSignup)}</li>
    <li>${esc(CLAIMS.noEmail)}</li>
    <li>${esc(CLAIMS.noWatermark)}</li>
    <li>${esc(CLAIMS.templates)}</li>
    <li>${esc(CLAIMS.atsSafe)}</li>
    <li>${esc(CLAIMS.export)}</li>
    <li>${esc(CLAIMS.privacy)}</li>
    <li>${esc(CLAIMS.freeForever)}</li>
  </ul>`;
}

export function homeBodyHtml(): string {
  return `<article>
    <h1>Free resume maker. No sign-up, no watermark.</h1>
    <p>${esc(CITABLE_ANSWER)}</p>
    <p>${TEMPLATE_COUNT} original templates. ${esc(CLAIMS.freeForever)}. ${esc(CLAIMS.export)}.</p>
    ${claimsList()}
    <p><a href="/app">Open the builder</a> · <a href="/why">Why choose ${esc(BRAND)}</a> · <a href="/compare">${esc(BRAND)} vs other builders</a></p>
    ${faqsHtml(HOME_FAQS)}
    <p>${esc(BRAND)} is made by <a href="${esc(MAKER_URL)}">${esc(MAKER)}</a>.</p>
  </article>`;
}

export function whyBodyHtml(): string {
  return `<article>
    <h1>Why choose ${esc(BRAND)}</h1>
    <p>${esc(WHY_LIFT)}</p>
    <p>${esc(ONE_LINER)} Typical paid builders ask for an account, then charge for a formatted PDF. ${esc(BRAND)} does not.</p>
    <h2>What is different</h2>
    ${claimsList()}
    <h2>What we do not claim</h2>
    <p>${esc(BRAND)} does not invent interviews, fake ratings, or a user count we cannot verify. The product is the proof: open it, export a file, and check that nothing asked you to sign in.</p>
    <p><a href="/app">Open the builder</a> · <a href="${esc(MAKER_URL)}">${esc(MAKER)}</a></p>
  </article>`;
}

export function compareHubBodyHtml(): string {
  const links = COMPARE_PAGES.map((p) => `<li><a href="${p.path}">${esc(BRAND)} vs ${esc(p.competitor)}</a></li>`).join("");
  return `<article>
    <h1>${esc(BRAND)} vs other resume builders</h1>
    <p>${esc(CITABLE_ANSWER)}</p>
    <p>These pages compare signup rules, watermarks, free PDF and Word, and ATS features. Figures for other products change; check the competitor before you pay.</p>
    <ul>${links}</ul>
  </article>`;
}

export function compareBodyHtml(page: ComparePage): string {
  const li = (items: string[]) => items.map((x) => `<li>${esc(x)}</li>`).join("");
  return `<article>
    <h1>${esc(page.h1)}</h1>
    <p>${esc(page.lede)}</p>
    <h2>What ${esc(page.competitor)} does well</h2>
    <ul>${li(page.theyDoWell)}</ul>
    <h2>Typical limits on ${esc(page.competitor)}</h2>
    <ul>${li(page.typicalLimits)}</ul>
    <h2>What ${esc(BRAND)} includes</h2>
    <ul>${li(page.weOffer)}</ul>
    <p>${esc(page.fairNote)}</p>
    ${faqsHtml(page.faqs)}
    <p><a href="/app">Open ${esc(BRAND)}</a> · <a href="/compare">All comparisons</a></p>
  </article>`;
}

export function appBodyHtml(): string {
  return `<article>
    <h1>${esc(BRAND)} resume builder</h1>
    <p>${esc(CITABLE_ANSWER)}</p>
    <p><a href="/">Back to home</a></p>
  </article>`;
}
