/** Safe string trim for resume fields that may be missing on old saves. */
export function t(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (v == null) return "";
  return String(v).trim();
}
