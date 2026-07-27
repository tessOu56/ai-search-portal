import { inferIndustryFacetsFromText } from "@ai-search-portal/contracts";
import { describe, expect, it } from "vitest";

describe("inferIndustryFacetsFromText", () => {
  it("maps Au750 alias to 18K + gold", () => {
    expect(inferIndustryFacetsFromText("什麼是 Au750")).toEqual({
      standard: "18K",
      material: "gold",
    });
  });

  it("maps 925 銀 to sterling", () => {
    expect(inferIndustryFacetsFromText("查 925 銀成本")).toEqual({
      standard: "925",
      material: "sterling_silver",
    });
  });

  it("infers experience productType", () => {
    expect(inferIndustryFacetsFromText("銀戒鍛造入門體驗")).toMatchObject({
      productType: "experience",
    });
  });

  it("infers auctionEligible and physical from 孤品", () => {
    expect(inferIndustryFacetsFromText("潮汐銅手鐲孤品拍賣")).toMatchObject({
      productType: "physical",
      auctionEligible: true,
      material: "copper",
    });
  });

  it("returns empty for unrelated text", () => {
    expect(inferIndustryFacetsFromText("weather data")).toEqual({});
  });
});
