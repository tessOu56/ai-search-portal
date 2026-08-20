/**
 * Portal deep links for knowledge / RAG hits — dual-entry handoff to
 * catalog + metadata with industry + commerce facets preserved.
 */

import { inferIndustryFacetsFromText } from "@ai-search-portal/contracts";

import type { LocalDoc } from "./rag/local-store.js";

export type KnowledgeLinkFacets = {
  materials?: string[];
  standards?: string[];
  techniques?: string[];
  productTypes?: string[];
  auctionEligible?: boolean;
};

export type KnowledgeLinkHit = Pick<
  LocalDoc,
  "id" | "title" | "kind" | "refs"
> & {
  facets?: KnowledgeLinkFacets;
};

function firstStandard(hit: KnowledgeLinkHit): string | undefined {
  const standards = hit.facets?.standards ?? [];
  // Prefer canonical-looking codes (digits / K) over long aliases.
  const preferred = standards.find((s) => /^\d{3,4}$|^(\d{2}K)$/i.test(s));
  return preferred ?? standards[0];
}

function firstMaterial(hit: KnowledgeLinkHit): string | undefined {
  return hit.facets?.materials?.[0];
}

function firstProductType(hit: KnowledgeLinkHit): string | undefined {
  return hit.facets?.productTypes?.[0];
}

/** Metadata asset-like refs from context packs. */
function isMetadataRef(ref: string): boolean {
  return /^(dim-|tbl-|metric-|api-|asset-)/i.test(ref);
}

export function buildCatalogFacetUrl(args: {
  q?: string;
  material?: string;
  standard?: string;
  productType?: string;
  auctionEligible?: boolean;
  intent?: "ai-fallback" | "manual";
}): string {
  const sp = new URLSearchParams();
  if (args.q) sp.set("q", args.q);
  if (args.material) sp.set("material", args.material);
  if (args.standard) sp.set("standard", args.standard);
  if (args.productType) sp.set("productType", args.productType);
  if (args.auctionEligible) sp.set("auctionEligible", "true");
  if (args.intent) sp.set("intent", args.intent);
  const qs = sp.toString();
  return qs ? `/catalog-search?${qs}` : "/catalog-search";
}

export function buildMetadataFacetUrl(args: {
  q?: string;
  pack?: string;
  material?: string;
  standard?: string;
  productType?: string;
  auctionEligible?: boolean;
  intent?: "ai-fallback" | "manual";
}): string {
  const sp = new URLSearchParams();
  if (args.q) sp.set("q", args.q);
  if (args.pack) sp.set("pack", args.pack);
  if (args.material) sp.set("material", args.material);
  if (args.standard) sp.set("standard", args.standard);
  if (args.productType) sp.set("productType", args.productType);
  if (args.auctionEligible) sp.set("auctionEligible", "true");
  if (args.intent) sp.set("intent", args.intent);
  const qs = sp.toString();
  return qs ? `/metadata?${qs}` : "/metadata";
}

/**
 * Primary deep link for a knowledge/RAG hit (source row).
 */
export function buildKnowledgeSourceUrl(
  hit: KnowledgeLinkHit,
  packId = "metalcraft-studio"
): string {
  const title = hit.title ?? hit.id;
  const standard = firstStandard(hit);
  const material = firstMaterial(hit);
  const productType = firstProductType(hit);
  const auctionEligible = hit.facets?.auctionEligible === true;
  const metaRef = (hit.refs ?? []).find(isMetadataRef);

  if (metaRef) {
    return `/metadata/${encodeURIComponent(metaRef)}?pack=${encodeURIComponent(packId)}`;
  }

  if (
    Boolean(standard) ||
    Boolean(material) ||
    Boolean(productType) ||
    Boolean(auctionEligible)
  ) {
    return buildCatalogFacetUrl({
      q: title,
      material,
      standard,
      productType,
      auctionEligible,
      intent: "manual",
    });
  }

  if (hit.kind === "glossary") {
    return buildMetadataFacetUrl({ q: title, pack: packId });
  }

  if (hit.kind === "ops") {
    return buildCatalogFacetUrl({ q: title, intent: "manual" });
  }

  return buildCatalogFacetUrl({ q: title, intent: "ai-fallback" });
}

/**
 * Extra "continue" links for facet-aware handoff outside LUI sources.
 * Chat UI ContinueFacets owns the primary catalog/metadata CTAs; do not
 * merge these into LuiResponse.sources (avoids duplicate "Continue in catalog").
 */
export function buildKnowledgeContinueSources(
  query: string,
  hit: KnowledgeLinkHit | undefined,
  packId = "metalcraft-studio"
): Array<{ title: string; url: string }> {
  const inferred = inferIndustryFacetsFromText(query);
  const standard = (hit ? firstStandard(hit) : undefined) ?? inferred.standard;
  const material = (hit ? firstMaterial(hit) : undefined) ?? inferred.material;
  const productType =
    (hit ? firstProductType(hit) : undefined) ?? inferred.productType;
  const auctionEligible =
    hit?.facets?.auctionEligible === true || inferred.auctionEligible === true;

  const links: Array<{ title: string; url: string }> = [];
  const facetBits = [
    standard,
    material,
    productType,
    auctionEligible ? "auction" : undefined,
  ].filter(Boolean);

  if (facetBits.length > 0) {
    links.push({
      title: `Continue in catalog (${facetBits.join(" · ")})`,
      url: buildCatalogFacetUrl({
        q: query,
        material,
        standard,
        productType,
        auctionEligible,
        intent: "manual",
      }),
    });
  } else if (query.trim()) {
    links.push({
      title: "Continue in catalog",
      url: buildCatalogFacetUrl({ q: query, intent: "manual" }),
    });
  }

  links.push({
    title: "Browse metadata catalog",
    url: buildMetadataFacetUrl({
      q: query || hit?.title,
      pack: packId,
      material,
      standard,
      productType,
      auctionEligible,
      intent: "manual",
    }),
  });

  return links;
}
