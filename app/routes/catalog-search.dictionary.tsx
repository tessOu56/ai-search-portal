import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";

import { getDictionaryModel } from "~/features/catalogsearch/dictionary.server";
import { DictionaryPanel } from "~/features/catalogsearch/DictionaryPanel";
import { getLocale, getTranslations } from "~/shared/i18n";
import { t } from "~/shared/i18n/server";
import {
  buildJsonLdBreadcrumbList,
  buildJsonLdWebPage,
  buildSeoMeta,
  getCanonicalUrl,
  getOrigin,
  getSeoFromLoader,
} from "~/shared/seo";

/**
 * T-2026-017 — virtualized catalog dictionary (10k mock rows).
 * Lives under the /catalog-search layout; the paginated _index route and its
 * URL contract (?q= ?type= ?page=) are untouched (no-regression acceptance).
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const type = url.searchParams.get("type") ?? undefined;
  const virtual = url.searchParams.get("virtual") !== "off";
  const locale = await getLocale(request);
  const translations = getTranslations(locale);
  const origin = getOrigin(request);
  const canonical = getCanonicalUrl(request);
  const title = t(translations, "nav.catalog-dictionary");
  const description = t(translations, "dictionary.page.description");
  const ogLocale = locale.replace("-", "_");
  const structuredData = [
    buildJsonLdWebPage(canonical, title, description, { inLanguage: locale }),
    buildJsonLdBreadcrumbList(origin, [
      { name: t(translations, "app.title"), path: "/" },
      { name: t(translations, "nav.catalog-search"), path: "/catalog-search" },
      { name: title, path: "/catalog-search/dictionary" },
    ]),
  ];
  return {
    title,
    description,
    canonical,
    image: `${origin}/og-image.png`,
    locale: ogLocale,
    structuredData,
    model: getDictionaryModel(query, { type, virtual }),
  };
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const seo = getSeoFromLoader(data);
  const metaTags = buildSeoMeta({
    title: seo.title,
    description: seo.description,
    canonical: seo.canonical,
    image: seo.image,
    locale: seo.locale,
    type: "website",
  });
  const jsonLdTags = seo.structuredData.map((obj) => ({
    "script:ld+json": obj,
  }));
  return [...metaTags, ...jsonLdTags];
};

export default function CatalogDictionaryPage() {
  const { model } = useLoaderData<typeof loader>();
  return <DictionaryPanel model={model} />;
}
