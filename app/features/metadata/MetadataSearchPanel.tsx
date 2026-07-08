import { Form, Link } from "@remix-run/react";

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
import { API_CONTEXT_PACK_SELECT } from "~/shared/api/paths";
import type {
  ContextPackManifestContract,
  MetadataAssetSummaryContract,
} from "~/shared/contracts";

export type MetadataSearchViewModel = {
  query: string;
  activeType?: string;
  activePackId: string;
  packs: ContextPackManifestContract[];
  results: MetadataAssetSummaryContract[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type MetadataSearchPanelProps = {
  model: MetadataSearchViewModel;
};

function buildSearchUrl(
  base: { q: string; type?: string; pack: string },
  page: number
): string {
  const sp = new URLSearchParams();
  if (base.q) sp.set("q", base.q);
  if (base.type) sp.set("type", base.type);
  if (base.pack) sp.set("pack", base.pack);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `/metadata?${qs}` : "/metadata";
}

const TYPE_OPTIONS = ["Database", "Table", "API", "Dashboard"] as const;

export function MetadataSearchPanel({ model }: MetadataSearchPanelProps) {
  const { pagination } = model;
  const base = {
    q: model.query,
    type: model.activeType,
    pack: model.activePackId,
  };
  const redirectTo = buildSearchUrl(base, pagination.page);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-full text-xs">
            Context catalog
          </Badge>
          <Badge variant="secondary" className="rounded-full text-xs">
            Context pack
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Metadata catalog</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Domain-neutral context infrastructure with swappable packs,
          policy-driven access, GenUI lineage, and MCP tools.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Context pack</CardTitle>
          <CardDescription>
            Switch between enterprise MAU and vertical supply-chain fixtures.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form
            method="post"
            action={API_CONTEXT_PACK_SELECT}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <label className="flex flex-1 flex-col gap-1 text-sm">
              <span className="font-medium text-foreground">Active pack</span>
              <select
                name="packId"
                defaultValue={model.activePackId}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                aria-label="Context pack"
              >
                {model.packs.map((pack) => (
                  <option key={pack.id} value={pack.id}>
                    {pack.name}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit">Apply pack</Button>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search</CardTitle>
          <CardDescription>
            Filter by name, FQN, tags, or description.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form method="get" className="flex flex-col gap-3 sm:flex-row">
            <input type="hidden" name="pack" value={model.activePackId} />
            {model.activeType ? (
              <input type="hidden" name="type" value={model.activeType} />
            ) : null}
            <Input
              name="q"
              defaultValue={model.query}
              placeholder="Search metadata…"
              aria-label="Metadata search query"
              className="flex-1"
            />
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Type</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1">
          <Link
            to={buildSearchUrl({ q: model.query, pack: model.activePackId }, 1)}
            className={`inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium ${
              !model.activeType
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted"
            }`}
          >
            All
          </Link>
          {TYPE_OPTIONS.map((opt) => (
            <Link
              key={opt}
              to={buildSearchUrl(
                { q: model.query, type: opt, pack: model.activePackId },
                1
              )}
              className={`inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium ${
                model.activeType === opt
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted"
              }`}
            >
              {opt}
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Results</CardTitle>
          <CardDescription>
            {pagination.total} asset(s)
            {pagination.totalPages > 1
              ? ` · page ${pagination.page}/${pagination.totalPages}`
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="grid grid-cols-[1fr_1fr_2fr_auto] bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
              <span>Name</span>
              <span>Owner</span>
              <span>Description</span>
              <span className="text-right">Type</span>
            </div>
            <div className="divide-y divide-border text-sm">
              {model.results.length === 0 ? (
                <p className="px-4 py-6 text-muted-foreground">
                  No assets match.
                </p>
              ) : (
                model.results.map((row) => (
                  <Link
                    key={row.id}
                    to={`/metadata/${row.id}?pack=${encodeURIComponent(model.activePackId)}`}
                    className="hover:bg-muted/50 grid grid-cols-[1fr_1fr_2fr_auto] items-center gap-2 px-4 py-3"
                  >
                    <span className="font-medium text-primary">{row.name}</span>
                    <span className="text-muted-foreground">{row.owner}</span>
                    <span className="text-muted-foreground">
                      {row.description}
                    </span>
                    <Badge
                      variant="secondary"
                      className="justify-self-end rounded-full text-xs"
                    >
                      {row.assetType}
                    </Badge>
                  </Link>
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
                  to={buildSearchUrl(base, pagination.page - 1)}
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
                  to={buildSearchUrl(base, pagination.page + 1)}
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
