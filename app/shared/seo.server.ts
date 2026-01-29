export type SeoMetaInput = {
  title: string;
  description: string;
  canonical: string;
  image?: string;
  locale?: string;
  type?: "website" | "article";
};

const SCHEMA_ORG_CONTEXT = "https://schema.org";

export type MetaDescriptor =
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string }
  | { tagName: "link"; rel: string; href: string }
  | { "script:ld+json": Record<string, unknown> };

/**
 * Build origin from request (e.g. https://example.com).
 */
export function getOrigin(request: { url: string }): string {
  const url = new URL(request.url);
  return url.origin;
}

/**
 * Build canonical URL for current request (origin + pathname, no query).
 */
export function getCanonicalUrl(
  request: { url: string },
  pathOverride?: string
): string {
  const url = new URL(request.url);
  const path = pathOverride ?? url.pathname;
  return `${url.origin}${path}`.replace(/\/+/g, "/");
}

/**
 * SEO + AEO meta: title, description, Open Graph, Twitter Card, canonical.
 */
export function buildSeoMeta(input: SeoMetaInput): MetaDescriptor[] {
  const {
    title,
    description,
    canonical,
    image,
    locale = "zh_TW",
    type = "website",
  } = input;
  const tags: MetaDescriptor[] = [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: canonical },
    { property: "og:type", content: type },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: canonical },
    { property: "og:locale", content: locale.replace("-", "_") },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
  if (image) {
    tags.push(
      { property: "og:image", content: image },
      { name: "twitter:image", content: image }
    );
  }
  return tags;
}

/**
 * Schema.org WebSite — for home / site-level.
 */
export function buildJsonLdWebSite(
  origin: string,
  name: string,
  description: string
): Record<string, unknown> {
  return {
    "@context": SCHEMA_ORG_CONTEXT,
    "@type": "WebSite",
    name,
    description,
    url: origin,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${origin}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Schema.org WebPage — for any page.
 */
export function buildJsonLdWebPage(
  url: string,
  title: string,
  description: string,
  options?: {
    inLanguage?: string;
    datePublished?: string;
    dateModified?: string;
  }
): Record<string, unknown> {
  const page: Record<string, unknown> = {
    "@context": SCHEMA_ORG_CONTEXT,
    "@type": "WebPage",
    url,
    name: title,
    description,
  };
  if (options?.inLanguage) page.inLanguage = options.inLanguage;
  if (options?.datePublished) page.datePublished = options.datePublished;
  if (options?.dateModified) page.dateModified = options.dateModified;
  return page;
}

/**
 * Schema.org BreadcrumbList — for navigation.
 */
export function buildJsonLdBreadcrumbList(
  origin: string,
  items: Array<{ name: string; path: string }>
): Record<string, unknown> {
  return {
    "@context": SCHEMA_ORG_CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${origin}${item.path}`.replace(/\/+/g, "/"),
    })),
  };
}

/**
 * Schema.org Article — for release note / version page.
 */
export function buildJsonLdArticle(
  url: string,
  title: string,
  description: string,
  datePublished: string,
  options?: { dateModified?: string; inLanguage?: string }
): Record<string, unknown> {
  const article: Record<string, unknown> = {
    "@context": SCHEMA_ORG_CONTEXT,
    "@type": "Article",
    url,
    headline: title,
    description,
    datePublished,
  };
  if (options?.dateModified) article.dateModified = options.dateModified;
  if (options?.inLanguage) article.inLanguage = options.inLanguage;
  return article;
}
