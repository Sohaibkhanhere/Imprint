import { t } from "./safe";
import { cleanUrl } from "./date";

const DANGEROUS = /(?:javascript|vbscript|data)\s*:/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ContactItem = {
  text: string;
  href?: string;
};

export function parseEmailAddress(raw: string): string | null {
  const s = t(raw).trim();
  if (!s || DANGEROUS.test(s)) return null;
  const email = s.replace(/^mailto:/i, "").split(/[?#]/)[0].trim();
  return EMAIL_RE.test(email) ? email : null;
}

/** Gmail compose for the address on the resume. Preview and PDF both use this. */
export function gmailComposeHref(raw: string): string | null {
  const email = parseEmailAddress(raw);
  if (!email) return null;
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`;
}

/** WhatsApp chat for the number on the resume. Digits only, with country code. */
export function whatsappHref(raw: string): string | null {
  const s = t(raw).replace(/^tel:/i, "");
  let digits = s.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length < 7 || digits.length > 15) return null;
  return `https://wa.me/${digits}`;
}

export function pdfHref(raw: string, kind?: "email" | "phone" | "url"): string | null {
  if (kind === "email") return gmailComposeHref(raw);
  if (kind === "phone") return whatsappHref(raw);
  const href = safeHref(raw, kind);
  if (href && /^mailto:/i.test(href)) return gmailComposeHref(href);
  if (href && /^tel:/i.test(href)) return whatsappHref(href);
  if (!kind && parseEmailAddress(raw)) return gmailComposeHref(raw);
  return href;
}

export function safeHref(raw: string, kind?: "email" | "phone" | "url"): string | null {
  const s = t(raw).trim();
  if (!s || DANGEROUS.test(s)) return null;

  if (kind === "email" || (!kind && /^mailto:/i.test(s)) || (!kind && EMAIL_RE.test(s))) {
    return gmailComposeHref(s);
  }

  if (kind === "phone" || (!kind && /^tel:/i.test(s)) || (!kind && /^[+]?[\d\s().-]{7,22}$/.test(s) && /\d{7,}/.test(s))) {
    return whatsappHref(s);
  }

  let next = s;
  if (/^https?:\/\//i.test(s)) next = s;
  else if (s.startsWith("//")) next = `https:${s}`;
  else next = `https://${s.replace(/^https?:\/\//i, "")}`;

  try {
    const url = new URL(next);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (DANGEROUS.test(url.href)) return null;
    if (!url.hostname.includes(".")) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function contactItems(contact: {
  phone?: string;
  email?: string;
  city?: string;
  country?: string;
  linkedin?: string;
  website?: string;
  github?: string;
  socials?: { label?: string; url?: string }[];
}): ContactItem[] {
  const items: ContactItem[] = [];
  const phone = t(contact.phone);
  const email = t(contact.email);
  const loc = [t(contact.city), t(contact.country)].filter(Boolean).join(", ");
  const linkedin = t(contact.linkedin);
  const github = t(contact.github);
  const website = t(contact.website);
  if (phone) items.push({ text: phone, href: safeHref(phone, "phone") ?? undefined });
  if (email) items.push({ text: email, href: safeHref(email, "email") ?? undefined });
  if (loc) items.push({ text: loc });
  if (linkedin) items.push({ text: cleanUrl(linkedin), href: safeHref(linkedin, "url") ?? undefined });
  if (github) items.push({ text: cleanUrl(github), href: safeHref(github, "url") ?? undefined });
  if (website) items.push({ text: cleanUrl(website), href: safeHref(website, "url") ?? undefined });
  for (const social of contact.socials ?? []) {
    const url = t(social.url);
    const href = url ? safeHref(url, "url") : null;
    if (!href) continue;
    items.push({ text: t(social.label) || cleanUrl(url), href });
  }
  return items;
}
