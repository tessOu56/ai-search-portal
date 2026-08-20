import { listIndustryStandards } from "@ai-search-portal/contracts";
import { Form, Link, useNavigation } from "@remix-run/react";
import type { ReactNode } from "react";

import { ProductPageHeader } from "~/components/shared/product/ProductPageShell";
import { ProductResultsShell } from "~/components/shared/product/ProductResultsShell";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Callout } from "~/components/ui/Callout";
import { DataTable } from "~/components/ui/DataTable";
import { Input } from "~/components/ui/Input";
import { Select } from "~/components/ui/Select";
import { Stack } from "~/components/ui/Stack";
import { StatusChip } from "~/components/ui/StatusChip";
import { Toolbar } from "~/components/ui/Toolbar";
import { PRODUCT_TABLE_LINK_CLASS } from "~/lib/experience-nav";
import { API_CONTEXT_PACK_SELECT } from "~/shared/api/paths";
import type {
  ContextPackManifestContract,
  KnowledgeChunkContract,
  MetadataAssetSummaryContract,
} from "~/shared/contracts";
import { useI18n } from "~/shared/i18n/context";
import { buildCatalogSearchUrl } from "~/shared/navigation";
import { buildKnowledgeChunkHref } from "~/shared/utils/knowledge-deeplink";

import { buildMetadataSearchUrl } from "./metadata-search-url";

export type MetadataSearchIntent = "ai-fallback" | "manual";

