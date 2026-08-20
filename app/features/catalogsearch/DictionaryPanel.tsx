import { Link } from "@remix-run/react";

import { ProductPageHeader } from "~/components/shared/product/ProductPageShell";
import { Button } from "~/components/ui/Button";
import { EmptyState } from "~/components/ui/EmptyState";
import { Input } from "~/components/ui/Input";
import { Stack } from "~/components/ui/Stack";
import { StatusChip } from "~/components/ui/StatusChip";
import { Toolbar } from "~/components/ui/Toolbar";
import { VirtualList } from "~/components/ui/VirtualList";
import { PRODUCT_TABLE_LINK_CLASS } from "~/lib/experience-nav";
import { useI18n } from "~/shared/i18n/context";

import type { CatalogApiRow } from "./catalog-search.types";
import { buildCatalogSearchUrl } from "./catalog-search-url";
import type { DictionaryModel } from "./dictionary.server";

const BASE_PATH = "/catalog-search/dictionary";
const ROW_HEIGHT = 44;
const LIST_HEIGHT = 560;
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
 * `?virtual=off` renders the naive full list so before/after can be measured.
 */
export function DictionaryPanel({ model }: DictionaryPanelProps) {
  const { t } = useI18n();

  return (
    <Stack gap="lg">
      <ProductPageHeader
        title={t("nav.catalog-dictionary")}
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
              className={PRODUCT_TABLE_LINK_CLASS}
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

      <Toolbar className="flex-col items-stretch gap-3 sm:items-stretch">
        <form method="get" className="flex w-full flex-col gap-3 sm:flex-row">
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
                to={buildCatalogSearchUrl({ q: model.query, type }, BASE_PATH)}
              >
                {type}
              </Link>
            </Button>
          ))}
        </div>
      </Toolbar>

      <section className="space-y-3" aria-label="Dictionary results">
        <p
          className="text-type-14 text-muted-foreground"
          data-testid="dictionary-count"
        >
          {model.total.toLocaleString()} row(s)
          {model.query ? ` matching “${model.query}”` : ""}
          {model.activeType ? ` · type=${model.activeType}` : ""}
        </p>
        {model.total === 0 ? (
          <EmptyState title="No rows match your query." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="grid grid-cols-[1fr_2fr_auto] border-b border-border bg-card px-4 py-3 text-xs font-medium tracking-wide text-muted-foreground">
              <span>Name</span>
              <span>Description</span>
              <span className="text-right">Type</span>
            </div>
            {model.virtual ? (
              <VirtualList
                items={model.results}
                height={LIST_HEIGHT}
                estimateSize={ROW_HEIGHT}
                overscan={10}
                getItemKey={(row) => row.id}
                renderItem={(row) => <Row row={row} />}
                data-testid="virtual-scroll"
              />
            ) : (
              <div
                data-testid="naive-scroll"
                className="overflow-y-auto"
                style={{ height: LIST_HEIGHT }}
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
      </section>
    </Stack>
  );
}
