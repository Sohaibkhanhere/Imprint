/** Strip markup that must never reach resume state or the DOM as HTML. React already
 *  escapes text nodes; this is a second pass for stored strings, imports, and URLs. */

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const SCRIPT_TAG = /<\/?script\b[^>]*>/gi;
const DANGEROUS_TAG = /<\/?(?:iframe|object|embed|link|meta|base|form|svg|math)\b[^>]*>/gi;
const EVENT_ATTR = /\s+on[a-zA-Z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/g;
const JS_PROTOCOL = /(?:javascript|vbscript|data\s*:\s*text\/html)\s*:/gi;
const JS_PROTOCOL_TEST = /(?:javascript|vbscript|data\s*:\s*text\/html)\s*:/i;
const SAFE_DATA_IMAGE = /^data:image\/(jpeg|jpg|png|webp|gif);base64,[a-z0-9+/=\s]+$/i;
const SAFE_RELATIVE_IMAGE = /^\/(?!\/)[a-z0-9._/~-]*$/i;

export function sanitizePlainText(input: unknown): string {
  if (typeof input === "number" || typeof input === "boolean") return String(input);
  if (typeof input !== "string") return "";
  return input
    .replace(SCRIPT_TAG, "")
    .replace(DANGEROUS_TAG, "")
    .replace(EVENT_ATTR, "")
    .replace(JS_PROTOCOL, "")
    .replace(CONTROL_CHARS, "");
}

/** Imported CV bytes become plain text before parseCvText / resume state. */
export function sanitizeImportedText(input: unknown): string {
  return sanitizePlainText(input);
}

export function sanitizeAccent(value: unknown, fallback = "#1d2130"): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toLowerCase();
  }
  return fallback;
}

export function sanitizePhotoUrl(value: unknown): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";
  if (SAFE_DATA_IMAGE.test(raw.replace(/\s+/g, ""))) return raw.replace(/\s+/g, "");
  if (SAFE_RELATIVE_IMAGE.test(raw)) return raw;
  return "";
}

export function isSafeCaptureImageSrc(src: string): boolean {
  if (!src) return false;
  if (JS_PROTOCOL_TEST.test(src) || /svg\+xml/i.test(src) || /^data:text/i.test(src)) return false;
  try {
    const url = new URL(src, typeof window !== "undefined" ? window.location.origin : "https://localhost");
    if (url.protocol === "data:") return /^data:image\/(jpeg|jpg|png|webp|gif)/i.test(src);
    if (url.protocol === "blob:") return true;
    if (typeof window !== "undefined" && url.origin === window.location.origin) return true;
    return false;
  } catch {
    return false;
  }
}
