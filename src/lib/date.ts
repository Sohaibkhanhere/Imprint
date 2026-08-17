import { t } from "./safe";

export function formatRange(start: string | undefined, end: string | undefined, present: boolean): string {
  const s = t(start);
  const e = t(end);
  if (!s && !e && !present) return "";
  const fmt = (v: string) => (v.length === 4 ? v : v);
  if (present) return `${s ? fmt(s) : "Present"} \u2013 Present`;
  if (s && e) return `${fmt(s)} \u2013 ${fmt(e)}`;
  if (s) return fmt(s);
  return e;
}

export function formatYear(year: string): string {
  return t(year);
}

export function filePart(value: string): string {
  return t(value)
    .replace(/[<>:"/\\|?*]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/ /g, "-");
}

export function exportStem(contact: { fullName?: string; title?: string }): string {
  const name = filePart(contact?.fullName || "") || "Resume";
  const title = filePart(contact?.title || "");
  return title ? `${name}-${title}` : name;
}

export function exportFilename(contact: { fullName?: string; title?: string }): string {
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
