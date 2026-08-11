import { describe, expect, it } from "vitest";

import { parseIndustryFacetsFromSearchParams } from "~/shared/utils/industry-facets-url";

import { getCatalogSearchViewModel } from "./catalog-search.server";

const PACK_ID = "metalcraft-studio";

/**
 * Smoke-level coverage for commerce URL → knowledge section (complements e2e/
 * catalog-commerce.spec.ts when Playwright needs Node 22).
 */
describe("catalog commerce facets (loader smoke)", () => {
  it("productType=experience returns knowledge rows", () => {
    const model = getCatalogSearchViewModel("", {
      packId: PACK_ID,
      productType: "experience",
    });
    expect(model.activeProductType).toBe("experience");
    expect(model.sourceCounts?.knowledge).toBeGreaterThan(0);
    expect(
      model.results
        .filter((r) => r.source === "knowledge")
        .every((r) => r.facets?.productTypes?.includes("experience"))
    ).toBe(true);
  });

  it("auctionEligible=true returns only auction-eligible knowledge", () => {
    const model = getCatalogSearchViewModel("", {
      packId: PACK_ID,
      auctionEligible: true,
    });
    expect(model.activeAuctionEligible).toBe(true);
    expect(model.sourceCounts?.knowledge).toBeGreaterThan(0);
    expect(
      model.results
        .filter((r) => r.source === "knowledge")
        .every((r) => r.facets?.auctionEligible === true)
    ).toBe(true);
  });

  it("invalid productType is stripped with facetWarning", () => {
    const parsed = parseIndustryFacetsFromSearchParams(
      new URLSearchParams({ productType: "not-a-type" })
    );
    expect(parsed.productType).toBeUndefined();
    expect(parsed.facetWarning).toMatch(/productType/i);
    const model = getCatalogSearchViewModel("", {
      packId: PACK_ID,
      productType: parsed.productType,
      facetWarning: parsed.facetWarning,
    });
    expect(model.activeProductType).toBeUndefined();
    expect(model.facetWarning).toMatch(/productType/i);
  });
});
