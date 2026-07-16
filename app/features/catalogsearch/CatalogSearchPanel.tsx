import { Link, useNavigation } from "@remix-run/react";

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

import type { CatalogSearchViewModel } from "./catalog-search.types";
import { buildCatalogSearchUrl } from "./catalog-search-url";

export type CatalogSearchPanelProps = {
  model: CatalogSearchViewModel;
};

export function CatalogSearchPanel({ model }: CatalogSearchPanelProps) {
  const { pagination } = model;
  const base = { q: model.query, type: model.activeType };
  const navigation = useNavigation();
  const isLoading =
    navigation.state === "loading" &&
    navigation.location?.pathname === "/catalog-search";

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-full text-xs">
            W3 shell
          </Badge>
          <Badge variant="secondary" className="rounded-full text-xs">
            {model.phase}
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Catalog search</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Mock-first catalog UI (fixtures + GAP). Type filter and pagination
          work on placeholder data — no Vercel or catalog API required.{" "}
          <Link
            to="/catalog-search/dictionary"
            className="text-primary hover:underline"
          >
            100k dictionary (virtualized) →
          </Link>
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search</CardTitle>
          <CardDescription>
            GET form — filters preserved in URL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form method="get" className="flex flex-col gap-3 sm:flex-row">
            {model.activeType ? (
              <input type="hidden" name="type" value={model.activeType} />
            ) : null}
            <Input
              name="q"
              defaultValue={model.query}
              placeholder="Filter mock APIs…"
              aria-label="Catalog search query"
              className="flex-1"
            />
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            Type filter active via URL <code className="text-xs">?type=</code>.
            Access filters deferred (GAP).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Type
            </span>
            <div className="flex flex-wrap gap-1">
              <Link
                to={buildCatalogSearchUrl({ q: model.query })}
                className={`inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium ${
                  !model.activeType
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                All
              </Link>
              {model.filters[0]?.options.map((opt) => (
                <Link
                  key={opt.value}
                  to={buildCatalogSearchUrl({
                    q: model.query,
                    type: opt.value,
                  })}
                  className={`inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium ${
                    model.activeType === opt.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>
          {model.filters.slice(1).map((filter) => (
            <fieldset key={filter.id} className="space-y-1">
              <legend className="text-xs font-medium text-muted-foreground">
                {filter.label}
              </legend>
              <div className="flex flex-wrap gap-1">
                {filter.options.map((opt) => (
                  <Button
                    key={`${filter.id}-${opt.value}`}
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled
                    className="rounded-full"
                    title="Access filter — post-MVP"
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </fieldset>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Results</CardTitle>
          <CardDescription>
            {pagination.total} row(s)
            {model.query ? ` matching “${model.query}”` : ""}
            {model.activeType ? ` · type=${model.activeType}` : ""}
            {pagination.totalPages > 1
              ? ` · page ${pagination.page}/${pagination.totalPages}`
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="grid grid-cols-[1fr_2fr_auto] bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
              <span>Name</span>
              <span>Description</span>
              <span className="text-right">Type</span>
            </div>
            <div className="divide-y divide-border text-sm">
              {isLoading ? (
                <div
                  aria-label="Loading results"
                  role="status"
                  className="space-y-0"
                >
                  {[0, 1].map((i) => (
                    <div
                      key={i}
                      className="grid animate-pulse grid-cols-[1fr_2fr_auto] items-center gap-2 px-4 py-3"
                    >
                      <span className="h-4 rounded bg-muted" />
                      <span className="h-4 rounded bg-muted" />
                      <span className="h-6 w-16 justify-self-end rounded-full bg-muted" />
                    </div>
                  ))}
                </div>
              ) : model.results.length === 0 ? (
                <p className="px-4 py-6 text-muted-foreground">
                  No mock rows match your query.
                </p>
              ) : (
                model.results.map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-[1fr_2fr_auto] items-center gap-2 px-4 py-3"
                  >
                    <span className="font-medium text-foreground">
                      {row.name}
                    </span>
                    <span className="text-muted-foreground">
                      {row.description}
                    </span>
                    <Badge
                      variant="secondary"
                      className="justify-self-end rounded-full text-xs"
                    >
                      {row.itemType}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
          {pagination.totalPages > 1 ? (
            <nav
              className="flex items-center justify-between gap-2"
              aria-label="Results pagination"
            >
              {pagination.page > 1 ? (
                <Link
                  to={buildCatalogSearchUrl({
                    ...base,
                    page: pagination.page - 1,
                  })}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Previous
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground">Previous</span>
              )}
              <span className="text-xs text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              {pagination.page < pagination.totalPages ? (
                <Link
                  to={buildCatalogSearchUrl({
                    ...base,
                    page: pagination.page + 1,
                  })}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Next
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground">Next</span>
              )}
            </nav>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
