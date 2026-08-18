import type { PageMargins, PageSize, ThemeConfig } from "./types";

export type { PageMargins };

export const MARGIN_MIN = 8;
export const MARGIN_MAX = 32;

export const DEFAULT_MARGINS: Record<PageSize, PageMargins> = {
  a4: { top: 13, right: 14, bottom: 13, left: 14 },
  letter: { top: 11, right: 13, bottom: 11, left: 13 },
};

export const TIGHT_MARGINS: PageMargins = { top: 10, right: 10, bottom: 10, left: 10 };
export const WIDE_MARGINS: PageMargins = { top: 18, right: 18, bottom: 18, left: 18 };

export function clampMm(n: unknown, fallback: number): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.round(Math.min(MARGIN_MAX, Math.max(MARGIN_MIN, v)));
}

export function sanitizeMargins(raw: unknown, pageSize: PageSize): PageMargins {
  const d = DEFAULT_MARGINS[pageSize] ?? DEFAULT_MARGINS.a4;
  if (!raw || typeof raw !== "object") return { ...d };
  const o = raw as Record<string, unknown>;
  return {
    top: clampMm(o.top, d.top),
    right: clampMm(o.right, d.right),
    bottom: clampMm(o.bottom, d.bottom),
    left: clampMm(o.left, d.left),
  };
}

export function marginsEqual(a: PageMargins, b: PageMargins): boolean {
  return a.top === b.top && a.right === b.right && a.bottom === b.bottom && a.left === b.left;
}

export function mmToPx(mm: number): number {
  return Math.round((mm * 96) / 25.4);
}

export function mmToTwip(mm: number): number {
  return Math.round((mm / 25.4) * 1440);
}

export function sheetPaddingCss(m: PageMargins): string {
  return `${mmToPx(m.top)}px ${mmToPx(m.right)}px ${mmToPx(m.bottom)}px ${mmToPx(m.left)}px`;
}

export function sheetPaddingX(m: PageMargins): string {
  return `0 ${mmToPx(m.right)}px 0 ${mmToPx(m.left)}px`;
}

export function sheetPadVars(m: PageMargins): Record<string, string> {
  return {
    "--page-pad-top": `${mmToPx(m.top)}px`,
    "--page-pad-right": `${mmToPx(m.right)}px`,
    "--page-pad-bottom": `${mmToPx(m.bottom)}px`,
    "--page-pad-left": `${mmToPx(m.left)}px`,
  };
}

export function marginsForTheme(theme: Pick<ThemeConfig, "pageSize" | "margins"> | undefined): PageMargins {
  const pageSize = theme?.pageSize === "letter" ? "letter" : "a4";
  return theme?.margins ?? DEFAULT_MARGINS[pageSize];
}

export function patchPageSize(theme: ThemeConfig, pageSize: PageSize): Partial<ThemeConfig> {
  const current = theme.pageSize === "letter" ? "letter" : "a4";
  const keep = theme.margins ? !marginsEqual(theme.margins, DEFAULT_MARGINS[current]) : false;
  return {
    pageSize,
    margins: keep && theme.margins ? theme.margins : { ...DEFAULT_MARGINS[pageSize] },
  };
}

export type MarginPreset = "tight" | "standard" | "wide" | "custom";

export function activeMarginPreset(m: PageMargins, pageSize: PageSize): MarginPreset {
  if (marginsEqual(m, DEFAULT_MARGINS[pageSize])) return "standard";
  if (marginsEqual(m, TIGHT_MARGINS)) return "tight";
  if (marginsEqual(m, WIDE_MARGINS)) return "wide";
  return "custom";
}

export function presetMargins(preset: Exclude<MarginPreset, "custom">, pageSize: PageSize): PageMargins {
  if (preset === "tight") return { ...TIGHT_MARGINS };
  if (preset === "wide") return { ...WIDE_MARGINS };
  return { ...DEFAULT_MARGINS[pageSize] };
}
