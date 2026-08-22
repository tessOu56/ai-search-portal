import type {
  KnowledgeMaterial,
  KnowledgeProductType,
} from "@ai-search-portal/contracts";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { Button } from "~/components/ui/Button";
import { MetadataSearchPanel } from "~/features/metadata";
import type { MetadataSearchIntent } from "~/features/metadata/MetadataSearchPanel";
import {
  listContextPacks,
  parsePackIdFromRequest,
  resolveContentRoot,
} from "~/services/context-pack.server";
import { searchKnowledge } from "~/services/knowledge-search.server";
import { listMetadataAssets } from "~/services/metadata.server";
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
  const page = Number(url.searchParams.get("page") ?? "1");
  const intentParam = url.searchParams.get("intent");
  const intent: MetadataSearchIntent | undefined =
    intentParam === "ai-fallback" || intentParam === "manual"
      ? intentParam
      : undefined;
  // Loaders trust URL only — inference is applied when AiFallback writes links.
  const { material, standard, productType, auctionEligible, facetWarning } =
    parseIndustryFacetsFromSearchParams(url.searchParams);
  const packId = parsePackIdFromRequest(request);
  const locale = await getLocale(request);
  const translations = getTranslations(locale);
  const origin = getOrigin(request);
  const canonical = getCanonicalUrl(request);
  const title = t(translations, "metadata.page.title");
  const description = t(translations, "metadata.page.description");
  const ogLocale = locale.replace("-", "_");
  const result = listMetadataAssets({
    q: query,
    type,
    page: Number.isFinite(page) ? page : 1,
    packId,
  });
  const trimmedQuery = query.trim();
  const knowledgeHits =
    Boolean(material) ||
    Boolean(standard) ||
    Boolean(productType) ||
    Boolean(auctionEligible)
      ? searchKnowledge({
          q: trimmedQuery ? trimmedQuery : undefined,
          packId,
          material: material as KnowledgeMaterial | undefined,
          standard,
          productType: productType as KnowledgeProductType | undefined,
          auctionEligible,
          limit: 4,
        }).data
      : [];
  const structuredData = [
    buildJsonLdWebPage(canonical, title, description, { inLanguage: locale }),
    buildJsonLdBreadcrumbList(origin, [
      { name: t(translations, "app.title"), path: "/" },
      { name: title, path: "/metadata" },
    ]),
  ];
  return {
    title,
    description,
    canonical,
    image: `${origin}/og-image.png`,
    locale: ogLocale,
    structuredData,
    model: {
      query: trimmedQuery,
      activeType: type,
      activePackId: packId,
      intent,
      activeMaterial: material,
      activeStandard: standard,
      activeProductType: productType,
      activeAuctionEligible: auctionEligible,
      facetWarning,
      packs: listContextPacks(resolveContentRoot()),
      results: result.data,
      knowledgeHits,
      pagination: result.pagination,
    },
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

export default function MetadataIndexPage() {
  const { model } = useLoaderData<typeof loader>();
  return <MetadataSearchPanel model={model} />;
}

export function ErrorBoundary() {
  return (
    <div className="border-destructive/30 bg-destructive/5 space-y-3 rounded-lg border p-6">
      <h1 className="text-lg font-semibold text-destructive">
        Data assets hit an error
      </h1>
      <p className="text-sm text-muted-foreground">
        Something went wrong while loading assets. Filters live in the URL —
        resetting them usually recovers.
      </p>
      <Button asChild>
        <Link to="/metadata">Reset filters and retry</Link>
      </Button>
    </div>
  );
}
