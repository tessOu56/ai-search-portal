import type { CatalogApiRow } from "./catalog-search.types";

/**
 * Shared deterministic fixture for catalog dictionary (T-2026-017 / T-064).
 * Used by server (naive baseline) and Web Worker (100k virtual path).
 */
export const DICTIONARY_TOTAL = 100_000;

/** Naive DOM baseline stays at 10k — rendering 100k nodes is not a fair comparison. */
export const NAIVE_BASELINE_TOTAL = 10_000;

export const DOMAINS = [
  "orders",
  "customers",
  "billing",
  "inventory",
  "shipping",
  "analytics",
  "auth",
  "catalog",
  "search",
  "audit",
] as const;

export const VERBS = [
  "list",
  "get",
  "search",
  "export",
  "aggregate",
  "validate",
  "sync",
  "archive",
] as const;

export function buildDictionaryRow(i: number): CatalogApiRow {
  const domain = DOMAINS[i % DOMAINS.length];
  const verb = VERBS[i % VERBS.length];
  const itemType = i % 3 === 0 ? "Dataset" : "API";
  return {
    id: `dict-${i}`,
    name:
      itemType === "API"
        ? `${domain}/${verb}-${i}`
        : `${domain}_${verb}_v${i % 7}`,
    description: `Mock ${itemType.toLowerCase()} #${i} for the ${domain} domain (${verb}).`,
    itemType,
  };
}

export function generateDictionaryRows(count: number): CatalogApiRow[] {
  return Array.from({ length: count }, (_, i) => buildDictionaryRow(i));
}

export function filterDictionaryRows(
  rows: CatalogApiRow[],
  query: string,
  type?: string
): CatalogApiRow[] {
  const q = query.trim().toLowerCase();
  let filtered = rows;
  if (q) {
    filtered = filtered.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.description.toLowerCase().includes(q)
    );
  }
  if (type) {
    filtered = filtered.filter((row) => row.itemType === type);
  }
  return filtered;
}
