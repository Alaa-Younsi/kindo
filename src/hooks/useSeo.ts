import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = import.meta.env.VITE_SITE_URL || "https://www.kindodz.com";
const SITE_NAME = "KINDO";

interface SeoOptions {
  title: string;
  description: string;
  image?: string;
  jsonLd?: Record<string, unknown>;
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function useSeo({ title, description, image, jsonLd }: SeoOptions) {
  const location = useLocation();
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : undefined;

  useEffect(() => {
    const previousTitle = document.title;
    const fullTitle = `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", `${SITE_URL}${location.pathname}`);
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", description);

    if (image) {
      upsertMeta("property", "og:image", image);
      upsertMeta("name", "twitter:image", image);
    }

    upsertLink("canonical", `${SITE_URL}${location.pathname}`);

    let script: HTMLScriptElement | null = null;
    if (jsonLdString) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = jsonLdString;
      script.dataset.pageSchema = "true";
      document.head.appendChild(script);
    }

    return () => {
      document.title = previousTitle;
      if (script) document.head.removeChild(script);
    };
  }, [title, description, image, location.pathname, jsonLdString]);
}
