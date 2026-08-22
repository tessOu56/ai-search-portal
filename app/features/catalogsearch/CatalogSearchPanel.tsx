import {
  INDUSTRY_STANDARD_REGISTRY,
  listIndustryStandards,
} from "@ai-search-portal/contracts";
import { Link, useNavigation } from "@remix-run/react";
import type { ReactNode } from "react";

import { ProductPageHeader } from "~/components/shared/product/ProductPageShell";
import { ProductResultsShell } from "~/components/shared/product/ProductResultsShell";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Callout } from "~/components/ui/Callout";
import { DataTable } from "~/components/ui/DataTable";
import { Input } from "~/components/ui/Input";
import { Stack } from "~/components/ui/Stack";
import { StatusChip } from "~/components/ui/StatusChip";
import { Toolbar } from "~/components/ui/Toolbar";
import { PRODUCT_TABLE_LINK_CLASS } from "~/lib/experience-nav";
import { useI18n } from "~/shared/i18n/context";
import { buildMetadataSearchUrl } from "~/shared/navigation";

import type { CatalogSearchViewModel } from "./catalog-search.types";
import {
  buildCatalogSearchUrl,
  type CatalogSearchUrlParams,
} from "./catalog-search-url";

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

function FacetChip({
  to,
  active,
  children,
  title,
}: {
  to: string;
  active: boolean;
  children: ReactNode;
  title?: string;
}) {
  return (
    <Button asChild size="sm" variant={active ? "default" : "outline"}>
      <Link to={to} title={title}>
        {children}
      </Link>
    </Button>
  );
}

