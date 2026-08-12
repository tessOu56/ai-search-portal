import {
  INDUSTRY_STANDARD_REGISTRY,
  listIndustryStandards,
} from "@ai-search-portal/contracts";
import { Link, useNavigation } from "@remix-run/react";

import { ProductResultsShell } from "~/components/shared/product/ProductResultsShell";
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
import { buildMetadataSearchUrl } from "~/shared/navigation";

import type { CatalogSearchViewModel } from "./catalog-search.types";
import { buildCatalogSearchUrl } from "./catalog-search-url";

export type CatalogSearchPanelProps = {
  model: CatalogSearchViewModel;
};

const MATERIAL_OPTIONS = [
  { value: "sterling_silver", label: "Sterling" },
  { value: "fine_silver", label: "Fine silver" },
  { value: "gold", label: "Gold" },
  { value: "copper", label: "Copper" },
  { value: "bronze", label: "Bronze" },
] as const;

const PRODUCT_TYPE_OPTIONS = [
  { value: "experience", label: "Experience" },
  { value: "physical", label: "Physical" },
  { value: "material", label: "Material" },
  { value: "tool", label: "Tool" },
  { value: "venue_rental", label: "Venue" },
] as const;

const STANDARD_CHIP_CODES = listIndustryStandards()
  .filter((e) => ["925", "999", "14K", "18K", "950"].includes(e.code))
  .map((e) => e.code);

function buildResultsDescription(model: CatalogSearchViewModel): string {
  const { pagination } = model;
  const parts = [`${pagination.total} row(s)`];
  if (model.query) parts.push(`matching “${model.query}”`);
  if (model.activeType) parts.push(`type=${model.activeType}`);
  if (model.activeMaterial) parts.push(`material=${model.activeMaterial}`);
  if (model.activeStandard) parts.push(`standard=${model.activeStandard}`);
  if (model.activeProductType)
    parts.push(`productType=${model.activeProductType}`);
  if (model.activeAuctionEligible) parts.push("auctionEligible");
  if (model.sourceCounts && model.phase === "hybrid") {
    parts.push(
      `${model.sourceCounts.knowledge} knowledge · ${model.sourceCounts.metadata} metadata · ${model.sourceCounts.catalog} catalog`
    );
  }
  if (pagination.totalPages > 1) {
    parts.push(`page ${pagination.page}/${pagination.totalPages}`);
  }
  return parts.join(" · ");
}

function facetChipClass(active: boolean): string {
  return `inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium ${
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-background hover:bg-muted"
  }`;
}

