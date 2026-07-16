import type { CatalogApiRow } from "./catalog-search.types";
import {
  DICTIONARY_TOTAL,
  filterDictionaryRows,
  generateDictionaryRows,
  NAIVE_BASELINE_TOTAL,
} from "./dictionary.fixture";

/**
 * T-2026-017 / T-064 — dictionary fixture for naive baseline (server) and
 * 100k virtual path (Web Worker on client).
 */
export { DICTIONARY_TOTAL, NAIVE_BASELINE_TOTAL } from "./dictionary.fixture";

export type DictionaryModel = {
  phase: "placeholder";
  query: string;
  activeType?: string;
  total: number;
  totalUnfiltered: number;
  results: CatalogApiRow[];
  virtual: boolean;
  /** When true, client Web Worker owns the 100k dataset (no SSR rows). */
  workerMode?: boolean;
};

let naiveCache: CatalogApiRow[] | null = null;

export function getNaiveBaselineRows(): CatalogApiRow[] {
  if (!naiveCache) {
    naiveCache = generateDictionaryRows(NAIVE_BASELINE_TOTAL);
  }
  return naiveCache;
}

export function getDictionaryModel(
  query: string,
  options: { type?: string; virtual?: boolean } = {}
): DictionaryModel {
  const virtual = options.virtual ?? true;

  if (virtual) {
    return {
      phase: "placeholder",
      query,
      activeType: options.type,
      total: 0,
      totalUnfiltered: DICTIONARY_TOTAL,
      results: [],
      virtual: true,
      workerMode: true,
    };
  }

  const all = getNaiveBaselineRows();
  const rows = filterDictionaryRows(all, query, options.type);

  return {
    phase: "placeholder",
    query,
    activeType: options.type,
    total: rows.length,
    totalUnfiltered: NAIVE_BASELINE_TOTAL,
    results: rows,
    virtual: false,
    workerMode: false,
  };
}

/** @deprecated Use getNaiveBaselineRows — kept for tests migrating from 10k API */
export function getDictionaryRows(): CatalogApiRow[] {
  return getNaiveBaselineRows();
}
