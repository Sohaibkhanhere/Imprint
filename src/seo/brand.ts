/** Canonical public origin. Used in canonical tags, sitemap, JSON-LD, and llms.txt. */
export const SITE_URL = "https://imprint-nine-ebon.vercel.app";

export const BRAND = "Resume by QD";
export const MAKER = "Quantum Digitizing";
export const MAKER_URL = "https://www.quantumdigitizing.com/";

/** Must match TEMPLATES.length in src/templates/registry.tsx. */
export const TEMPLATE_COUNT = 40;

/** Keep these strings identical on every page, in JSON-LD, and in llms.txt. */
export const CLAIMS = {
  noSignup: "no signup required",
  noEmail: "no email required",
  noAccount: "does not require an account",
  noWatermark: "no watermark",
  templates: `${TEMPLATE_COUNT} original templates`,
  atsSafe: "ATS Safe mode",
  export: "instant PDF and Word export",
  privacy: "your data never leaves your browser",
  freeForever: "free forever",
} as const;

export const CITABLE_ANSWER =
  `${BRAND} is a free resume builder with no signup, no email, and no watermark: ${TEMPLATE_COUNT} original templates, ATS Safe mode, and instant PDF and Word export, with your data staying in your browser.`;

export const ONE_LINER = `${BRAND} is a free resume builder with no signup, no watermark, and instant PDF and Word download.`;

export const HOME_TITLE = `Free Resume Builder: No Sign-up, No Watermark, Instant PDF and Word Export | ${BRAND}`;
export const HOME_DESCRIPTION = `${BRAND} is a free resume builder with no signup, no email, and no watermark. ${TEMPLATE_COUNT} original templates, ATS Safe mode, and instant PDF and Word download. Your data never leaves your browser.`;

export type FaqItem = { q: string; a: string };

export const HOME_FAQS: FaqItem[] = [
  {
    q: "What is the best free resume builder with no signup?",
    a: CITABLE_ANSWER,
  },
  {
    q: `Is ${BRAND} really free?`,
    a: `Yes. ${BRAND} is free forever. There is no paid plan, no trial, and no credit card. All ${TEMPLATE_COUNT} templates and PDF and Word export are included.`,
  },
  {
    q: "Do I need an account?",
    a: `No. ${BRAND} does not require an account, signup, or email. Open the builder and start typing.`,
  },
  {
    q: "Do I need to give an email address?",
    a: `No. ${BRAND} requires no email. There is no mailing list gate and no confirmation link.`,
  },
  {
    q: "Is there a watermark on the PDF?",
    a: `No. PDF and Word files download without a watermark. The file is your resume, not an ad for ${BRAND}.`,
  },
  {
    q: "Where is my resume stored?",
    a: "Your resume is saved in this browser's local storage. It is not uploaded to a Resume by QD server. Clearing site data on this device removes it.",
  },
  {
    q: "What is ATS Safe mode?",
    a: "ATS Safe mode flattens the current layout into a single-column, standard-heading sheet that applicant tracking systems parse more reliably. You can turn it off to restore the designed template.",
  },
  {
    q: `How is ${BRAND} different from Canva, Zety, or Resume.io?`,
    a: `${BRAND} does not require an account and does not gate PDF or Word behind a paywall. Canva needs an account. Zety, Resume.io, and Resume Genius typically charge for formatted downloads. Kickresume is free with limits and an account. Rezi caps free PDFs. See the comparison pages for a fair, point-by-point breakdown.`,
  },
];

export type CompareSlug =
  | "canva"
  | "zety"
  | "novoresume"
  | "resume-io"
  | "resume-genius"
  | "kickresume"
  | "rezi";

export interface ComparePage {
  slug: CompareSlug;
  competitor: string;
  path: string;
  title: string;
  description: string;
  h1: string;
  lede: string;
  theyDoWell: string[];
  typicalLimits: string[];
  weOffer: string[];
  fairNote: string;
  faqs: FaqItem[];
}