export type MetadataSearchViewModel = {
  query: string;
  activeType?: string;
  activePackId: string;
  intent?: MetadataSearchIntent;
  activeMaterial?: string;
  activeStandard?: string;
  activeProductType?: string;
  activeAuctionEligible?: boolean;
  /** When URL facet values were invalid and cleared. */
  facetWarning?: string;
  packs: ContextPackManifestContract[];
  results: MetadataAssetSummaryContract[];
  /** Knowledge bridge when industry facets are active. */
  knowledgeHits?: KnowledgeChunkContract[];
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

const TYPE_OPTIONS = ["Database", "Table", "API", "Dashboard"] as const;

const STANDARD_CHIP_CODES = listIndustryStandards()
  .filter((e) => ["925", "999", "14K", "18K", "950"].includes(e.code))
  .map((e) => e.code);

const MATERIAL_OPTIONS = [
  { value: "sterling_silver", label: "Sterling" },
  { value: "fine_silver", label: "Fine silver" },
  { value: "gold", label: "Gold" },
  { value: "copper", label: "Copper" },
  { value: "bronze", label: "Bronze" },
] as const;

function buildResultsDescription(model: MetadataSearchViewModel): string {
  const { pagination } = model;
  const parts = [`${pagination.total} asset(s)`];
  if (model.query) parts.push(`matching “${model.query}”`);
  if (model.activeType) parts.push(`type=${model.activeType}`);
  if (model.activeMaterial) parts.push(`material=${model.activeMaterial}`);
  if (model.activeStandard) parts.push(`standard=${model.activeStandard}`);
  if (model.activeProductType)
    parts.push(`productType=${model.activeProductType}`);
  if (model.activeAuctionEligible) parts.push("auctionEligible");
  if (pagination.totalPages > 1) {
    parts.push(`page ${pagination.page}/${pagination.totalPages}`);
  }
  return parts.join(" · ");
}

function FacetChip({
  to,
  active,
  children,
}: {
  to: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Button asChild size="sm" variant={active ? "default" : "outline"}>
      <Link to={to}>{children}</Link>
    </Button>
  );
}

function MetadataPagination({
  pagination,
  base,
}: {
  pagination: MetadataSearchViewModel["pagination"];
  base: {
    q: string;
    type?: string;
    pack: string;
    intent?: MetadataSearchIntent;
    material?: string;
    standard?: string;
    productType?: string;
    auctionEligible?: boolean;
  };
}) {
  if (pagination.totalPages <= 1) return null;
  return (
    <nav
      className="flex items-center justify-between gap-space-8"
      aria-label="Results pagination"
    >
      {pagination.page > 1 ? (
        <Link
          to={buildMetadataSearchUrl({
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
          to={buildMetadataSearchUrl({
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

export function MetadataSearchPanel({ model }: MetadataSearchPanelProps) {
  const { t } = useI18n();
  const { pagination } = model;
  const base = {
    q: model.query,
    type: model.activeType,
    pack: model.activePackId,
    intent: model.intent,
    material: model.activeMaterial,
    standard: model.activeStandard,
    productType: model.activeProductType,
    auctionEligible: model.activeAuctionEligible,
  };
  const redirectTo = buildMetadataSearchUrl(base);
  const navigation = useNavigation();
  const isLoading =
    navigation.state === "loading" &&
    navigation.location?.pathname === "/metadata";
  const knowledgeHits = model.knowledgeHits ?? [];

  return (
    <Stack gap="xl">
      <ProductPageHeader
        title={t("metadata.page.title")}
        extra={
          model.intent === "ai-fallback" ? (
            <StatusChip status="warning">AI fallback</StatusChip>
          ) : null
        }
        description="Find tables and APIs in the active context pack, then open a row to request access. Asset rows are not filtered by hallmark — the knowledge bridge is."
      />
      {model.facetWarning ? (
        <Callout tone="warning" role="status">
          {model.facetWarning}
        </Callout>
      ) : null}

      <Toolbar className="flex-col items-stretch gap-stack-dense">
        <h2 className="text-type-16 font-medium text-foreground">
          Context pack
        </h2>
        <Form
          method="post"
          action={API_CONTEXT_PACK_SELECT}
          className="flex w-full flex-col gap-stack-dense sm:flex-row sm:items-end"
        >
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <label className="flex flex-1 flex-col gap-space-4 text-sm">
            <span className="font-medium text-foreground">Active pack</span>
            <Select
              name="packId"
              defaultValue={model.activePackId}
              className="w-full"
              aria-label="Context pack"
              options={model.packs.map((pack) => ({
                value: pack.id,
                label: pack.name,
              }))}
            />
          </label>
          <Button type="submit">{t("catalog.search.applyPack")}</Button>
        </Form>
      </Toolbar>

      <Toolbar appearance="plain">
        <form
          method="get"
          className="flex w-full flex-col gap-stack-dense sm:flex-row"
        >
          <input type="hidden" name="pack" value={model.activePackId} />
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
            placeholder="Search metadata… or 925 / 18K"
            aria-label="Metadata search query"
            className="flex-1"
          />
          <Button type="submit">{t("catalog.search.submit")}</Button>
        </form>
      </Toolbar>

      <div className="space-y-stack-dense" aria-label="Filters">
        <h2 className="text-type-16 font-medium text-foreground">Filters</h2>
        <div className="mb-space-16 space-y-space-4">
          <span className="text-xs font-medium text-muted-foreground">
            Type
          </span>
          <div className="flex flex-wrap gap-space-4">
            <FacetChip
              to={buildMetadataSearchUrl({
                q: model.query,
                pack: model.activePackId,
                intent: model.intent,
                material: model.activeMaterial,
                standard: model.activeStandard,
              })}
              active={!model.activeType}
            >
              All
            </FacetChip>
            {TYPE_OPTIONS.map((opt) => (
              <FacetChip
                key={opt}
                to={buildMetadataSearchUrl({
                  q: model.query,
                  type: opt,
                  pack: model.activePackId,
                  intent: model.intent,
                  material: model.activeMaterial,
                  standard: model.activeStandard,
                })}
                active={model.activeType === opt}
              >
                {opt}
              </FacetChip>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-stack">
          <div className="space-y-space-4">
            <span className="text-xs font-medium text-muted-foreground">
              Material
            </span>
            <div className="flex flex-wrap gap-space-4">
              <FacetChip
                to={buildMetadataSearchUrl({
                  q: model.query,
                  type: model.activeType,
                  pack: model.activePackId,
                  intent: model.intent,
                  standard: model.activeStandard,
                })}
                active={!model.activeMaterial}
              >
                All
              </FacetChip>
              {MATERIAL_OPTIONS.map((opt) => (
                <FacetChip
                  key={opt.value}
                  to={buildMetadataSearchUrl({
                    q: model.query,
                    type: model.activeType,
                    pack: model.activePackId,
                    intent: model.intent,
                    material: opt.value,
                    standard: model.activeStandard,
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
                to={buildMetadataSearchUrl({
                  q: model.query,
                  type: model.activeType,
                  pack: model.activePackId,
                  intent: model.intent,
                  material: model.activeMaterial,
                })}
                active={!model.activeStandard}
              >
                All
              </FacetChip>
              {STANDARD_CHIP_CODES.map((code) => (
                <FacetChip
                  key={code}
                  to={buildMetadataSearchUrl({
                    q: model.query,
                    type: model.activeType,
                    pack: model.activePackId,
                    intent: model.intent,
                    material: model.activeMaterial,
                    standard: code,
                  })}
                  active={model.activeStandard === code}
                >
                  {code}
                </FacetChip>
              ))}
            </div>
          </div>
          <div className="flex w-full items-center">
            <Link
              to={buildCatalogSearchUrl({
                q: model.query,
                intent: model.intent,
                material: model.activeMaterial,
                standard: model.activeStandard,
              })}
              className="text-sm font-medium text-primary hover:underline"
            >
              Open matching knowledge in catalog →
            </Link>
          </div>
        </div>
      </div>

      {knowledgeHits.length > 0 ? (
        <section className="space-y-stack-dense">
          <h2 className="mb-space-4 text-type-16 font-medium text-foreground">
            Knowledge bridge
          </h2>
          <p className="mb-space-8 text-type-14 text-muted-foreground">
            Industry-matched glossary from the active pack.
          </p>
          <div className="space-y-space-8">
            {knowledgeHits.map((hit) => (
              <Link
                key={hit.id}
                to={buildKnowledgeChunkHref(
                  {
                    id: hit.id,
                    title: hit.title,
                    kind: hit.kind,
                    refs: hit.refs,
                    facets: hit.facets,
                  },
                  model.activePackId,
                  model.intent
                )}
                className="hover:bg-muted/40 flex flex-wrap items-start justify-between gap-space-8 rounded-md border border-border px-stack-dense py-space-8"
              >
                <div className="min-w-0 space-y-space-4">
                  <p className="text-sm font-medium text-primary hover:underline">
                    {hit.title}
                  </p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {hit.text}
                  </p>
                  {hit.facets.standards.length > 0 ? (
                    <p className="text-[10px] text-muted-foreground">
                      {hit.facets.standards.join(" · ")}
                    </p>
                  ) : null}
                </div>
                <Badge
                  variant="outline"
                  className="rounded-full text-xs capitalize"
                >
                  {hit.kind}
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <ProductResultsShell
        title="Results"
        description={buildResultsDescription(model)}
        isLoading={isLoading}
        isEmpty={model.results.length === 0}
        skeletonRows={3}
        emptyMessage="No assets match your filters."
        emptyAction={
          <div className="flex flex-col items-center gap-space-8 sm:flex-row">
            {Boolean(model.activeMaterial) || Boolean(model.activeStandard) ? (
              <Link
                to={buildMetadataSearchUrl({
                  q: model.query,
                  type: model.activeType,
                  pack: model.activePackId,
                  intent: model.intent,
                })}
                className="text-sm font-medium text-primary hover:underline"
              >
                Clear industry filters
              </Link>
            ) : null}
            <Link
              to={buildCatalogSearchUrl({
                q: model.query,
                type: model.activeType,
                intent: model.intent,
                material: model.activeMaterial,
                standard: model.activeStandard,
              })}
              className="text-sm font-medium text-primary hover:underline"
            >
              Try catalog search →
            </Link>
          </div>
        }
        pagination={<MetadataPagination pagination={pagination} base={base} />}
      >
        <DataTable
          columns={[
            {
              key: "name",
              header: "Name",
              accessor: (row) => (
                <Link
                  to={`/metadata/${row.id}?pack=${encodeURIComponent(model.activePackId)}`}
                  className={PRODUCT_TABLE_LINK_CLASS}
                >
                  {row.name}
                </Link>
              ),
            },
            {
              key: "owner",
              header: "Owner",
              accessor: (row) => (
                <span className="text-muted-foreground">
                  {row.owner || "Unassigned"}
                </span>
              ),
            },
            {
              key: "description",
              header: "Description",
              accessor: (row) => (
                <span className="text-muted-foreground">{row.description}</span>
              ),
            },
            {
              key: "type",
              header: "Type",
              align: "right",
              accessor: (row) => (
                <StatusChip status="info">{row.assetType}</StatusChip>
              ),
            },
          ]}
          rows={model.results}
          getRowKey={(row) => row.id}
        />
      </ProductResultsShell>
    </Stack>
  );
}
