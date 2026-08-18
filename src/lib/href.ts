import { t } from "./safe";
import { cleanUrl } from "./date";

const DANGEROUS = /(?:javascript|vbscript|data)\s*:/i;

export type ContactItem = {
  text: string;
  href?: string;
};

export function safeHref(raw: string, kind?: "email" | "phone" | "url"): string | null {
  const s = t(raw).trim();
  if (!s || DANGEROUS.test(s)) return null;

  if (kind === "email" || (!kind && /^mailto:/i.test(s)) || (!kind && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))) {
    const email = s.replace(/^mailto:/i, "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
    return `mailto:${email}`;
  }

  if (kind === "phone" || (!kind && /^tel:/i.test(s)) || (!kind && /^[+]?[\d\s().-]{7,22}$/.test(s) && /\d{7,}/.test(s))) {
    const tel = s.replace(/^tel:/i, "").replace(/[^\d+]/g, "");
    if (tel.replace(/\D/g, "").length < 7) return null;
    return `tel:${tel}`;
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
  return items;
}