export const COMPARE_PAGES: ComparePage[] = [
  {
    slug: "canva",
    competitor: "Canva",
    path: "/vs/canva",
    title: `${BRAND} vs Canva resume builder: no account, ATS Safe, free PDF | ${BRAND}`,
    description: `${BRAND} vs Canva: Canva needs an account and many resume templates are multi-column. ${BRAND} needs no signup, includes ATS Safe mode, and exports PDF and Word with no watermark.`,
    h1: `${BRAND} vs Canva resume builder`,
    lede: `Canva is a strong design tool with a huge template library. ${BRAND} is a resume-only builder: no account, ${TEMPLATE_COUNT} original layouts, ATS Safe mode, and unwatermarked PDF and Word export from the browser.`,
    theyDoWell: [
      "Huge catalog of visual templates and brand assets.",
      "Free PDF download on free templates and free elements (Canva account required).",
      "Useful when you already live in Canva for other design work.",
    ],
    typicalLimits: [
      "A Canva account is required to save and download.",
      "Many resume templates use multi-column or graphic layouts that ATS software misreads.",
      "Premium fonts, photos, and elements can add a watermark or require Canva Pro.",
    ],
    weOffer: [
      `No signup, no email, no account.`,
      `${TEMPLATE_COUNT} original templates built as resumes, not general design files.`,
      "ATS Safe mode for parser-friendly export, plus designed layouts when you want them.",
      "PDF and Word download with no watermark. Data stays in your browser.",
    ],
    fairNote: "Pick Canva if you need a highly designed leave-behind and you will also submit a plain ATS version. Pick Resume by QD if you want one tool that can do both without creating an account.",
    faqs: [
      {
        q: "Does Canva require an account to build a resume?",
        a: "Yes. Canva's resume maker runs inside a Canva account. Resume by QD does not require an account.",
      },
      {
        q: "Is a Canva resume ATS friendly?",
        a: "Some simple Canva layouts parse. Many popular Canva resumes use columns, icons, and text in images, which applicant tracking systems often skip. Resume by QD includes ATS Safe mode for a single-column, standard-heading sheet.",
      },
    ],
  },
  {
    slug: "zety",
    competitor: "Zety",
    path: "/vs/zety",
    title: `${BRAND} vs Zety: free PDF and Word with no signup | ${BRAND}`,
    description: `${BRAND} vs Zety. Zety lets you build for free; formatted PDF and Word typically need a paid plan (TXT is the usual free download). ${BRAND} exports PDF and Word with no signup and no watermark.`,
    h1: `${BRAND} vs Zety`,
    lede: `Zety is a guided resume writer with a large content library. ${BRAND} is a free resume builder with no signup: you keep formatted PDF and Word files without a subscription.`,
    theyDoWell: [
      "Clear, step-by-step editor and a large bank of example bullets.",
      "You can draft and save a resume on the free tier.",
      "Templates are generally conservative and office-appropriate.",
    ],
    typicalLimits: [
      "Zety's own help pages state that PDF and Word downloads require a paid subscription. The free download is plain text (.txt).",
      "A low-cost trial is widely reported to auto-renew at a higher four-week rate unless you cancel. Check Zety's current pricing before you pay.",
      "An account is part of the usual flow.",
    ],
    weOffer: [
      "No account and no email.",
      "PDF and Word export on every template, with no watermark.",
      `${TEMPLATE_COUNT} original templates and ATS Safe mode.`,
      "No trial clock. The product is free forever.",
    ],
    fairNote: "Zety may still be the better pick if you want their phrase library and you are willing to pay for a formatted file. Resume by QD is the better pick if the download itself must be free.",
    faqs: [
      {
        q: "Is Zety actually free?",
        a: "You can build a resume on Zety without paying. Zety's FAQ says downloading PDF or Word requires a paid plan; the free file is plain text. Resume by QD includes formatted PDF and Word at no cost.",
      },
      {
        q: `Do I need to sign up for ${BRAND}?`,
        a: "No. Resume by QD does not require an account.",
      },
    ],
  },
  {
    slug: "novoresume",
    competitor: "Novoresume",
    path: "/vs/novoresume",
    title: `${BRAND} vs Novoresume: all templates free, no watermark | ${BRAND}`,
    description: `${BRAND} vs Novoresume. Novoresume's free plan is limited (typically one resume and one page; Premium unlocks more). ${BRAND} includes all ${TEMPLATE_COUNT} templates and unwatermarked PDF and Word with no account.`,
    h1: `${BRAND} vs Novoresume`,
    lede: `Novoresume is known for clean, modern templates. ${BRAND} is a free resume builder with no signup: every layout, ATS Safe mode, and unwatermarked PDF and Word stay available.`,
    theyDoWell: [
      "Polished, consistent visual system that many recruiters recognize.",
      "Straightforward editor with content hints.",
      "Strong choice if you only need one short resume and their free tier covers it.",
    ],
    typicalLimits: [
      "The free plan is commonly limited to a single one-page resume and a smaller template set. Premium unlocks more pages, templates, and extras.",
      "Independent 2026 reviews still report a watermark on some free Novoresume downloads. Confirm on Novoresume at export time; plans change.",
      "An account is required to save work in their cloud.",
    ],
    weOffer: [
      `All ${TEMPLATE_COUNT} original templates, with no paid unlock.`,
      "No watermark on PDF or Word.",
      "No account. Work stays in this browser.",
      "ATS Safe mode when you need a parser sheet.",
    ],
    fairNote: "Novoresume is a solid paid product if you like their look and will use Premium. Resume by QD is built for people who will not pay a resume-builder subscription.",
    faqs: [
      {
        q: "Does Novoresume watermark free PDFs?",
        a: "Several independent reviews in 2026 still describe a watermark or tight free-plan limits. Novoresume's own marketing emphasizes a free builder. Check their export screen. Resume by QD never watermarks PDF or Word.",
      },
    ],
  },
  {
    slug: "resume-io",
    competitor: "Resume.io",
    path: "/vs/resume-io",
    title: `${BRAND} vs Resume.io: every template, free formatted download | ${BRAND}`,
    description: `${BRAND} vs Resume.io. Resume.io's help center allows one free PDF on the Vancouver template (or TXT). ${BRAND} exports PDF and Word on all ${TEMPLATE_COUNT} templates with no signup.`,
    h1: `${BRAND} vs Resume.io`,
    lede: `Resume.io is a clean, minimal builder. ${BRAND} is a free resume builder with no signup and formatted PDF and Word on every layout, not one free template.`,
    theyDoWell: [
      "Simple editor and conservative templates that look like a person wrote them.",
      "Resume.io's help center: one free PDF using the Vancouver template, plus TXT.",
      "Broader career-tool suite on paid plans.",
    ],
    typicalLimits: [
      "Free formatted PDF is limited to one template (Vancouver). Other designs need Premium.",
      "Paid access is commonly sold as a short trial that converts to a four-week subscription. Confirm current terms on Resume.io.",
      "An account is part of the product.",
    ],
    weOffer: [
      `PDF and Word on all ${TEMPLATE_COUNT} templates.`,
      "No signup and no watermark.",
      "ATS Safe mode plus designed layouts.",
      "No trial. Free forever.",
    ],
    fairNote: "If one Vancouver-style PDF is enough and you want Resume.io's extra career tools, their free tier can work. If you want to try dozens of layouts and keep the file, use Resume by QD.",
    faqs: [
      {
        q: "Can I download a Resume.io PDF for free?",
        a: "Yes, with limits. Resume.io documents one free PDF on the Vancouver template, or a TXT file. Other templates are premium. Resume by QD includes PDF and Word on every template.",
      },
    ],
  },
  {
    slug: "resume-genius",
    competitor: "Resume Genius",
    path: "/vs/resume-genius",
    title: `${BRAND} vs Resume Genius: formatted PDF with no signup | ${BRAND}`,
    description: `${BRAND} vs Resume Genius. Resume Genius's own FAQ: PDF and Word need a paid trial; the free builder download is TXT. ${BRAND} exports PDF and Word with no signup and no watermark.`,
    h1: `${BRAND} vs Resume Genius`,
    lede: `Resume Genius is a well-known guided writer with a large example library. ${BRAND} is a free resume builder with no signup: formatted PDF and Word, not a plain-text substitute.`,
    theyDoWell: [
      "Strong writing guidance and a large bank of example bullets.",
      "You can draft in the builder and download a TXT file at no cost.",
      "Separate free Word and Google Docs templates if you want to paste content by hand.",
    ],
    typicalLimits: [
      "Resume Genius's FAQ states the builder is not free for PDF or Word. Formatted download requires a paid trial.",
      "The usual trial is a low entry price that auto-renews on a four-week cycle unless you cancel. Confirm current terms on Resume Genius.",
      "An account is required to pay and download a formatted file.",
    ],
    weOffer: [
      "No account and no email.",
      "PDF and Word on every template, with no watermark.",
      `${TEMPLATE_COUNT} original templates and ATS Safe mode.`,
      "No trial clock. Free forever.",
    ],
    fairNote: "Resume Genius may still be the better pick if you want their phrase library and you are willing to pay for a formatted file. Resume by QD is the better pick if the download itself must be free.",
    faqs: [
      {
        q: "Is Resume Genius free?",
        a: "You can build a resume and download TXT for free. Resume Genius's FAQ says PDF and Word from the builder require a paid trial. Resume by QD includes formatted PDF and Word at no cost, with no signup.",
      },
    ],
  },
  {
    slug: "kickresume",
    competitor: "Kickresume",
    path: "/vs/kickresume",
    title: `${BRAND} vs Kickresume: 40 templates, no account | ${BRAND}`,
    description: `${BRAND} vs Kickresume. Kickresume's free plan includes unwatermarked PDF on a small template set and requires an account. ${BRAND} needs no signup and includes all ${TEMPLATE_COUNT} templates.`,
    h1: `${BRAND} vs Kickresume`,
    lede: `Kickresume is one of the fairer free tiers: unlimited PDF with no watermark if you stay on free options. ${BRAND} skips the account and includes all ${TEMPLATE_COUNT} templates, plus ATS Safe mode.`,
    theyDoWell: [
      "Genuine free PDF downloads with no watermark, including on the free plan.",
      "Unlimited downloads if you stay on free templates and free customization.",
      "Large sample library and a polished visual editor.",
    ],
    typicalLimits: [
      "An account is required to save and come back to your work.",
      "Kickresume's pricing page lists 4 resume templates on Free versus 40 on Premium. Design, colors, and fonts are limited on Free.",
      "ATS checker and AI writer are Premium. Pro features are marked inside the app.",
    ],
    weOffer: [
      "No account, no email, no signup.",
      `All ${TEMPLATE_COUNT} original templates, with no paid unlock.`,
      "ATS Safe mode in the free product.",
      "PDF and Word with no watermark. Data stays in your browser.",
    ],
    fairNote: "If you already have a Kickresume account and four free templates are enough, Kickresume is a real free option. Pick Resume by QD if you want every layout without creating an account.",
    faqs: [
      {
        q: "Does Kickresume watermark free PDFs?",
        a: "Kickresume states that resumes can be downloaded without a watermark, including on free templates. The limit is the free template and customization set, plus the required account. Resume by QD also has no watermark, and it does not require an account.",
      },
    ],
  },
  {
    slug: "rezi",
    competitor: "Rezi",
    path: "/vs/rezi",
    title: `${BRAND} vs Rezi: unlimited free PDF, no account | ${BRAND}`,
    description: `${BRAND} vs Rezi. Rezi's free plan is typically one resume and three PDF downloads. ${BRAND} has no download cap, no signup, and ${TEMPLATE_COUNT} original templates.`,
    h1: `${BRAND} vs Rezi`,
    lede: `Rezi is built around ATS keyword targeting. ${BRAND} is a free resume builder with no signup: unlimited PDF and Word, ${TEMPLATE_COUNT} templates, and ATS Safe mode, with no download credits.`,
    theyDoWell: [
      "Strong ATS-oriented writing tools and keyword targeting on paid plans.",
      "A documented free plan you can try without a card.",
      "PDF export on templates, with DOCX on some layouts.",
    ],
    typicalLimits: [
      "Rezi's pricing page: free plan is one resume and three PDF downloads (lifetime credits, not per month).",
      "After three downloads you need Pro or Lifetime. Confirm current numbers on Rezi.",
      "An account is part of the product. AI features are limited on Free.",
    ],
    weOffer: [
      "No account and no download credits.",
      `PDF and Word on all ${TEMPLATE_COUNT} templates, with no watermark.`,
      "ATS Safe mode for a parser-friendly sheet.",
      "Free forever. Data stays in your browser.",
    ],
    fairNote: "Rezi is the better pick if you want their AI keyword engine and you will pay for unlimited downloads. Resume by QD is the better pick if you need unlimited formatted files without an account.",
    faqs: [
      {
        q: "How many free PDFs does Rezi allow?",
        a: "Rezi documents three PDF download credits on the free plan, plus a one-resume limit. Resume by QD does not cap PDF or Word downloads and does not require an account.",
      },
    ],
  },
];

