import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getPageMetadata, PAGE_METADATA_SITE } from "./page-metadata.config";

function upsertMeta(
  attribute: "name" | "property",
  key: string,
  content: string,
) {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${key}"]`,
  );

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.content = content;
}

function upsertCanonical(url: string) {
  let element = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );

  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.appendChild(element);
  }

  element.href = url;
}

export default function PageMetadata() {
  const location = useLocation();

  useEffect(() => {
    const metadata = getPageMetadata(location.pathname);
    const url = new URL(metadata.path, PAGE_METADATA_SITE.url).toString();

    document.title = metadata.title;
    upsertCanonical(url);
    upsertMeta("name", "description", metadata.description);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:site_name", PAGE_METADATA_SITE.name);
    upsertMeta("property", "og:title", metadata.title);
    upsertMeta("property", "og:description", metadata.description);
    upsertMeta("property", "og:image", PAGE_METADATA_SITE.image);
    upsertMeta("property", "og:url", url);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", metadata.title);
    upsertMeta("name", "twitter:description", metadata.description);
    upsertMeta("name", "twitter:image", PAGE_METADATA_SITE.image);
  }, [location.pathname]);

  return null;
}
