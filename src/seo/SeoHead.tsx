import { useEffect } from "react";
import { absUrl, SITE_URL } from "./brand";

export function SeoHead({
  title,
  description,
  path,
  jsonLd,
}: {
  title: string;
  description: string;
  path: string;
  jsonLd?: unknown[];
}) {
  const url = absUrl(path);
  const image = `${SITE_URL}/qd-logo.webp`;

  useEffect(() => {
    document.title = title;
    const set = (attr: string, key: string, value: string) => {
      let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
    };
    const setLink = (rel: string, href: string) => {
      let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement("link");
        el.rel = rel;
        document.head.appendChild(el);
      }
      el.href = href;
    };
    set("name", "description", description);
    set("property", "og:title", title);
    set("property", "og:description", description);
    set("property", "og:url", url);
    set("property", "og:image", image);
    set("property", "og:type", "website");
    set("property", "og:site_name", "Resume by QD");
    set("property", "og:locale", "en_US");
    set("name", "twitter:card", "summary_large_image");
    set("name", "twitter:title", title);
    set("name", "twitter:description", description);
    set("name", "twitter:image", image);
    setLink("canonical", url);

    const prev = document.getElementById("qd-jsonld");
    if (prev) prev.remove();
    if (jsonLd?.length) {
      const script = document.createElement("script");
      script.id = "qd-jsonld";
      script.type = "application/ld+json";
      script.text = JSON.stringify(jsonLd.length === 1 ? jsonLd[0] : jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, url, image, jsonLd]);

  return null;
}
