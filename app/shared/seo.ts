export type SeoMetaInput = {
  title: string;
  description: string;
  canonical: string;
  image?: string;
  locale?: string;
  type?: "website" | "article";
};

/** Loader 回傳給 meta 的 SEO 欄位形狀，供 route meta 使用以避免型別斷言 */
export type SeoLoaderData = {
  title: string;
  description: string;
  canonical: string;
  image?: string;
  locale: string;
  structuredData: Record<string, unknown>[];
};

const DEFAULT_SEO: SeoLoaderData = {
  title: "Portal",
  description: "用一句話問資料目錄、權限與 API",
  canonical: "",
  locale: "zh_TW",
  structuredData: [],
};

function toStructuredData(
  raw: unknown,
  fallback: Record<string, unknown>[]
): Record<string, unknown>[] {
  if (!Array.isArray(raw)) return fallback;
  return raw.filter(
    (item): item is Record<string, unknown> =>
      typeof item === "object" && item !== null
  );
}

/**
 * 從 loader data 取出 SEO 欄位並補預設值，供 meta 使用，避免在 route 內做型別斷言。
 */
// eslint-disable-next-line complexity -- data shape branches for title/description/canonical/locale/image/structuredData
export function getSeoFromLoader(
  data: unknown,
  defaults: Partial<SeoLoaderData> = {}
): SeoLoaderData {
  const d =
    data && typeof data === "object" ? (data as Record<string, unknown>) : null;
  if (!d) return { ...DEFAULT_SEO, ...defaults };
  const imageVal =
    typeof d.image === "string" ? d.image : (defaults.image ?? undefined);
  return {
    title:
      typeof d.title === "string"
        ? d.title
        : (defaults.title ?? DEFAULT_SEO.title),
    description:
      typeof d.description === "string"
        ? d.description
        : (defaults.description ?? DEFAULT_SEO.description),
    canonical:
      typeof d.canonical === "string"
        ? d.canonical
        : (defaults.canonical ?? DEFAULT_SEO.canonical),
    ...(imageVal !== undefined && { image: imageVal }),
    locale:
      typeof d.locale === "string"
        ? d.locale
        : (defaults.locale ?? DEFAULT_SEO.locale),
    structuredData: toStructuredData(
      d.structuredData,
      defaults.structuredData ?? DEFAULT_SEO.structuredData
    ),
  };
}

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
  return new URL(path, `${url.origin}/`).toString();
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

/**
 * Schema.org Dataset — public asset detail. Does not claim chat answers are indexed.
 */
export function buildJsonLdDataset(args: {
  url: string;
  name: string;
  description: string;
  identifier: string;
  dateModified?: string;
  creator?: string;
  isAccessibleForFree?: boolean;
}): Record<string, unknown> {
  const dataset: Record<string, unknown> = {
    "@context": SCHEMA_ORG_CONTEXT,
    "@type": "Dataset",
    url: args.url,
    name: args.name,
    description: args.description,
    identifier: args.identifier,
  };
  if (args.dateModified) dataset.dateModified = args.dateModified;
  if (args.creator) {
    dataset.creator = { "@type": "Person", name: args.creator };
  }
  if (args.isAccessibleForFree !== undefined) {
    dataset.isAccessibleForFree = args.isAccessibleForFree;
  }
  return dataset;
}

/**
 * Schema.org FAQPage — short public questions on an asset page.
 */
export function buildJsonLdFaqPage(
  url: string,
  items: Array<{ question: string; answer: string }>
): Record<string, unknown> {
  return {
    "@context": SCHEMA_ORG_CONTEXT,
    "@type": "FAQPage",
    url,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