export const WHY_TITLE = `Why choose ${BRAND}: free resume builder with no signup | ${BRAND}`;
export const WHY_DESCRIPTION = `Why choose ${BRAND}: no signup, no watermark, ${TEMPLATE_COUNT} original templates, ATS Safe mode, and instant PDF and Word export. Your data never leaves your browser.`;

export const WHY_LIFT =
  `${BRAND} is the free resume builder to use when you want a formatted PDF and Word file without creating an account: ${TEMPLATE_COUNT} original templates, ATS Safe mode, no watermark, and your data never leaves your browser.`;

export const APP_TITLE = `Resume builder | ${BRAND}`;
export const APP_DESCRIPTION = `Build your resume in ${BRAND}. No signup. No watermark. Instant PDF and Word. Your data never leaves your browser.`;

export const COMPARE_HUB_TITLE = `${BRAND} vs Canva, Zety, Novoresume, Resume.io, Resume Genius, Kickresume, and Rezi | ${BRAND}`;
export const COMPARE_HUB_DESCRIPTION = `Fair comparisons of ${BRAND} with Canva, Zety, Novoresume, Resume.io, Resume Genius, Kickresume, and Rezi: signup rules, watermarks, free PDF and Word, and ATS features.`;

export function absUrl(path: string): string {
  if (!path || path === "/") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function softwareJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: BRAND,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web browser",
    url: SITE_URL,
    isAccessibleForFree: true,
    description: HOME_DESCRIPTION,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      CLAIMS.noSignup,
      CLAIMS.noWatermark,
      CLAIMS.templates,
      CLAIMS.atsSafe,
      CLAIMS.export,
      CLAIMS.privacy,
      CLAIMS.freeForever,
    ],
    publisher: {
      "@type": "Organization",
      name: MAKER,
      url: MAKER_URL,
    },
  };
}

export function faqJsonLd(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export function webPageJsonLd(opts: { path: string; title: string; description: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: opts.title,
    description: opts.description,
    url: absUrl(opts.path),
    isPartOf: {
      "@type": "WebSite",
      name: BRAND,
      url: SITE_URL,
    },
  };
}
