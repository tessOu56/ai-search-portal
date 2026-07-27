/**
 * Parse industry facet query params from URL — loaders trust URL only
 * (inference belongs in AiFallbackPanel when writing links).
 */

import {
  knowledgeMaterialSchema,
  knowledgeProductTypeSchema,
  normalizeIndustryStandard,
} from "@ai-search-portal/contracts";

export type ParsedIndustryFacets = {
  material?: string;
  standard?: string;
  productType?: string;
  /** Only set when URL requests auction-eligible filter. */
  auctionEligible?: boolean;
  /** Present when a URL value was dropped as unknown. */
  facetWarning?: string;
};

function parseAuctionEligibleFlag(raw: string | null): {
  value?: boolean;
  warning?: string;
} {
  if (!raw) return {};
  if (raw === "true" || raw === "1") return { value: true };
  if (raw === "false" || raw === "0") return {};
  return { warning: `Unknown auctionEligible “${raw}” — cleared.` };
}

export function parseIndustryFacetsFromSearchParams(
  searchParams: URLSearchParams
): ParsedIndustryFacets {
  const warnings: string[] = [];
  let material: string | undefined;
  let standard: string | undefined;
  let productType: string | undefined;

  const materialRaw = searchParams.get("material");
  if (materialRaw) {
    const parsed = knowledgeMaterialSchema.safeParse(materialRaw);
    if (parsed.success) {
      material = parsed.data;
    } else {
      warnings.push(`Unknown material “${materialRaw}” — cleared.`);
    }
  }

  const standardRaw = searchParams.get("standard");
  if (standardRaw) {
    const canonical = normalizeIndustryStandard(standardRaw);
    if (canonical) {
      standard = canonical;
    } else {
      warnings.push(`Unknown industry code “${standardRaw}” — cleared.`);
    }
  }

  const productTypeRaw = searchParams.get("productType");
  if (productTypeRaw) {
    const parsed = knowledgeProductTypeSchema.safeParse(productTypeRaw);
    if (parsed.success) {
      productType = parsed.data;
    } else {
      warnings.push(`Unknown productType “${productTypeRaw}” — cleared.`);
    }
  }

  const auction = parseAuctionEligibleFlag(searchParams.get("auctionEligible"));
  if (auction.warning) warnings.push(auction.warning);

  return {
    material,
    standard,
    productType,
    auctionEligible: auction.value,
    facetWarning: warnings.length > 0 ? warnings.join(" ") : undefined,
  };
}
