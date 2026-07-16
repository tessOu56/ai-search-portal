import { Link } from "@remix-run/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef, useState } from "react";

import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/Card";
import { Input } from "~/components/ui/Input";

import type { CatalogApiRow } from "./catalog-search.types";
import { buildCatalogSearchUrl } from "./catalog-search-url";
import {
  DICTIONARY_TOTAL,
  type DictionaryModel,
  NAIVE_BASELINE_TOTAL,
} from "./dictionary.server";
import { startLongTaskObserver } from "./dictionary-long-task";
import { useDictionaryWorker } from "./useDictionaryWorker";

const BASE_PATH = "/catalog-search/dictionary";
const ROW_HEIGHT = 44;
const TYPES = ["API", "Dataset"];

export type DictionaryPanelProps = {
  model: DictionaryModel;
};

function toggleVirtualUrl(model: DictionaryModel): string {
  const sp = new URLSearchParams();
  if (model.query) sp.set("q", model.query);
  if (model.activeType) sp.set("type", model.activeType);
  if (model.virtual) sp.set("virtual", "off");
  const qs = sp.toString();
  return qs ? `${BASE_PATH}?${qs}` : BASE_PATH;
}

function Row({ row }: { row: CatalogApiRow }) {
  return (
    <div
      data-row
      className="grid h-full grid-cols-[1fr_2fr_auto] items-center gap-2 border-b border-border px-4 text-sm"
    >
      <span className="truncate font-medium text-foreground">{row.name}</span>
      <span className="truncate text-muted-foreground">{row.description}</span>
      <Badge
        variant="secondary"
        className="justify-self-end rounded-full text-xs"
      >
        {row.itemType}
      </Badge>
    </div>
  );
}

function PlaceholderRow() {
  return (
    <div
      className="grid h-full grid-cols-[1fr_2fr_auto] items-center gap-2 border-b border-border px-4 text-sm"
      aria-hidden
    >
      <span className="h-3 animate-pulse rounded bg-muted" />
      <span className="h-3 animate-pulse rounded bg-muted" />
      <span className="h-5 w-14 animate-pulse rounded-full bg-muted" />
    </div>
  );
}

function VirtualWorkerList({
  query,
  activeType,
}: {
  query: string;
  activeType?: string;
}) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const { state, ensureRows, getRow, version } = useDictionaryWorker(
    query,
    activeType
  );
  const [longTasks, setLongTasks] = useState(0);

  useEffect(() => {
    const stop = startLongTaskObserver((record) => {
      setLongTasks(record.countOver50Ms);
    });
    return () => {
      stop();
    };
  }, []);

  const virtualizer = useVirtualizer({
    count: state.total,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  const virtualItems = virtualizer.getVirtualItems();

  useEffect(() => {
    if (virtualItems.length === 0) return;
    const start = virtualItems[0].index;
    const end = virtualItems[virtualItems.length - 1].index;
    void ensureRows(start, end - start + 1);
  }, [virtualItems, ensureRows, version, state.total]);

  return (
    <>
      <p
        className="px-4 py-2 text-xs text-muted-foreground"
        data-testid="worker-metrics"
      >
        Worker: {state.status}
        {state.metrics.initMs != null
          ? ` · init ${state.metrics.initMs.toFixed(0)}ms`
          : ""}
        {state.metrics.filterMs != null
          ? ` · filter ${state.metrics.filterMs.toFixed(0)}ms`
          : ""}
        {longTasks > 0 ? ` · long tasks >50ms: ${longTasks}` : ""}
      </p>
      <div
        ref={parentRef}
        data-testid="virtual-scroll"
        className="h-[560px] overflow-y-auto"
      >
        <div
          style={{
            height: virtualizer.getTotalSize(),
            position: "relative",
          }}
        >
          {virtualItems.map((item) => {
            const row = getRow(item.index);
            return (
              <div
                key={item.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: item.size,
                  transform: `translateY(${item.start}px)`,
                }}
              >
                {row ? <Row row={row} /> : <PlaceholderRow />}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function NaiveList({ results }: { results: CatalogApiRow[] }) {
  return (
    <div data-testid="naive-scroll" className="h-[560px] overflow-y-auto">
      {results.map((row) => (
        <div key={row.id} style={{ height: ROW_HEIGHT }}>
          <Row row={row} />
        </div>
      ))}
    </div>
  );
}

/**
 * T-2026-017 / T-064 — virtualized dictionary (100k via Web Worker).
 */
export function DictionaryPanel({ model }: DictionaryPanelProps) {
  const workerMode = model.workerMode === true;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-full text-xs">
            T-2026-064
          </Badge>
          <Badge variant="secondary" className="rounded-full text-xs">
            {model.virtual
              ? `virtualized · ${DICTIONARY_TOTAL.toLocaleString()} rows (worker)`
              : `naive baseline · ${NAIVE_BASELINE_TOTAL.toLocaleString()} rows`}
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Catalog dictionary
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {workerMode
            ? `${DICTIONARY_TOTAL.toLocaleString()} mock rows parsed in a Web Worker; virtual scroll keeps the DOM small.`
            : `${NAIVE_BASELINE_TOTAL.toLocaleString()} row naive baseline for DOM comparison.`}{" "}
          Switch{" "}
          <Link
            to={toggleVirtualUrl(model)}
            className="text-primary hover:underline"
            data-testid="virtual-toggle"
          >
            {model.virtual ? "virtual=off" : "virtual=on"}
          </Link>{" "}
          (methodology: docs/perf/catalog-dictionary-virtualization.md).
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search</CardTitle>
          <CardDescription>
            Same URL contract as /catalog-search (`?q=` + `?type=`).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form method="get" className="flex flex-col gap-3 sm:flex-row">
            {model.activeType ? (
              <input type="hidden" name="type" value={model.activeType} />
            ) : null}
            {!model.virtual ? (
              <input type="hidden" name="virtual" value="off" />
            ) : null}
            <Input
              name="q"
              defaultValue={model.query}
              placeholder={
                workerMode
                  ? `Filter ${DICTIONARY_TOTAL.toLocaleString()} mock rows…`
                  : `Filter ${NAIVE_BASELINE_TOTAL.toLocaleString()} mock rows…`
              }
              aria-label="Dictionary search query"
              className="flex-1"
            />
            <Button type="submit">Search</Button>
          </form>
          <div className="flex flex-wrap gap-1">
            <Link
              to={buildCatalogSearchUrl({ q: model.query }, BASE_PATH)}
              className={`inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium ${
                !model.activeType
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted"
              }`}
            >
              All
            </Link>
            {TYPES.map((type) => (
              <Link
                key={type}
                to={buildCatalogSearchUrl({ q: model.query, type }, BASE_PATH)}
                className={`inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium ${
                  model.activeType === type
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                {type}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Results</CardTitle>
          <CardDescription data-testid="dictionary-count">
            {workerMode
              ? stateLabelWorker(model)
              : `${model.total.toLocaleString()} row(s)`}
            {model.query ? ` matching “${model.query}”` : ""}
            {model.activeType ? ` · type=${model.activeType}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="grid grid-cols-[1fr_2fr_auto] bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
              <span>Name</span>
              <span>Description</span>
              <span className="text-right">Type</span>
            </div>
            {workerMode ? (
              <VirtualWorkerList
                query={model.query}
                activeType={model.activeType}
              />
            ) : model.total === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                No mock rows match your query.
              </p>
            ) : (
              <NaiveList results={model.results} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function stateLabelWorker(model: DictionaryModel): string {
  return `${model.totalUnfiltered.toLocaleString()} row dataset (worker)`;
}
