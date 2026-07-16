import { useEffect, useRef, useState } from "react";

import type { CatalogApiRow } from "./catalog-search.types";
import { DICTIONARY_TOTAL } from "./dictionary.fixture";
import type {
  DictionaryWorkerRequest,
  DictionaryWorkerResponse,
} from "./dictionary.worker";

export type DictionaryWorkerMetrics = {
  initMs: number | null;
  filterMs: number | null;
  longTasksOver50Ms: number;
};

export type DictionaryWorkerState = {
  status: "loading" | "ready" | "error";
  totalUnfiltered: number;
  total: number;
  metrics: DictionaryWorkerMetrics;
  error: string | null;
};

const INITIAL: DictionaryWorkerState = {
  status: "loading",
  totalUnfiltered: DICTIONARY_TOTAL,
  total: 0,
  metrics: { initMs: null, filterMs: null, longTasksOver50Ms: 0 },
  error: null,
};

export function useDictionaryWorker(query: string, itemType?: string) {
  const workerRef = useRef<Worker | null>(null);
  const rowCacheRef = useRef<Map<number, CatalogApiRow>>(new Map());
  const [state, setState] = useState<DictionaryWorkerState>(INITIAL);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const worker = new Worker(
      new URL("./dictionary.worker.ts", import.meta.url),
      { type: "module" }
    );
    workerRef.current = worker;

    const onMessage = (event: MessageEvent<DictionaryWorkerResponse>) => {
      const data = event.data;
      if (data.type === "ready") {
        setState((s) => ({
          ...s,
          status: "ready",
          totalUnfiltered: data.totalUnfiltered,
          total: data.totalUnfiltered,
          metrics: { ...s.metrics, initMs: data.initMs },
        }));
        worker.postMessage({
          type: "filter",
          query,
          itemType,
        } satisfies DictionaryWorkerRequest);
      } else if (data.type === "filtered") {
        rowCacheRef.current.clear();
        setState((s) => ({
          ...s,
          status: "ready",
          total: data.total,
          metrics: { ...s.metrics, filterMs: data.filterMs },
        }));
        setVersion((v) => v + 1);
      } else if (data.type === "error") {
        setState((s) => ({ ...s, status: "error", error: data.message }));
      }
    };

    worker.addEventListener("message", onMessage);
    worker.postMessage({ type: "init" } satisfies DictionaryWorkerRequest);

    return () => {
      worker.removeEventListener("message", onMessage);
      worker.terminate();
      workerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- worker lifetime
  }, []);

  useEffect(() => {
    const worker = workerRef.current;
    if (!worker || state.status === "error") return;
    rowCacheRef.current.clear();
    worker.postMessage({
      type: "filter",
      query,
      itemType,
    } satisfies DictionaryWorkerRequest);
  }, [query, itemType, state.status]);

  const ensureRows = async (start: number, count: number) => {
    const worker = workerRef.current;
    if (!worker || count <= 0) return;

    const missing: number[] = [];
    for (let i = start; i < start + count; i++) {
      if (!rowCacheRef.current.has(i)) missing.push(i);
    }
    if (missing.length === 0) return;

    const rows = await new Promise<CatalogApiRow[]>((resolve, reject) => {
      const handler = (event: MessageEvent<DictionaryWorkerResponse>) => {
        const data = event.data;
        if (data.type === "rows") {
          worker.removeEventListener("message", handler);
          resolve(data.rows);
        } else if (data.type === "error") {
          worker.removeEventListener("message", handler);
          reject(new Error(data.message));
        }
      };
      worker.addEventListener("message", handler);
      worker.postMessage({
        type: "getRows",
        start,
        count,
      } satisfies DictionaryWorkerRequest);
    });

    for (let i = 0; i < rows.length; i++) {
      rowCacheRef.current.set(start + i, rows[i]);
    }
    setVersion((v) => v + 1);
  };

  const getRow = (index: number): CatalogApiRow | undefined =>
    rowCacheRef.current.get(index);

  return { state, ensureRows, getRow, version };
}
