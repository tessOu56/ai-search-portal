import type { CatalogSearchViewModel } from "./catalog-search.types";

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
];

/** Server-only placeholder data until able_portal adapters land. */
export function getCatalogSearchPlaceholder(
  query: string
): CatalogSearchViewModel {
  const q = query.trim().toLowerCase();
  const results =
    q.length === 0
      ? PLACEHOLDER_RESULTS
      : PLACEHOLDER_RESULTS.filter(
          (row) =>
            row.name.toLowerCase().includes(q) ||
            row.description.toLowerCase().includes(q)
        );

  return {
    phase: "placeholder",
    query: query.trim(),
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
  };
}
