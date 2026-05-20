import type { CatalogSearchViewModel } from "./catalog-search.types";

const PAGE_SIZE = 2;

const PLACEHOLDER_RESULTS: CatalogSearchViewModel["results"] = [
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
};

/** Server-only placeholder data until able_portal adapters land. */
export function getCatalogSearchPlaceholder(
  query: string,
  params: CatalogSearchParams = {}
): CatalogSearchViewModel {
  const q = query.trim().toLowerCase();
  const typeFilter = params.type?.trim();
  const page = Math.max(1, params.page ?? 1);

  let rows = PLACEHOLDER_RESULTS;
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

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const results = rows.slice(start, start + PAGE_SIZE);

  return {
    phase: "placeholder",
    query: query.trim(),
    activeType: typeFilter,
    filters: [
      {
        id: "filter_type",
        label: "Type",
        options: [
          { value: "API", label: "API" },
          { value: "Dataset", label: "Dataset" },
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
    ],
    results,
    pagination: {
      page: safePage,
      pageSize: PAGE_SIZE,
      total,
      totalPages,
    },
  };
}
