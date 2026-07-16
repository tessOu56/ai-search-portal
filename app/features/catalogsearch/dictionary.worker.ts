import type { CatalogApiRow } from "./catalog-search.types";
import {
  DICTIONARY_TOTAL,
  filterDictionaryRows,
  generateDictionaryRows,
} from "./dictionary.fixture";

export type DictionaryWorkerRequest =
  | { type: "init" }
  | { type: "filter"; query: string; itemType?: string }
  | { type: "getRows"; start: number; count: number };

export type DictionaryWorkerResponse =
  | { type: "ready"; totalUnfiltered: number; initMs: number }
  | { type: "filtered"; total: number; filterMs: number }
  | { type: "rows"; rows: CatalogApiRow[] }
  | { type: "error"; message: string };

let allRows: CatalogApiRow[] | null = null;
let filtered: CatalogApiRow[] = [];

self.onmessage = (event: MessageEvent<DictionaryWorkerRequest>) => {
  const msg = event.data;
  try {
    if (msg.type === "init") {
      const t0 = performance.now();
      allRows = generateDictionaryRows(DICTIONARY_TOTAL);
      filtered = allRows;
      const initMs = performance.now() - t0;
      const response: DictionaryWorkerResponse = {
        type: "ready",
        totalUnfiltered: DICTIONARY_TOTAL,
        initMs,
      };
      self.postMessage(response);
      return;
    }

    if (!allRows) {
      self.postMessage({
        type: "error",
        message: "Worker not initialized",
      } satisfies DictionaryWorkerResponse);
      return;
    }

    if (msg.type === "filter") {
      const t0 = performance.now();
      filtered = filterDictionaryRows(allRows, msg.query, msg.itemType);
      const filterMs = performance.now() - t0;
      const response: DictionaryWorkerResponse = {
        type: "filtered",
        total: filtered.length,
        filterMs,
      };
      self.postMessage(response);
      return;
    }

    if (msg.type === "getRows") {
      const slice = filtered.slice(msg.start, msg.start + msg.count);
      const response: DictionaryWorkerResponse = {
        type: "rows",
        rows: slice,
      };
      self.postMessage(response);
      return;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    self.postMessage({
      type: "error",
      message,
    } satisfies DictionaryWorkerResponse);
  }
};
