/**
 * URL contract for /catalog-search — single source of truth.
 *
 * Contract (see docs/product/interface-roadmap.md §4 and T-2026-017 acceptance):
 *   /catalog-search ?q= ?type= ?page= ?material= ?standard= ?productType= ?auctionEligible=
 * - `q` omitted when empty
 * - `type` omitted when unset (= All)
 * - `page` omitted when 1 (canonical URLs never carry page=1)
 * - `material` / `standard` — industry facet filters for knowledge rows
 * - `productType` / `auctionEligible` — commerce facets (Plinth-aligned)
 *
 * Consumers: CatalogSearchPanel (filters/pagination links), the virtualized
 * dictionary view (basePath override), and the AI dual-path (AiFallbackPanel /
 * any AI→manual prefill link). All MUST build URLs through this helper so the
 * AI path and the manual path stay on the same contract.
 */
export type CatalogSearchUrlParams = {
  q?: string;
  type?: string;
  page?: number;
  /** Preserves AI→manual degradation context (interface-roadmap R2). */
  intent?: "ai-fallback" | "manual";
  /** Knowledge industry material facet (e.g. sterling_silver). */
  material?: string;
  /** Industry hallmark / karat code (e.g. 925, 18K, Au750). */
  standard?: string;
  /** Commerce product type (experience | physical | …). */
  productType?: string;
  /** When true, filter to auction-eligible knowledge chunks. */
  auctionEligible?: boolean;
};

export function buildCatalogSearchUrl(
  params: CatalogSearchUrlParams = {},
  basePath = "/catalog-search"
): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.type) sp.set("type", params.type);
  if (params.intent) sp.set("intent", params.intent);
  if (params.material) sp.set("material", params.material);
  if (params.standard) sp.set("standard", params.standard);
  if (params.productType) sp.set("productType", params.productType);
  if (params.auctionEligible) sp.set("auctionEligible", "true");
  if (params.page !== undefined && params.page > 1) {
    sp.set("page", String(params.page));
  }
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
