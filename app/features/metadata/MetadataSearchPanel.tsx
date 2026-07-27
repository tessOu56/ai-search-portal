import { listIndustryStandards } from "@ai-search-portal/contracts";
import { Form, Link, useNavigation } from "@remix-run/react";

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
import { buildCatalogSearchUrl } from "~/features/catalogsearch/catalog-search-url";
import { API_CONTEXT_PACK_SELECT } from "~/shared/api/paths";
import type {
  ContextPackManifestContract,
  KnowledgeChunkContract,
  MetadataAssetSummaryContract,
} from "~/shared/contracts";
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

function facetChipClass(active: boolean): string {
  return `inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium ${
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-background hover:bg-muted"
  }`;
}

export function MetadataSearchPanel({ model }: MetadataSearchPanelProps) {
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
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-full text-xs">
            Context catalog
          </Badge>
          <Badge variant="secondary" className="rounded-full text-xs">
            Context pack
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
        <h1 className="text-3xl font-bold tracking-tight">Metadata catalog</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Domain-neutral context infrastructure with swappable packs,
          policy-driven access, GenUI lineage, and industry hallmark bridges.
          Asset rows are not filtered by hallmark — knowledge bridge is.
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
              placeholder="Search metadata… or 925 / 18K"
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
            to={buildMetadataSearchUrl({
              q: model.query,
              pack: model.activePackId,
              intent: model.intent,
              material: model.activeMaterial,
              standard: model.activeStandard,
            })}
            className={facetChipClass(!model.activeType)}
          >
            All
          </Link>
          {TYPE_OPTIONS.map((opt) => (
            <Link
              key={opt}
              to={buildMetadataSearchUrl({
                q: model.query,
                type: opt,
                pack: model.activePackId,
                intent: model.intent,
                material: model.activeMaterial,
                standard: model.activeStandard,
              })}
              className={facetChipClass(model.activeType === opt)}
            >
              {opt}
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Industry facets</CardTitle>
          <CardDescription>
            Hallmark / material filters bridge to catalog knowledge (
            <code className="text-xs">?material=</code> /{" "}
            <code className="text-xs">?standard=</code>).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Material
            </span>
            <div className="flex flex-wrap gap-1">
              <Link
                to={buildMetadataSearchUrl({
                  q: model.query,
                  type: model.activeType,
                  pack: model.activePackId,
                  intent: model.intent,
                  standard: model.activeStandard,
                })}
                className={facetChipClass(!model.activeMaterial)}
              >
                All
              </Link>
              {MATERIAL_OPTIONS.map((opt) => (
                <Link
                  key={opt.value}
                  to={buildMetadataSearchUrl({
                    q: model.query,
                    type: model.activeType,
                    pack: model.activePackId,
                    intent: model.intent,
                    material: opt.value,
                    standard: model.activeStandard,
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
                to={buildMetadataSearchUrl({
                  q: model.query,
                  type: model.activeType,
                  pack: model.activePackId,
                  intent: model.intent,
                  material: model.activeMaterial,
                })}
                className={facetChipClass(!model.activeStandard)}
              >
                All
              </Link>
              {STANDARD_CHIP_CODES.map((code) => (
                <Link
                  key={code}
                  to={buildMetadataSearchUrl({
                    q: model.query,
                    type: model.activeType,
                    pack: model.activePackId,
                    intent: model.intent,
                    material: model.activeMaterial,
                    standard: code,
                  })}
                  className={facetChipClass(model.activeStandard === code)}
                >
                  {code}
                </Link>
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
        </CardContent>
      </Card>

      {knowledgeHits.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Knowledge bridge</CardTitle>
            <CardDescription>
              Industry-matched glossary / ops from the active pack.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
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
                className="hover:bg-muted/40 flex flex-wrap items-start justify-between gap-2 rounded-md border border-border px-3 py-2"
              >
                <div className="min-w-0 space-y-1">
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
          </CardContent>
        </Card>
      ) : null}

      <ProductResultsShell
        title="Results"
        description={buildResultsDescription(model)}
        isLoading={isLoading}
        isEmpty={model.results.length === 0}
        skeletonGridClass="grid-cols-[1fr_1fr_2fr_auto]"
        skeletonRows={3}
        emptyMessage="No assets match your filters."
        emptyAction={
          <div className="flex flex-col items-center gap-2 sm:flex-row">
            {model.activeMaterial || model.activeStandard ? (
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
        pagination={
          pagination.totalPages > 1 ? (
            <nav
              className="flex items-center justify-between gap-2"
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
          ) : null
        }
      >
        <div className="grid grid-cols-[1fr_1fr_2fr_auto] bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
          <span>Name</span>
          <span>Owner</span>
          <span>Description</span>
          <span className="text-right">Type</span>
        </div>
        <div className="divide-y divide-border text-sm">
          {model.results.map((row) => (
            <Link
              key={row.id}
              to={`/metadata/${row.id}?pack=${encodeURIComponent(model.activePackId)}`}
              className="hover:bg-muted/50 grid grid-cols-[1fr_1fr_2fr_auto] items-center gap-2 px-4 py-3"
            >
              <span className="font-medium text-primary">{row.name}</span>
              <span className="text-muted-foreground">{row.owner}</span>
              <span className="text-muted-foreground">{row.description}</span>
              <Badge
                variant="secondary"
                className="justify-self-end rounded-full text-xs"
              >
                {row.assetType}
              </Badge>
            </Link>
          ))}
        </div>
      </ProductResultsShell>
    </div>
  );
}
