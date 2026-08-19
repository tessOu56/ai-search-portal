import { Link } from "@remix-run/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";

import { ProductPageHeader } from "~/components/shared/product/ProductPageShell";
import { Button } from "~/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/Card";
import { EmptyState } from "~/components/ui/EmptyState";
import { Input } from "~/components/ui/Input";
import { Stack } from "~/components/ui/Stack";
import { StatusChip } from "~/components/ui/StatusChip";
import { useI18n } from "~/shared/i18n/context";

import type { CatalogApiRow } from "./catalog-search.types";
import { buildCatalogSearchUrl } from "./catalog-search-url";
import type { DictionaryModel } from "./dictionary.server";

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
      className="grid h-full grid-cols-[1fr_2fr_auto] items-center gap-2 border-b border-border bg-card px-4 text-sm"
    >
      <span className="truncate font-medium text-foreground">{row.name}</span>
      <span className="truncate text-muted-foreground">{row.description}</span>
      <StatusChip status="info" className="justify-self-end">
        {row.itemType}
      </StatusChip>
    </div>
  );
}

/**
 * Virtualized dictionary over a 10k-row fixture.
 *
 * `?virtual=off` renders the naive full list so before/after can be measured
 * on the same data and filters.
 * URL contract semantics (?q= ?type=) match /catalog-search; pagination is
 * replaced by virtual scrolling on this view only.
 */
export function DictionaryPanel({ model }: DictionaryPanelProps) {
  const { t } = useI18n();
  const parentRef = useRef<HTMLDivElement | null>(null);
  const virtualizer = useVirtualizer({
    count: model.results.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  return (
    <Stack gap="lg">
      <ProductPageHeader
        title="Catalog dictionary"
        extra={
          <StatusChip status={model.virtual ? "info" : "neutral"}>
            {model.virtual ? "Fast list" : "Full list"}
          </StatusChip>
        }
        description={
          <>
            Browse {model.totalUnfiltered.toLocaleString()} catalog entries.
            Virtual scrolling keeps the list fast.{" "}
            <Link
              to={toggleVirtualUrl(model)}
              className="text-primary hover:underline"
              data-testid="virtual-toggle"
            >
              {model.virtual
                ? "Compare with the full list"
                : "Back to the fast list"}
            </Link>
            .
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search</CardTitle>
          <CardDescription>
            Filter by name or type. The filtered set scrolls in one list.
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
              placeholder="Filter catalog entries…"
              aria-label="Dictionary search query"
              className="flex-1"
            />
            <Button type="submit">{t("catalog.search.submit")}</Button>
          </form>
          <div className="flex flex-wrap gap-1">
            <Button
              asChild
              size="sm"
              variant={!model.activeType ? "default" : "outline"}
            >
              <Link to={buildCatalogSearchUrl({ q: model.query }, BASE_PATH)}>
                All
              </Link>
            </Button>
            {TYPES.map((type) => (
              <Button
                asChild
                key={type}
                size="sm"
                variant={model.activeType === type ? "default" : "outline"}
              >
                <Link
                  to={buildCatalogSearchUrl(
                    { q: model.query, type },
                    BASE_PATH
                  )}
                >
                  {type}
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Results</CardTitle>
          <CardDescription data-testid="dictionary-count">
            {model.total.toLocaleString()} row(s)
            {model.query ? ` matching “${model.query}”` : ""}
            {model.activeType ? ` · type=${model.activeType}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {model.total === 0 ? (
            <EmptyState title="No rows match your query." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border">
              <div className="grid grid-cols-[1fr_2fr_auto] bg-muted px-4 py-3 text-sm font-medium text-muted-foreground">
                <span>Name</span>
                <span>Description</span>
                <span className="text-right">Type</span>
              </div>
              {model.virtual ? (
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
                    {virtualizer.getVirtualItems().map((item) => (
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
                        <Row row={model.results[item.index]} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  data-testid="naive-scroll"
                  className="h-[560px] overflow-y-auto"
                >
                  {model.results.map((row) => (
                    <div key={row.id} style={{ height: ROW_HEIGHT }}>
                      <Row row={row} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
