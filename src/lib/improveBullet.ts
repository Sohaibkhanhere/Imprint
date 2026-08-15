import { VERB_BANK, WEAK_STARTERS, toPresent, tenseFor } from "./verbs";

export interface BulletImprovement {
  suggested: string;
  verb: string;
  category: string;
  fixes: string[];
  needsNumber: boolean;
  changedVerb: boolean;
}

const NUMBER_RE = /\d/;
const MEASURE_RE = /%|\$|(?:^|\s)[\d,.]+\s*(?:%|\$|x\s|users?|clients?|customers?|revenue|sales|hours|weeks?|months?|days?|teams?|regions?|offices?|requests?|tickets?|calls?|sites?|pages?|conversions?|leads?|bookings?|orders?|projects?|files?|reports?|K\b|\bM\b|\bB\b)/i;
const TIME_SAVED = /(?:^|\s)(\d+%?)\s*(?:time|hours|weeks?|days?|minutes?|cost|spend)/i;

function stripWeakStart(text: string): { core: string; wasWeak: boolean } {
  const lower = text.trim().toLowerCase();
  for (const w of WEAK_STARTERS) {
    const re = new RegExp(`^${w}\\b\\s*`, "i");
    if (re.test(lower)) {
      return { core: text.trim().replace(new RegExp(`^${w}\\b\\s*`, "i"), "").replace(/^,\s*/, ""), wasWeak: true };
    }
  }
  return { core: text.trim(), wasWeak: false };
}

function leadingVerbOf(text: string): { verb?: string; category?: string } {
  const first = text.trim().split(/\s+/)[0];
  const base = first.replace(/[^a-zA-Z]/g, "");
  if (!base) return {};
  const cat = VERB_BANK.find((c) => c.verbs.some((v) => v.toLowerCase() === base.toLowerCase()));
  if (cat) {
    const verb = cat.verbs.find((v) => v.toLowerCase() === base.toLowerCase());
    return { verb: verb ?? first, category: cat.key };
  }
  return {};
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function improveBullet(raw: string, entry: { present: boolean }): BulletImprovement {
  const fixes: string[] = [];
  const trimmed = raw.trim();

  if (!trimmed) {
    return {
      suggested: "",
      verb: "",
      category: "",
      fixes: ["Enter a rough draft first, then we'll strengthen it."],
      needsNumber: false,
      changedVerb: false,
    };
  }

  const { core, wasWeak } = stripWeakStart(trimmed);
  if (wasWeak) fixes.push("Removed the weak opener (\u201c" + trimmed.split(" ").slice(0, 2).join(" ") + "\u2026\u201d) and replaced it with a strong action verb.");

  const { verb } = leadingVerbOf(core);
  const tense = tenseFor(entry);

  let stem = core;
  if (verb) {
    stem = core.replace(new RegExp("^" + verb.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b\\s*", "i"), "");
  } else if (wasWeak) {
    stem = core;
  }

  stem = stem.replace(/^[,\s]+/, "").replace(/[.,;:]\s*$/, "");

  const hasNumber = NUMBER_RE.test(core);

  let chosenVerb = verb;
  let chosenCategory: string | undefined;
  if (!verb) {
    chosenCategory = "achievement";
    chosenVerb = "Achieved";
  } else {
    chosenCategory = leadingVerbOf(core).category;
  }

  const pool = VERB_BANK.find((c) => c.key === chosenCategory)?.verbs ?? VERB_BANK[0].verbs;
  const baseVerb = chosenVerb ?? pool[0];

  let verbForTense = tense === "present" ? toPresent(baseVerb) : baseVerb;

  const firstOfStem = stem.split(/\s+/)[0];
  const stemStartsLower = !!firstOfStem && /^[a-z]/.test(firstOfStem);
  const stemText = stemStartsLower ? stem : stem.charAt(0).toLowerCase() + stem.slice(1);

  let suggested = `${verbForTense} ${stemText}`.trim().replace(/\s+/g, " ");
  if (!/[.!?:;]$/.test(suggested)) suggested += ".";

  const needsNumber = !hasNumber || !MEASURE_RE.test(core);
  if (needsNumber) fixes.push("No measurable result found — add a number (%, $, time saved, volume) so the impact is concrete. Don't invent one; use a real figure.");

  if (MEASURE_RE.test(core)) fixes.push("Good — the result is quantified. Keep the number honest.");

  if (TIME_SAVED.test(core)) fixes.push("A time/cost saving is strong evidence. Lead with it where possible.");

  if (raw.split(/\s+/).length > 22) fixes.push("This bullet is longer than ~22 words — tighten it to 1–2 lines.");

  if (wasWeak || !verb) fixes.push("Formula used: [Strong action verb] + [what you did] + [result]. Fill in the method/tool and the result to complete it.");

  return {
    suggested: capitalize(suggested),
    verb: verbForTense,
    category: chosenCategory ?? "achievement",
    fixes,
    needsNumber,
    changedVerb: wasWeak || !verb,
  };
}

export function verbSuggestions(category: string, count = 8): string[] {
  const cat = VERB_BANK.find((c) => c.key === category);
  const list = (cat?.verbs ?? []).slice(0, count);
  return list.length ? list : VERB_BANK[0].verbs.slice(0, count);
}
