import { describe, expect, it } from "vitest";

import { buildMetadataSearchUrl } from "./metadata-search-url";

describe("buildMetadataSearchUrl", () => {
  it("returns bare path when empty", () => {
    expect(buildMetadataSearchUrl()).toBe("/metadata");
  });

  it("carries industry facets for catalog handoff", () => {
    expect(
      buildMetadataSearchUrl({
        q: "銀",
        material: "sterling_silver",
        standard: "925",
        intent: "ai-fallback",
      })
    ).toBe(
      "/metadata?q=%E9%8A%80&intent=ai-fallback&material=sterling_silver&standard=925"
    );
  });

  it("carries type, pack, commerce facets, and page>1", () => {
    expect(
      buildMetadataSearchUrl({
        type: "Table",
        pack: "enterprise-mau",
        productType: "physical",
        auctionEligible: true,
        page: 2,
      })
    ).toBe(
      "/metadata?type=Table&pack=enterprise-mau&productType=physical&auctionEligible=true&page=2"
    );
  });

  it("omits empty query and canonical page=1", () => {
    expect(buildMetadataSearchUrl({ q: "", page: 1 })).toBe("/metadata");
  });
});
