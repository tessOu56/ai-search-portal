import type { CatalogApiRow } from "./catalog-search.types";

/**
 * T-2026-017 — 10k-row deterministic fixture for the virtualized dictionary.
 *
 * Generated in-process (no I/O, no randomness) so E2E/unit tests and perf
 * measurements are reproducible. Same row shape as the paginated catalog
 * (CatalogApiRow) so the URL contract (?q= ?type=) keeps its semantics.
 */
export const DICTIONARY_TOTAL = 10_000;

const DOMAINS = [
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

const VERBS = [
  "list",
  "get",
  "search",
  "export",
  "aggregate",
  "validate",
  "sync",
  "archive",
] as const;

export type DictionaryModel = {
  phase: "placeholder";
  query: string;
  activeType?: string;
  total: number;
  totalUnfiltered: number;
  results: CatalogApiRow[];
  virtual: boolean;
};

function buildRow(i: number): CatalogApiRow {
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
    source: "catalog",
  };
}

let cache: CatalogApiRow[] | null = null;

export function getDictionaryRows(): CatalogApiRow[] {
  if (!cache) {
    cache = Array.from({ length: DICTIONARY_TOTAL }, (_, i) => buildRow(i));
  }
  return cache;
}

export function getDictionaryModel(
  query: string,
  options: { type?: string; virtual?: boolean } = {}
): DictionaryModel {
  const q = query.trim().toLowerCase();
  const all = getDictionaryRows();

  let rows = all;
  if (q) {
    rows = rows.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.description.toLowerCase().includes(q)
    );
  }
  if (options.type) {
    rows = rows.filter((row) => row.itemType === options.type);
  }

  return {
    phase: "placeholder",
    query,
    activeType: options.type,
    total: rows.length,
    totalUnfiltered: all.length,
    results: rows,
    virtual: options.virtual ?? true,
  };
}
