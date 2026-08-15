export const WEAK_STARTERS = [
  "responsible for",
  "duties included",
  "duties include",
  "worked on",
  "helped with",
  "helped to",
  "was involved in",
  "was responsible for",
  "in charge of",
  "tasked with",
  "assisted in",
  "assisted with",
  "participated in",
  "contributing to",
  "contributed to",
  "dealt with",
  "handled",
  "made sure",
  "worked closely with",
  "work on",
  "worked with",
  "help with",
];

export const VAGUE_WORDS = [
  "hardworking",
  "team player",
  "detail-oriented",
  "detail orientated",
  "results-driven",
  "go-getter",
  "synergy",
  "think outside the box",
  "self-starter",
  "dynamic",
  "motivated",
  "dedicated",
  "passionate",
];

export const FIRST_PERSON = /\b(i|my|me|myself|we|our|us)\b/i;

export const BANNED_PHRASES = ["references available upon request", "references available on request"];

export interface VerbCategory {
  key: string;
  label: string;
  verbs: string[];
}

export const VERB_BANK: VerbCategory[] = [
  {
    key: "leadership",
    label: "Leadership",
    verbs: [
      "Led",
      "Directed",
      "Championed",
      "Orchestrated",
      "Mentored",
      "Spearheaded",
      "Drove",
      "Steered",
      "Managed",
      "Supervised",
      "Coached",
      "Guided",
      "Mobilized",
      "Commanded",
      "Headed",
      "Presided",
      "Galvanized",
    ],
  },
  {
    key: "achievement",
    label: "Achievement",
    verbs: [
      "Achieved",
      "Surpassed",
      "Delivered",
      "Exceeded",
      "Attained",
      "Secured",
      "Won",
      "Closed",
      "Finalized",
      "Completed",
      "Accomplished",
      "Executed",
      "Converted",
    ],
  },
  {
    key: "improvement",
    label: "Improvement",
    verbs: [
      "Streamlined",
      "Optimized",
      "Overhauled",
      "Modernized",
      "Enhanced",
      "Reduced",
      "Accelerated",
      "Simplified",
      "Refined",
      "Elevated",
      "Cut",
      "Trimmed",
      "Revitalized",
      "Automated",
    ],
  },
  {
    key: "creation",
    label: "Creation",
    verbs: [
      "Built",
      "Designed",
      "Launched",
      "Developed",
      "Established",
      "Pioneered",
      "Created",
      "Engineered",
      "Architected",
      "Crafted",
      "Shipped",
      "Introduced",
      "Fabricated",
      "Produced",
    ],
  },
  {
    key: "analysis",
    label: "Analysis",
    verbs: [
      "Analyzed",
      "Evaluated",
      "Assessed",
      "Diagnosed",
      "Investigated",
      "Forecasted",
      "Modeled",
      "Benchmarked",
      "Audited",
      "Quantified",
      "Monitored",
      "Researched",
      "Tested",
      "Measured",
    ],
  },
  {
    key: "communication",
    label: "Communication",
    verbs: [
      "Presented",
      "Negotiated",
      "Authored",
      "Facilitated",
      "Advised",
      "Persuaded",
      "Published",
      "Presented",
      "Reported",
      "Educated",
      "Instructed",
      "Translated",
      "Documented",
      "Wrote",
    ],
  },
  {
    key: "research",
    label: "Research",
    verbs: [
      "Researched",
      "Investigated",
      "Published",
      "Co-authored",
      "Curated",
      "Synthesized",
      "Collected",
      "Analyzed",
      "Peer-reviewed",
      "Presented",
      "Experienced",
      "Documented",
      "Catalogued",
      "Validated",
    ],
  },
  {
    key: "operations",
    label: "Operations",
    verbs: [
      "Coordinated",
      "Scheduled",
      "Managed",
      "Allocated",
      "Organized",
      "Administered",
      "Procured",
      "Tracked",
      "Prioritized",
      "Troubleshot",
      "Maintained",
      "Resolved",
    ],
  },
];

export function verbByCategory(key: string): string[] {
  return VERB_BANK.find((c) => c.key === key)?.verbs ?? [];
}

export function allVerbs(): string[] {
  return VERB_BANK.flatMap((c) => c.verbs);
}

export function categoryForVerb(verb: string): string | undefined {
  const v = verb.toLowerCase();
  for (const c of VERB_BANK) {
    if (c.verbs.some((x) => x.toLowerCase() === v)) return c.key;
  }
  return undefined;
}

const PAST_TO_PRESENT: Record<string, string> = {
  Led: "Leads",
  Directed: "Directs",
  Championed: "Champions",
  Orchestrated: "Orchestrates",
  Mentored: "Mentors",
  Spearheaded: "Spearheads",
  Drove: "Drives",
  Steered: "Steers",
  Managed: "Manages",
  Supervised: "Supervises",
  Coached: "Coaches",
  Guided: "Guides",
  Built: "Builds",
  Designed: "Designs",
  Launched: "Launches",
  Developed: "Develops",
  Established: "Establishes",
  Pioneered: "Pioneers",
  Created: "Creates",
  Engineered: "Engineers",
  Crafted: "Crafts",
  Shipped: "Ships",
  Analyzed: "Analyzes",
  Evaluated: "Evaluates",
  Assessed: "Assesses",
  Diagnosed: "Diagnoses",
  Streamlined: "Streamlines",
  Optimized: "Optimizes",
  Overhauled: "Overhauls",
  Modernized: "Modernizes",
  Enhanced: "Enhances",
  Reduced: "Reduces",
  Automated: "Automates",
  Achieved: "Achieves",
  Delivered: "Delivers",
  Exceeded: "Exceeds",
  Secured: "Secures",
  Presented: "Presents",
  Negotiated: "Negotiates",
  Authored: "Authors",
  Facilitated: "Facilitates",
  Advised: "Advises",
  Published: "Publishes",
  Wrote: "Writes",
  Researched: "Researches",
  Investigated: "Investigates",
};

export function toPresent(verb: string): string {
  const v = verb.trim();
  const exact = PAST_TO_PRESENT[v];
  if (exact) return exact;
  if (v.endsWith("ed")) return v.slice(0, -2) + "s";
  return v;
}

export function tenseFor(entry: { present: boolean }): "present" | "past" {
  return entry.present ? "present" : "past";
}