export function CatalogSearchPanel({ model }: CatalogSearchPanelProps) {
  const { pagination } = model;
  const base = {
    q: model.query,
    type: model.activeType,
    intent: model.intent,
    material: model.activeMaterial,
    standard: model.activeStandard,
    productType: model.activeProductType,
    auctionEligible: model.activeAuctionEligible,
  };
  const navigation = useNavigation();
  const isLoading =
    navigation.state === "loading" &&
    navigation.location?.pathname === "/catalog-search";

  const standardLabels = Object.fromEntries(
    INDUSTRY_STANDARD_REGISTRY.map((e) => [e.code, e.labelZhTw])
  );

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-full text-xs">
            W3 shell
          </Badge>
          <Badge variant="secondary" className="rounded-full text-xs">
            {model.phase}
          </Badge>
          {model.intent === "ai-fallback" ? (
            <Badge
              variant="outline"
              className="rounded-full border-amber-300/60 bg-amber-50/60 text-xs text-amber-900"
            >
              AI fallback
            </Badge>
          ) : null}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Catalog search</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {model.phase === "hybrid"
            ? "Domain knowledge (facet-filtered) and metadata assets appear first; assets are not filtered by hallmark."
            : "Mock-first catalog UI (fixtures + GAP). Type filter and pagination work on placeholder data."}{" "}
          <Link
            to="/catalog-search/dictionary"
            className="text-primary hover:underline"
          >
            10k dictionary (virtualized) →
          </Link>
        </p>
        {model.facetWarning ? (
          <p
            role="status"
            className="rounded-md border border-amber-300/60 bg-amber-50/80 px-3 py-2 text-sm text-amber-950"
          >
            {model.facetWarning}
          </p>
        ) : null}
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
            {model.intent ? (
              <input type="hidden" name="intent" value={model.intent} />
            ) : null}
            {model.activeType ? (
              <input type="hidden" name="type" value={model.activeType} />
            ) : null}
            {model.activeMaterial ? (
              <input
                type="hidden"
                name="material"
                value={model.activeMaterial}
              />
            ) : null}
            {model.activeStandard ? (
              <input
                type="hidden"
                name="standard"
                value={model.activeStandard}
              />
            ) : null}
            {model.activeProductType ? (
              <input
                type="hidden"
                name="productType"
                value={model.activeProductType}
              />
            ) : null}
            {model.activeAuctionEligible ? (
              <input type="hidden" name="auctionEligible" value="true" />
            ) : null}
            <Input
              name="q"
              defaultValue={model.query}
              placeholder="Filter APIs, tables, 925, 鍛造…"
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
            Type + industry / commerce facets via URL (
            <code className="text-xs">?material=</code> /{" "}
            <code className="text-xs">?standard=</code> /{" "}
            <code className="text-xs">?productType=</code> /{" "}
            <code className="text-xs">?auctionEligible=</code>).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Type
            </span>
            <div className="flex flex-wrap gap-1">
              <Link
                to={buildCatalogSearchUrl({
                  ...base,
                  type: undefined,
                })}
                className={facetChipClass(!model.activeType)}
              >
                All
              </Link>
              {model.filters[0]?.options.map((opt) => (
                <Link
                  key={opt.value}
                  to={buildCatalogSearchUrl({
                    ...base,
                    type: opt.value,
                  })}
                  className={facetChipClass(model.activeType === opt.value)}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Material
            </span>
            <div className="flex flex-wrap gap-1">
              <Link
                to={buildCatalogSearchUrl({
                  ...base,
                  material: undefined,
                })}
                className={facetChipClass(!model.activeMaterial)}
              >
                All
              </Link>
              {MATERIAL_OPTIONS.map((opt) => (
                <Link
                  key={opt.value}
                  to={buildCatalogSearchUrl({
                    ...base,
                    material: opt.value,
                  })}
                  className={facetChipClass(model.activeMaterial === opt.value)}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Industry code
            </span>
            <div className="flex flex-wrap gap-1">
              <Link
                to={buildCatalogSearchUrl({
                  ...base,
                  standard: undefined,
                })}
                className={facetChipClass(!model.activeStandard)}
              >
                All
              </Link>
              {STANDARD_CHIP_CODES.map((code) => (
                <Link
                  key={code}
                  to={buildCatalogSearchUrl({
                    ...base,
                    standard: code,
                  })}
                  className={facetChipClass(model.activeStandard === code)}
                  title={standardLabels[code] ?? code}
                >
                  {code}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Product type
            </span>
            <div className="flex flex-wrap gap-1">
              <Link
                to={buildCatalogSearchUrl({
                  ...base,
                  productType: undefined,
                })}
                className={facetChipClass(!model.activeProductType)}
              >
                All
              </Link>
              {PRODUCT_TYPE_OPTIONS.map((opt) => (
                <Link
                  key={opt.value}
                  to={buildCatalogSearchUrl({
                    ...base,
                    productType: opt.value,
                  })}
                  className={facetChipClass(
                    model.activeProductType === opt.value
                  )}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Auction
            </span>
            <div className="flex flex-wrap gap-1">
              <Link
                to={buildCatalogSearchUrl({
                  ...base,
                  auctionEligible: undefined,
                })}
                className={facetChipClass(!model.activeAuctionEligible)}
              >
                All
              </Link>
              <Link
                to={buildCatalogSearchUrl({
                  ...base,
                  auctionEligible: true,
                })}
                className={facetChipClass(Boolean(model.activeAuctionEligible))}
              >
                Auction eligible
              </Link>
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

      {(model.sourceCounts?.knowledge ?? 0) > 0 ? (
        <Card data-testid="catalog-knowledge-section">
          <CardHeader>
            <CardTitle className="text-base">Domain knowledge</CardTitle>
            <CardDescription>
              Facet-filtered glossary / narrative / ops
              {model.activeStandard
                ? ` · standard=${model.activeStandard}`
                : ""}
              {model.activeMaterial
                ? ` · material=${model.activeMaterial}`
                : ""}
              {model.activeProductType
                ? ` · productType=${model.activeProductType}`
                : ""}
              {model.activeAuctionEligible ? " · auctionEligible" : ""}.
              Metadata assets below are not filtered by hallmark.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {model.results
              .filter((row) => row.source === "knowledge")
              .map((row) => (
                <div
                  key={`knowledge-${row.id}`}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-border px-3 py-2"
                >
                  <div className="min-w-0 space-y-1">
                    {row.detailHref ? (
                      <Link
                        to={row.detailHref}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {row.name}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium">{row.name}</p>
                    )}
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {row.description}
                    </p>
                    {row.facets &&
                    (row.facets.standards.length > 0 ||
                      row.facets.materials.length > 0) ? (
                      <div className="flex flex-wrap gap-1">
                        {row.facets.standards.map((code) => (
                          <Link
                            key={code}
                            to={buildCatalogSearchUrl({
                              ...base,
                              standard: code,
                              page: 1,
                            })}
                            className="inline-flex rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:border-primary hover:text-foreground"
                          >
                            {code}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-full text-xs capitalize"
                  >
                    {row.itemType}
                  </Badge>
                </div>
              ))}
          </CardContent>
        </Card>
      ) : null}

      <ProductResultsShell
        title={
          (model.sourceCounts?.knowledge ?? 0) > 0
            ? "Assets & catalog"
            : "Results"
        }
        description={
          (model.sourceCounts?.knowledge ?? 0) > 0
            ? `${buildResultsDescription(model)} · assets not filtered by hallmark`
            : buildResultsDescription(model)
        }
        isLoading={isLoading}
        isEmpty={
          model.results.filter((row) => row.source !== "knowledge").length === 0
        }
        skeletonGridClass="grid-cols-[1fr_2fr_auto_auto]"
        skeletonRows={3}
        emptyMessage="No asset or catalog rows match your query."
        emptyAction={
          <div className="flex flex-col items-center gap-2 sm:flex-row">
            {model.activeMaterial ||
            model.activeStandard ||
            model.activeProductType ||
            model.activeAuctionEligible ? (
              <Link
                to={buildCatalogSearchUrl({
                  q: model.query,
                  type: model.activeType,
                  intent: model.intent,
                })}
                className="text-sm font-medium text-primary hover:underline"
              >
                Clear industry filters
              </Link>
            ) : null}
            <Link
              to={buildMetadataSearchUrl({
                q: model.query,
                type: model.activeType,
                intent: model.intent,
                material: model.activeMaterial,
                standard: model.activeStandard,
                productType: model.activeProductType,
                auctionEligible: model.activeAuctionEligible,
              })}
              className="text-sm font-medium text-primary hover:underline"
            >
              Try metadata catalog →
            </Link>
          </div>
        }
        pagination={
          pagination.totalPages > 1 ? (
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
          ) : null
        }
      >
        <div className="grid grid-cols-[1fr_2fr_auto_auto] bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
          <span>Name</span>
          <span>Description</span>
          <span className="text-right">Source</span>
          <span className="text-right">Type</span>
        </div>
        <div className="divide-y divide-border text-sm">
          {model.results
            .filter((row) => row.source !== "knowledge")
            .map((row) => (
              <div
                key={`${row.source}-${row.id}`}
                className="grid grid-cols-[1fr_2fr_auto_auto] items-start gap-2 px-4 py-3"
              >
                <div className="space-y-1">
                  {row.detailHref ? (
                    <Link
                      to={row.detailHref}
                      className="font-medium text-primary hover:underline"
                    >
                      {row.name}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">
                      {row.name}
                    </span>
                  )}
                  {row.facets &&
                  (row.facets.standards.length > 0 ||
                    row.facets.materials.length > 0) ? (
                    <div className="flex flex-wrap gap-1">
                      {row.facets.standards.map((code) => (
                        <Link
                          key={code}
                          to={buildCatalogSearchUrl({
                            ...base,
                            standard: code,
                            page: 1,
                          })}
                          className="inline-flex rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:border-primary hover:text-foreground"
                        >
                          {code}
                        </Link>
                      ))}
                      {row.facets.materials.slice(0, 2).map((m) => (
                        <Link
                          key={m}
                          to={buildCatalogSearchUrl({
                            ...base,
                            material: m,
                            page: 1,
                          })}
                          className="border-border/60 inline-flex rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:border-primary hover:text-foreground"
                        >
                          {m.replace(/_/g, " ")}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
                <span className="line-clamp-2 text-muted-foreground">
                  {row.description}
                </span>
                <Badge
                  variant="outline"
                  className="justify-self-end rounded-full text-xs capitalize"
                >
                  {row.source}
                </Badge>
                <Badge
                  variant="secondary"
                  className="justify-self-end rounded-full text-xs"
                >
                  {row.itemType}
                </Badge>
              </div>
            ))}
        </div>
      </ProductResultsShell>
    </div>
  );
}
