import { t } from "./safe";

export function formatRange(start: string | undefined, end: string | undefined, present: boolean): string {
  const s = t(start);
  const e = t(end);
  if (!s && !e && !present) return "";
  const fmt = (v: string) => (v.length === 4 ? v : v);
  if (present) return `${s ? fmt(s) : "Present"} \u2013 Present`;
  if (s && e) return `${fmt(s)} \u2013 ${fmt(e)}`;
  if (s) return `${fmt(s)} \u2013 ${e}`;
  return e;
}

export function formatYear(year: string): string {
  return t(year);
}

export function slugify(name: string): string {
  return t(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function exportStem(contact: { fullName?: string }): string {
  const parts = t(contact?.fullName).split(/\s+/);
  const first = slugify(parts[0] ?? "Resume");
  const last = slugify(parts[parts.length - 1] ?? "");
  const name = parts.length > 1 ? `${first}-${last}` : first || "resume";
  return `${name || "resume"}-Resume`;
}

export function exportFilename(contact: { fullName?: string }): string {
  return exportStem(contact);
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function cleanUrl(url: string): string {
  return t(url)
    .replace(/^https?:\/\/(www\.)?/, "")
    .replace(/\/$/, "");
}

export function todayISO(): string {
  return new Date().toISOString();
}
