import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { MetadataSearchPanel } from "~/features/metadata";
import {
  listContextPacks,
  parsePackIdFromRequest,
  resolveContentRoot,
} from "~/services/context-pack.server";
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

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const type = url.searchParams.get("type") ?? undefined;
  const page = Number(url.searchParams.get("page") ?? "1");
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
      query: query.trim(),
      activeType: type,
      activePackId: packId,
      packs: listContextPacks(resolveContentRoot()),
      results: result.data,
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
