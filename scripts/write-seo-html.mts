import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  APP_DESCRIPTION,
  APP_TITLE,
  COMPARE_HUB_DESCRIPTION,
  COMPARE_HUB_TITLE,
  COMPARE_PAGES,
  HOME_DESCRIPTION,
  HOME_FAQS,
  HOME_TITLE,
  SITE_URL,
  WHY_DESCRIPTION,
  WHY_TITLE,
  absUrl,
  faqJsonLd,
  softwareJsonLd,
  webPageJsonLd,
} from "../src/seo/brand";
import {
  appBodyHtml,
  compareBodyHtml,
  compareHubBodyHtml,
  homeBodyHtml,
  whyBodyHtml,
} from "../src/seo/staticHtml";

type Page = {
  path: string;
  title: string;
  description: string;
  body: string;
  jsonLd: unknown[];
};

const pages: Page[] = [
  {
    path: "/",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    body: homeBodyHtml(),
    jsonLd: [softwareJsonLd(), faqJsonLd(HOME_FAQS), webPageJsonLd({ path: "/", title: HOME_TITLE, description: HOME_DESCRIPTION })],
  },
  {
    path: "/app",
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    body: appBodyHtml(),
    jsonLd: [softwareJsonLd(), webPageJsonLd({ path: "/app", title: APP_TITLE, description: APP_DESCRIPTION })],
  },
  {
    path: "/why",
    title: WHY_TITLE,
    description: WHY_DESCRIPTION,
    body: whyBodyHtml(),
    jsonLd: [softwareJsonLd(), webPageJsonLd({ path: "/why", title: WHY_TITLE, description: WHY_DESCRIPTION })],
  },
  {
    path: "/compare",
    title: COMPARE_HUB_TITLE,
    description: COMPARE_HUB_DESCRIPTION,
    body: compareHubBodyHtml(),
    jsonLd: [softwareJsonLd(), webPageJsonLd({ path: "/compare", title: COMPARE_HUB_TITLE, description: COMPARE_HUB_DESCRIPTION })],
  },
  ...COMPARE_PAGES.map((p) => ({
    path: p.path,
    title: p.title,
    description: p.description,
    body: compareBodyHtml(p),
    jsonLd: [softwareJsonLd(), faqJsonLd(p.faqs), webPageJsonLd({ path: p.path, title: p.title, description: p.description })],
  })),
];

function inject(shell: string, page: Page): string {
  const url = absUrl(page.path);
  const image = `${SITE_URL}/qd-logo.webp`;
  let html = shell;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(page.title)}</title>`);
  html = html.replace(
    /<meta name="description" content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${esc(page.description)}" />`,
  );
  html = html.replace(/<link rel="canonical"[^>]*>/g, "");
  html = html.replace(/<meta property="og:[^"]+" content="[^"]*"\s*\/?>/g, "");
  html = html.replace(/<meta name="twitter:[^"]+" content="[^"]*"\s*\/?>/g, "");
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
  const extraHead = `
    <link rel="canonical" href="${url}" />
    <meta property="og:title" content="${esc(page.title)}" />
    <meta property="og:description" content="${esc(page.description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Resume by QD" />
    <meta property="og:locale" content="en_US" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(page.title)}" />
    <meta name="twitter:description" content="${esc(page.description)}" />
    <meta name="twitter:image" content="${image}" />
    <script type="application/ld+json">${JSON.stringify(page.jsonLd.length === 1 ? page.jsonLd[0] : page.jsonLd)}</script>
  `;
  html = html.replace("</head>", `${extraHead}</head>`);
  if (!html.includes('id="geo-static"')) {
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root"></div><div id="geo-static">${page.body}</div><noscript>${page.body}</noscript>`,
    );
  }
  return html;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

const dist = join(process.cwd(), "dist");
const shellPath = join(dist, "index.html");
if (!existsSync(shellPath)) {
  throw new Error("dist/index.html missing. Run vite build first.");
}
const shell = readFileSync(shellPath, "utf8");

for (const page of pages) {
  const html = inject(shell, page);
  const file = page.path === "/" ? join(dist, "index.html") : join(dist, page.path.replace(/^\//, ""), "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  console.log("seo", page.path);
}
