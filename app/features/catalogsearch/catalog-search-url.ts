/**
 * URL contract for /catalog-search — single source of truth.
 *
 * Contract (see docs/product/interface-roadmap.md §4 and T-2026-017 acceptance):
 *   /catalog-search ?q= ?type= ?page=
 * - `q` omitted when empty
 * - `type` omitted when unset (= All)
 * - `page` omitted when 1 (canonical URLs never carry page=1)
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
};

export function buildCatalogSearchUrl(
  params: CatalogSearchUrlParams = {},
  basePath = "/catalog-search"
): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.type) sp.set("type", params.type);
  if (params.page !== undefined && params.page > 1) {
    sp.set("page", String(params.page));
  }
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
