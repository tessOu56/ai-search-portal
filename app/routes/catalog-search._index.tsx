import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { Button } from "~/components/ui/Button";
import { CatalogSearchPanel } from "~/features/catalogsearch";
import { getCatalogSearchViewModel } from "~/features/catalogsearch/catalog-search.server";
import type { CatalogSearchIntent } from "~/features/catalogsearch/catalog-search.types";
import { parsePackIdFromRequest } from "~/services/context-pack.server";
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
import { parseIndustryFacetsFromSearchParams } from "~/shared/utils/industry-facets-url";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const type = url.searchParams.get("type") ?? undefined;
  const { material, standard, productType, auctionEligible, facetWarning } =
    parseIndustryFacetsFromSearchParams(url.searchParams);
  const page = Number(url.searchParams.get("page") ?? "1");
  const intentParam = url.searchParams.get("intent");
  const intent: CatalogSearchIntent | undefined =
    intentParam === "ai-fallback" || intentParam === "manual"
      ? intentParam
      : undefined;
  const packId = parsePackIdFromRequest(request);
  const locale = await getLocale(request);
  const translations = getTranslations(locale);
  const origin = getOrigin(request);
  const canonical = getCanonicalUrl(request);
  const title = t(translations, "catalog-search.page.title");
  const description = t(translations, "catalog-search.page.description");
  const ogLocale = locale.replace("-", "_");
  const structuredData = [
    buildJsonLdWebPage(canonical, title, description, { inLanguage: locale }),
    buildJsonLdBreadcrumbList(origin, [
      { name: t(translations, "app.title"), path: "/" },
      { name: title, path: "/catalog-search" },
    ]),
  ];
  return {
    title,
    description,
    canonical,
    image: `${origin}/og-image.png`,
    locale: ogLocale,
    structuredData,
    model: getCatalogSearchViewModel(query, {
      type,
      page: Number.isFinite(page) ? page : 1,
      packId,
      intent,
      material,
      standard,
      productType,
      auctionEligible,
      facetWarning,
    }),
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

export default function CatalogSearchPage() {
  const { model } = useLoaderData<typeof loader>();
  return <CatalogSearchPanel model={model} />;
}

/**
 * Route-level error state (four-state completeness — visual-quality-plan A1).
 * Manual path stays available: reset link returns to the bare URL contract.
 */
export function ErrorBoundary() {
  return (
    <div className="border-destructive/30 bg-destructive/5 space-y-3 rounded-lg border p-6">
      <h1 className="text-lg font-semibold text-destructive">
        Catalog search hit an error
      </h1>
      <p className="text-sm text-muted-foreground">
        Something went wrong while loading results. Your filters live in the URL
        — resetting them usually recovers.
      </p>
      <Button asChild>
        <Link to="/catalog-search">Reset filters and retry</Link>
      </Button>
    </div>
  );
}