function CatalogFacetFilters({
  model,
  base,
  standardLabels,
}: {
  model: CatalogSearchViewModel;
  base: CatalogSearchUrlParams;
  standardLabels: Map<string, string>;
}) {
  return (
    <div className="space-y-stack-dense" aria-label="Filters">
      <h2 className="text-type-16 font-medium text-foreground">Filters</h2>
      <div className="flex flex-wrap gap-stack">
        <div className="space-y-space-4">
          <span className="text-xs font-medium text-muted-foreground">
            Type
          </span>
          <div className="flex flex-wrap gap-space-4">
            <FacetChip
              to={buildCatalogSearchUrl({
                ...base,
                type: undefined,
              })}
              active={!model.activeType}
            >
              All
            </FacetChip>
            {model.filters[0]?.options.map((opt) => (
              <FacetChip
                key={opt.value}
                to={buildCatalogSearchUrl({
                  ...base,
                  type: opt.value,
                })}
                active={model.activeType === opt.value}
              >
                {opt.label}
              </FacetChip>
            ))}
          </div>
        </div>

        <div className="space-y-space-4">
          <span className="text-xs font-medium text-muted-foreground">
            Material
          </span>
          <div className="flex flex-wrap gap-space-4">
            <FacetChip
              to={buildCatalogSearchUrl({
                ...base,
                material: undefined,
              })}
              active={!model.activeMaterial}
            >
              All
            </FacetChip>
            {MATERIAL_OPTIONS.map((opt) => (
              <FacetChip
                key={opt.value}
                to={buildCatalogSearchUrl({
                  ...base,
                  material: opt.value,
                })}
                active={model.activeMaterial === opt.value}
              >
                {opt.label}
              </FacetChip>
            ))}
          </div>
        </div>

        <div className="space-y-space-4">
          <span className="text-xs font-medium text-muted-foreground">
            Industry code
          </span>
          <div className="flex flex-wrap gap-space-4">
            <FacetChip
              to={buildCatalogSearchUrl({
                ...base,
                standard: undefined,
              })}
              active={!model.activeStandard}
            >
              All
            </FacetChip>
            {STANDARD_CHIP_CODES.map((code) => (
              <FacetChip
                key={code}
                to={buildCatalogSearchUrl({
                  ...base,
                  standard: code,
                })}
                active={model.activeStandard === code}
                title={standardLabels.get(code) ?? code}
              >
                {code}
              </FacetChip>
            ))}
          </div>
        </div>

        <div className="space-y-space-4">
          <span className="text-xs font-medium text-muted-foreground">
            Product type
          </span>
          <div className="flex flex-wrap gap-space-4">
            <FacetChip
              to={buildCatalogSearchUrl({
                ...base,
                productType: undefined,
              })}
              active={!model.activeProductType}
            >
              All
            </FacetChip>
            {PRODUCT_TYPE_OPTIONS.map((opt) => (
              <FacetChip
                key={opt.value}
                to={buildCatalogSearchUrl({
                  ...base,
                  productType: opt.value,
                })}
                active={model.activeProductType === opt.value}
              >
                {opt.label}
              </FacetChip>
            ))}
          </div>
        </div>

        <div className="space-y-space-4">
          <span className="text-xs font-medium text-muted-foreground">
            Auction
          </span>
          <div className="flex flex-wrap gap-space-4">
            <FacetChip
              to={buildCatalogSearchUrl({
                ...base,
                auctionEligible: undefined,
              })}
              active={!model.activeAuctionEligible}
            >
              All
            </FacetChip>
            <FacetChip
              to={buildCatalogSearchUrl({
                ...base,
                auctionEligible: true,
              })}
              active={Boolean(model.activeAuctionEligible)}
            >
              Auction eligible
            </FacetChip>
          </div>
        </div>

        {model.filters.slice(1).map((filter) => (
          <fieldset key={filter.id} className="space-y-space-4">
            <legend className="text-xs font-medium text-muted-foreground">
              {filter.label}
            </legend>
            <div className="flex flex-wrap gap-space-4">
              {filter.options.map((opt) => (
                <Button
                  key={`${filter.id}-${opt.value}`}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled
                  title="Access filter — post-MVP"
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
    </div>
  );
}

function CatalogKnowledgeHits({
  model,
  base,
}: {
  model: CatalogSearchViewModel;
  base: CatalogSearchUrlParams;
}) {
  if ((model.sourceCounts?.knowledge ?? 0) === 0) return null;
  return (
    <section
      className="space-y-stack-dense"
      data-testid="catalog-knowledge-section"
    >
      <h2 className="mb-space-4 text-type-16 font-medium text-foreground">
        Domain knowledge
      </h2>
      <p className="mb-space-8 text-type-14 text-muted-foreground">
        Glossary and domain notes matching the active filters. Asset rows below
        are not filtered by hallmark.
      </p>
      <div className="space-y-space-8">
        {model.results
          .filter((row) => row.source === "knowledge")
          .map((row) => (
            <div
              key={`knowledge-${row.id}`}
              className="flex flex-wrap items-start justify-between gap-space-8 rounded-md border border-border px-stack-dense py-space-8"
            >
              <div className="min-w-0 space-y-space-4">
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
                  <div className="flex flex-wrap gap-space-4">
                    {row.facets.standards.map((code) => (
                      <Link
                        key={code}
                        to={buildCatalogSearchUrl({
                          ...base,
                          standard: code,
                          page: 1,
                        })}
                        className="inline-flex rounded-[var(--radius-sm)] border border-border px-space-4 py-space-2 text-type-12 text-muted-foreground hover:border-primary hover:text-foreground"
                      >
                        {code}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
              <Badge variant="outline" className="text-type-12 capitalize">
                {row.itemType}
              </Badge>
            </div>
          ))}
      </div>
    </section>
  );
}

function CatalogPagination({
  pagination,
  base,
}: {
  pagination: CatalogSearchViewModel["pagination"];
  base: CatalogSearchUrlParams;
}) {
  if (pagination.totalPages <= 1) return null;
  return (
    <nav
      className="flex items-center justify-between gap-space-8"
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
  );
}

function CatalogSearchForm({ model }: { model: CatalogSearchViewModel }) {
  const { t } = useI18n();
  return (
    <Toolbar appearance="plain">
      <form
        method="get"
        className="flex w-full flex-col gap-stack-dense sm:flex-row"
      >
        {model.intent ? (
          <input type="hidden" name="intent" value={model.intent} />
        ) : null}
        {model.activeType ? (
          <input type="hidden" name="type" value={model.activeType} />
        ) : null}
        {model.activeMaterial ? (
          <input type="hidden" name="material" value={model.activeMaterial} />
        ) : null}
        {model.activeStandard ? (
          <input type="hidden" name="standard" value={model.activeStandard} />
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
          aria-label={t("catalog-search.page.title")}
          className="flex-1"
        />
        <Button type="submit">{t("catalog.search.submit")}</Button>
      </form>
    </Toolbar>
  );
}

function CatalogEmptyAction({ model }: { model: CatalogSearchViewModel }) {
  const { t } = useI18n();
  const hasFacets =
    Boolean(model.activeMaterial) ||
    Boolean(model.activeStandard) ||
    Boolean(model.activeProductType) ||
    Boolean(model.activeAuctionEligible);
  return (
    <div className="flex flex-col items-center gap-space-8 sm:flex-row">
      {hasFacets ? (
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
        {t("nav.metadata")} →
      </Link>
    </div>
  );
}

export function CatalogSearchPanel({ model }: CatalogSearchPanelProps) {
  const { t } = useI18n();
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

  const standardLabels = new Map(
    INDUSTRY_STANDARD_REGISTRY.map((e) => [e.code, e.labelZhTw])
  );

  const assetRows = model.results.filter((row) => row.source !== "knowledge");

  return (
    <Stack gap="xl">
      <ProductPageHeader
        title={t("catalog-search.page.title")}
        extra={
          model.intent === "ai-fallback" ? (
            <StatusChip status="warning">AI fallback</StatusChip>
          ) : null
        }
        description={
          <>
            {model.phase === "hybrid"
              ? "Filter APIs and tables, then open an asset to request access. Domain knowledge appears first; assets are not filtered by hallmark."
              : "Search and filter catalog rows, then open an asset to request access."}{" "}
            <Link
              to="/catalog-search/dictionary"
              className="text-primary hover:underline"
            >
              Browse the full dictionary →
            </Link>
          </>
        }
      />
      {model.facetWarning ? (
        <Callout tone="warning" role="status">
          {model.facetWarning}
        </Callout>
      ) : null}

      <CatalogSearchForm model={model} />

      <CatalogFacetFilters
        model={model}
        base={base}
        standardLabels={standardLabels}
      />
      <CatalogKnowledgeHits model={model} base={base} />

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
        isEmpty={assetRows.length === 0}
        skeletonRows={3}
        emptyMessage="No asset or catalog rows match your query."
        emptyAction={<CatalogEmptyAction model={model} />}
        pagination={<CatalogPagination pagination={pagination} base={base} />}
      >
        <DataTable
          columns={[
            {
              key: "name",
              header: "Name",
              accessor: (row) => (
                <div className="space-y-space-4">
                  {row.detailHref ? (
                    <Link
                      to={row.detailHref}
                      className={PRODUCT_TABLE_LINK_CLASS}
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
                    <div className="flex flex-wrap gap-space-4">
                      {row.facets.standards.map((code) => (
                        <Link
                          key={code}
                          to={buildCatalogSearchUrl({
                            ...base,
                            standard: code,
                            page: 1,
                          })}
                          className="inline-flex rounded-[var(--radius-sm)] border border-border px-space-4 py-space-2 text-type-12 text-muted-foreground hover:border-primary hover:text-foreground"
                        >
                          {code}
                        </Link>
                      ))}
                      {row.facets.materials.slice(0, 2).map((material) => (
                        <Link
                          key={material}
                          to={buildCatalogSearchUrl({
                            ...base,
                            material,
                            page: 1,
                          })}
                          className="border-border/60 inline-flex rounded-[var(--radius-sm)] border px-space-4 py-space-2 text-type-12 text-muted-foreground hover:border-primary hover:text-foreground"
                        >
                          {material.replace(/_/g, " ")}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ),
            },
            {
              key: "description",
              header: "Description",
              accessor: (row) => (
                <span className="line-clamp-2 text-muted-foreground">
                  {row.description}
                </span>
              ),
            },
            {
              key: "owner",
              header: "Owner",
              accessor: (row) => (
                <span className="text-muted-foreground">
                  {row.owner ? row.owner : "—"}
                </span>
              ),
            },
            {
              key: "classification",
              header: "Class / PII",
              accessor: (row) =>
                row.classification ? (
                  <StatusChip
                    status={
                      row.classification === "PII" ||
                      row.classification === "confidential"
                        ? "warning"
                        : "neutral"
                    }
                  >
                    {row.classification}
                  </StatusChip>
                ) : (
                  <span className="text-muted-foreground">—</span>
                ),
            },
            {
              key: "updatedAt",
              header: "Updated",
              accessor: (row) => (
                <span className="font-mono text-type-12 text-muted-foreground">
                  {row.updatedAt ? row.updatedAt.slice(0, 10) : "—"}
                </span>
              ),
            },
            {
              key: "source",
              header: "Source",
              align: "right",
              accessor: (row) => (
                <StatusChip status="neutral" className="capitalize">
                  {row.source}
                </StatusChip>
              ),
            },
            {
              key: "type",
              header: "Type",
              align: "right",
              accessor: (row) => (
                <StatusChip status="info">{row.itemType}</StatusChip>
              ),
            },
          ]}
          rows={assetRows}
          getRowKey={(row) => `${row.source}-${row.id}`}
        />
      </ProductResultsShell>
    </Stack>
  );
}
