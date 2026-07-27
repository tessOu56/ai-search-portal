import { describe, expect, it } from "vitest";

import {
  buildCatalogFacetUrl,
  buildKnowledgeContinueSources,
  buildKnowledgeSourceUrl,
} from "./knowledge-links.js";

describe("knowledge deep links", () => {
  it("builds catalog facet URL with standard", () => {
    expect(
      buildCatalogFacetUrl({
        q: "925 銀",
        standard: "925",
        material: "sterling_silver",
        intent: "manual",
      })
    ).toContain("standard=925");
  });

  it("prefers metadata asset ref for glossary hits", () => {
    const url = buildKnowledgeSourceUrl({
      id: "term-925-silver",
      title: "925 銀",
      kind: "glossary",
      refs: ["dim-material"],
      facets: {
        materials: ["sterling_silver"],
        standards: ["925", "Ag925"],
      },
    });
    expect(url).toBe("/metadata/dim-material?pack=metalcraft-studio");
  });

  it("falls back to catalog facet URL when no metadata ref", () => {
    const url = buildKnowledgeSourceUrl({
      id: "term-18k-gold",
      title: "18K 金",
      kind: "glossary",
      refs: [],
      facets: { materials: ["gold"], standards: ["18K", "Au750"] },
    });
    expect(url).toContain("/catalog-search?");
    expect(url).toContain("standard=18K");
    expect(url).toContain("material=gold");
  });

  it("adds continue sources for success-path handoff", () => {
    const links = buildKnowledgeContinueSources("什麼是 925", {
      id: "term-925-silver",
      title: "925 銀",
      kind: "glossary",
      facets: { materials: ["sterling_silver"], standards: ["925"] },
    });
    expect(links.some((l) => l.url.includes("standard=925"))).toBe(true);
    expect(links.some((l) => l.url.startsWith("/metadata"))).toBe(true);
  });

  it("continues with commerce facets from query inference", () => {
    const links = buildKnowledgeContinueSources("銀戒鍛造入門體驗", undefined);
    expect(links.some((l) => l.url.includes("productType=experience"))).toBe(
      true
    );
  });

  it("includes auctionEligible on catalog source URL", () => {
    const url = buildKnowledgeSourceUrl({
      id: "narr-prod-phy-2",
      title: "潮汐銅手鐲（孤品）",
      kind: "narrative",
      refs: ["prod-phy-2"],
      facets: {
        materials: ["copper"],
        productTypes: ["physical"],
        auctionEligible: true,
      },
    });
    expect(url).toContain("productType=physical");
    expect(url).toContain("auctionEligible=true");
  });
});
