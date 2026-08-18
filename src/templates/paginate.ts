/** Smart page-break offsets for a measured resume (content coordinates, px). */

const CANDIDATE_SEL = [
  ".t-section",
  ".sheet-section",
  ".t-entry",
  ".sheet-entry",
  ".t-head",
  ".sheet-section-head",
  ".t-skillgroup",
  ".ats-hero",
  ".c-header",
  "header",
  "section",
  "h1",
  "h2",
  "h3",
  "li",
  "p",
].join(",");

const HEADING_SEL = [
  "h1",
  "h2",
  "h3",
  ".t-head",
  ".sheet-section-head",
  ".ats-kicker",
  ".c-entry-head",
  ".t-entry-head",
].join(",");

const ATOMIC_SEL = ".c-header, .ats-hero, header";
const ENTRY_SLACK = 80;

export const PAGE_STACK_GAP = 24;

export function paginateClassName(className: string): boolean {
  return className.split(/\s+/).some((c) => c === "tpl-classic" || c === "tpl-ats-safe");
}

function relTop(el: Element, origin: DOMRect): number {
  return el.getBoundingClientRect().top - origin.top;
}

function relBottom(el: Element, origin: DOMRect): number {
  return el.getBoundingClientRect().bottom - origin.top;
}

function priority(el: Element): number {
  if (el.matches(".t-section, .sheet-section, .t-head, .sheet-section-head, h2")) return 3;
  if (el.matches(".t-entry, .sheet-entry, .c-cert, .t-cert")) return 2;
  if (el.matches("li")) return 1;
  return 0;
}

type Candidate = { start: number; el: Element; priority: number };

function collectCandidates(content: HTMLElement, origin: DOMRect): Candidate[] {
  const nodes = [...content.querySelectorAll(CANDIDATE_SEL)];
  const out: Candidate[] = [];
  for (const n of nodes) {
    if (n.closest(ATOMIC_SEL) && !n.matches(ATOMIC_SEL)) continue;
    const start = Math.round(relTop(n, origin));
    if (start < 0) continue;
    out.push({ start, el: n, priority: priority(n) });
  }
  out.sort((a, b) => a.start - b.start || b.priority - a.priority);
  return out;
}

function pickBreak(candidates: Candidate[], y: number, limit: number, minKeep: number): number {
  const filled = candidates.filter((c) => c.start > y + minKeep && c.start <= limit);
  if (!filled.length) return limit;
  const maxStart = filled[filled.length - 1].start;
  const near = filled.filter((c) => maxStart - c.start <= ENTRY_SLACK);
  near.sort((a, b) => b.priority - a.priority || b.start - a.start);
  return near[0]?.start ?? maxStart;
}

export function computePageOffsets(content: HTMLElement, pageInnerH: number): number[] {
  const origin = content.getBoundingClientRect();
  const total = content.scrollHeight;
  if (total <= pageInnerH + 2) return [0];

  const candidates = collectCandidates(content, origin);
  const headings = [...content.querySelectorAll(HEADING_SEL)]
    .filter((n) => !n.closest(ATOMIC_SEL) || n.matches(ATOMIC_SEL))
    .map((n) => ({
      top: Math.round(relTop(n, origin)),
      bottom: Math.round(relBottom(n, origin)),
    }));

  const offsets: number[] = [0];
  let y = 0;
  const minKeep = 48;
  let guard = 0;
  while (y + pageInnerH < total - 2 && guard++ < 12) {
    const limit = y + pageInnerH;
    let breakAt = pickBreak(candidates, y, limit, minKeep);
    for (const h of headings) {
      if (h.top <= y + 4 || h.top >= breakAt) continue;
      if (h.bottom + 14 >= breakAt) breakAt = h.top;
    }
    if (breakAt <= y + minKeep) breakAt = limit;
    offsets.push(breakAt);
    y = breakAt;
  }
  return offsets;
}

export function offsetsEqual(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < 1);
}
