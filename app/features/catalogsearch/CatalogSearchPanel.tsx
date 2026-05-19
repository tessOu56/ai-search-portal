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

export type CatalogSearchPanelProps = {
  model: CatalogSearchViewModel;
};

export function CatalogSearchPanel({ model }: CatalogSearchPanelProps) {
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
          Placeholder for Downloads API Explorer flows. Toolbar, filters, and
          results table will align with{" "}
          <code className="text-xs">labs/design-vibe/GAP-REPORT.md</code> after
          Figma MCP / able_portal port.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search</CardTitle>
          <CardDescription>
            GET form only — no backend wiring in this shell.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form method="get" className="flex flex-col gap-3 sm:flex-row">
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
            Disabled until catalog API integration.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {model.filters.map((filter) => (
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
            {model.results.length} row(s)
            {model.query ? ` matching “${model.query}”` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="grid grid-cols-[1fr_2fr_auto] bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
              <span>Name</span>
              <span>Description</span>
              <span className="text-right">Type</span>
            </div>
            <div className="divide-y divide-border text-sm">
              {model.results.length === 0 ? (
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
        </CardContent>
      </Card>
    </div>
  );
}
