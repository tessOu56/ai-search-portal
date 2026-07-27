export type MetadataSearchUrlParams = {
  q?: string;
  type?: string;
  pack?: string;
  page?: number;
  intent?: "ai-fallback" | "manual";
  /** Industry facet — preserved for catalog handoff / knowledge bridge. */
  material?: string;
  standard?: string;
  productType?: string;
  auctionEligible?: boolean;
};

export function buildMetadataSearchUrl(
  params: MetadataSearchUrlParams = {}
): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.type) sp.set("type", params.type);
  if (params.pack) sp.set("pack", params.pack);
  if (params.intent) sp.set("intent", params.intent);
  if (params.material) sp.set("material", params.material);
  if (params.standard) sp.set("standard", params.standard);
  if (params.productType) sp.set("productType", params.productType);
  if (params.auctionEligible) sp.set("auctionEligible", "true");
  if (params.page !== undefined && params.page > 1) {
    sp.set("page", String(params.page));
  }
  const qs = sp.toString();
  return qs ? `/metadata?${qs}` : "/metadata";
}
