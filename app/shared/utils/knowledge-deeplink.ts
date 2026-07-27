/**
 * Resolve portal deep links for knowledge chunks (catalog / metadata).
 */

import { buildCatalogSearchUrl } from "~/features/catalogsearch/catalog-search-url";
import { buildMetadataSearchUrl } from "~/features/metadata/metadata-search-url";

export type KnowledgeDeepLinkChunk = {
  id: string;
  title: string;
  kind: string;
  refs?: string[];
  facets?: {
    materials?: string[];
    standards?: string[];
    productTypes?: string[];
    auctionEligible?: boolean;
  };
};

function isMetadataRef(ref: string): boolean {
  return /^(dim-|tbl-|metric-|api-|asset-)/i.test(ref);
}

function firstStandard(chunk: KnowledgeDeepLinkChunk): string | undefined {
  const standards = chunk.facets?.standards ?? [];
  const preferred = standards.find((s) => /^\d{3,4}$|^(\d{2}K)$/i.test(s));
  return preferred ?? standards[0];
}

export function buildKnowledgeChunkHref(
  chunk: KnowledgeDeepLinkChunk,
  packId: string,
  intent?: "ai-fallback" | "manual"
): string {
  const metaRef = (chunk.refs ?? []).find(isMetadataRef);
  if (metaRef) {
    return `/metadata/${encodeURIComponent(metaRef)}?pack=${encodeURIComponent(packId)}`;
  }
  const standard = firstStandard(chunk);
  const material = chunk.facets?.materials?.[0];
  const productType = chunk.facets?.productTypes?.[0];
  const auctionEligible = chunk.facets?.auctionEligible === true;
  if (standard || material || productType || auctionEligible) {
    return buildCatalogSearchUrl({
      q: chunk.title,
      material,
      standard,
      productType,
      auctionEligible,
      intent,
    });
  }
  if (chunk.kind === "glossary") {
    return buildMetadataSearchUrl({
      q: chunk.title,
      pack: packId,
      intent,
    });
  }
  return buildCatalogSearchUrl({ q: chunk.title, intent });
}
