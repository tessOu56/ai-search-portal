import type {
  KnowledgeMaterial,
  KnowledgeProductType,
} from "@ai-search-portal/contracts";
import { DEFAULT_CONTEXT_PACK_ID } from "@ai-search-portal/contracts";

import { searchKnowledge } from "~/services/knowledge-search.server";
import { listMetadataAssets } from "~/services/metadata.server";
import { buildKnowledgeChunkHref } from "~/shared/utils/knowledge-deeplink";

import type {
  CatalogApiRow,
  CatalogSearchIntent,
  CatalogSearchViewModel,
} from "./catalog-search.types";

const PAGE_SIZE = 5;

const PLACEHOLDER_RESULTS: Omit<CatalogApiRow, "source">[] = [
  {
    id: "api-001",
    name: "GET /dictionary/search",
    description: "Catalog search endpoint (mock row)",
    itemType: "API",
  },
  {
    id: "api-002",
    name: "GET /maisy/short_chat_with_mindmap",
    description: "Maisy short chat (mock row)",
    itemType: "API",
  },
  {
    id: "api-003",
    name: "GET /datasets/public",
    description: "Public dataset listing (mock row)",
    itemType: "Dataset",
  },
];

export type CatalogSearchParams = {
  query?: string;
  type?: string;
  page?: number;
  packId?: string;
  intent?: CatalogSearchIntent;
  material?: string;
  standard?: string;
  productType?: string;
  auctionEligible?: boolean;
  facetWarning?: string;
};

function filterPlaceholderRows(
  query: string,
  typeFilter?: string
): CatalogApiRow[] {
  const q = query.trim().toLowerCase();
  let rows = PLACEHOLDER_RESULTS.map((row) => ({
    ...row,
    source: "catalog" as const,
  }));

  if (q.length > 0) {
    rows = rows.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.description.toLowerCase().includes(q)
    );
  }
  if (typeFilter) {
    rows = rows.filter(
      (row) => row.itemType.toLowerCase() === typeFilter.toLowerCase()
    );
  }

  return rows;
}

function paginateRows<T>(
  rows: T[],
  page: number
): {
  results: T[];
  pagination: CatalogSearchViewModel["pagination"];
} {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * PAGE_SIZE;

  return {
    results: rows.slice(start, start + PAGE_SIZE),
    pagination: {
      page: safePage,
      pageSize: PAGE_SIZE,
      total,
      totalPages,
    },
  };
}

const BASE_FILTERS: CatalogSearchViewModel["filters"] = [
  {
    id: "filter_type",
    label: "Type",
    options: [
      { value: "API", label: "API" },
      { value: "Dataset", label: "Dataset" },
      { value: "Table", label: "Table" },
      { value: "Dashboard", label: "Dashboard" },
    ],
  },
  {
    id: "access",
    label: "Access",
    options: [
      { value: "public", label: "Public" },
      { value: "restricted", label: "Restricted" },
    ],
  },
];

/** Server-only placeholder data until internal catalog adapters land. */
export function getCatalogSearchPlaceholder(
  query: string,
  params: CatalogSearchParams = {}
): CatalogSearchViewModel {
  const typeFilter = params.type?.trim();
  const page = Math.max(1, params.page ?? 1);
  const rows = filterPlaceholderRows(query, typeFilter);
  const { results, pagination } = paginateRows(rows, page);

  return {
    phase: "placeholder",
    query: query.trim(),
    intent: params.intent,
    activeType: typeFilter,
    filters: BASE_FILTERS,
    results,
    pagination,
    sourceCounts: {
      metadata: 0,
      catalog: rows.length,
      knowledge: 0,
    },
  };
}

/**
 * Hybrid catalog view — knowledge chunks + metadata assets + placeholder rows.
 */
export function getCatalogSearchViewModel(
  query: string,
  params: CatalogSearchParams = {}
): CatalogSearchViewModel {
  const trimmedQuery = query.trim();
  const typeFilter = params.type?.trim();
  const material = params.material?.trim() || undefined;
  const standard = params.standard?.trim() || undefined;
  const productType = params.productType?.trim() || undefined;
  const auctionEligible = params.auctionEligible === true ? true : undefined;
  const page = Math.max(1, params.page ?? 1);
  const packId = params.packId ?? DEFAULT_CONTEXT_PACK_ID;

  const knowledgeResult = searchKnowledge({
    q: trimmedQuery,
    packId,
    material: material as KnowledgeMaterial | undefined,
    standard,
    productType: productType as KnowledgeProductType | undefined,
    auctionEligible,
    limit: 20,
  });

  const knowledgeRows: CatalogApiRow[] = knowledgeResult.data.map((chunk) => ({
    id: chunk.id,
    name: chunk.title,
    description: chunk.text,
    itemType: chunk.kind,
    source: "knowledge" as const,
    detailHref: buildKnowledgeChunkHref(
      {
        id: chunk.id,
        title: chunk.title,
        kind: chunk.kind,
        refs: chunk.refs,
        facets: chunk.facets,
      },
      packId,
      params.intent
    ),
    facets: {
      materials: chunk.facets.materials,
      techniques: chunk.facets.techniques,
      standards: chunk.facets.standards,
      productTypes: chunk.facets.productTypes,
      auctionEligible: chunk.facets.auctionEligible,
      classification: chunk.facets.classification,
    },
  }));

  const metadataResult = listMetadataAssets({
    q: trimmedQuery,
    type: typeFilter,
    page: 1,
    packId,
  });

  const metadataRows: CatalogApiRow[] = metadataResult.data.map((asset) => ({
    id: asset.id,
    name: asset.name,
    description: asset.description,
    itemType: asset.assetType,
    source: "metadata",
    detailHref: `/metadata/${asset.id}?pack=${encodeURIComponent(packId)}`,
  }));

  // When industry/commerce facets are active, prefer knowledge + matching metadata only.
  const catalogRows =
    material || standard || productType || auctionEligible
      ? []
      : filterPlaceholderRows(trimmedQuery, typeFilter);
  const combined = [...knowledgeRows, ...metadataRows, ...catalogRows];
  const { results, pagination } = paginateRows(combined, page);
  const phase =
    knowledgeRows.length > 0 || metadataRows.length > 0
      ? "hybrid"
      : "placeholder";

  return {
    phase,
    query: trimmedQuery,
    intent: params.intent,
    activeType: typeFilter,
    activeMaterial: material,
    activeStandard: standard,
    activeProductType: productType,
    activeAuctionEligible: auctionEligible,
    facetWarning: params.facetWarning,
    industryFacets: {
      materials: knowledgeResult.facets.materials,
      standards: knowledgeResult.facets.standards,
      productTypes: knowledgeResult.facets.productTypes,
      auctionEligible: knowledgeResult.facets.auctionEligible,
    },
    filters: BASE_FILTERS,
    results,
    pagination,
    sourceCounts: {
      metadata: metadataRows.length,
      catalog: catalogRows.length,
      knowledge: knowledgeRows.length,
    },
  };
}
