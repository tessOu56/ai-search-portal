import { describe, expect, it } from "vitest";

import { searchKnowledge } from "~/services/knowledge-search.server";
import { API_KNOWLEDGE_SEARCH } from "~/shared/api/paths";
import { knowledgeSearchResponseSchema } from "~/shared/contracts";

const PACK_ID = "metalcraft-studio";

describe("searchKnowledge (industry facets)", () => {
  it("finds glossary term 孤品 in metalcraft-studio", () => {
    const result = searchKnowledge({
      q: "孤品",
      packId: PACK_ID,
      kind: "glossary",
    });
    expect(result.data.some((c) => c.id === "term-one-off")).toBe(true);
    expect(result.packId).toBe(PACK_ID);
    expect(result.facets.kinds).toContain("glossary");
  });

  it("filters by material=sterling_silver", () => {
    const result = searchKnowledge({
      packId: PACK_ID,
      material: "sterling_silver",
      limit: 20,
    });
    expect(result.data.length).toBeGreaterThan(0);
    expect(
      result.data.every((c) => c.facets.materials.includes("sterling_silver"))
    ).toBe(true);
    expect(result.facets.materials).toContain("sterling_silver");
  });

  it("filters by technique=forging and finds hallmark/provenance ops", () => {
    const forging = searchKnowledge({
      packId: PACK_ID,
      technique: "forging",
      limit: 30,
    });
    expect(forging.data.some((c) => c.id === "term-forging")).toBe(true);

    const assay = searchKnowledge({
      q: "成色",
      packId: PACK_ID,
      classification: "provenance",
    });
    expect(assay.data.some((c) => c.id === "ops-assay-intake")).toBe(true);
  });

  it("filters by industry standard alias Au750", () => {
    const result = searchKnowledge({
      packId: PACK_ID,
      standard: "Au750",
      limit: 20,
    });
    expect(result.data.length).toBeGreaterThan(0);
    expect(
      result.facets.standards.some(
        (s) => s.includes("18K") || s.includes("Au750")
      )
    ).toBe(true);
  });

  it("filters by productType=experience", () => {
    const result = searchKnowledge({
      packId: PACK_ID,
      productType: "experience",
      limit: 20,
    });
    expect(result.data.length).toBeGreaterThan(0);
    expect(
      result.data.every((c) => c.facets.productTypes.includes("experience"))
    ).toBe(true);
    expect(result.facets.productTypes).toContain("experience");
  });

  it("filters by auctionEligible=true", () => {
    const result = searchKnowledge({
      packId: PACK_ID,
      auctionEligible: true,
      limit: 20,
    });
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data.every((c) => c.facets.auctionEligible)).toBe(true);
    expect(result.facets.auctionEligible).toBe(true);
  });

  it("returns empty for unmatched query", () => {
    const result = searchKnowledge({
      q: "zzznomatchxyz",
      packId: PACK_ID,
    });
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("region filter keeps glossary with empty regions", () => {
    const result = searchKnowledge({
      packId: PACK_ID,
      region: "TPE",
      material: "sterling_silver",
      limit: 30,
    });
    expect(result.data.some((c) => c.id === "term-925-silver")).toBe(true);
  });

  it("finds ops order lifecycle", () => {
    const result = searchKnowledge({
      q: "pending confirmed",
      packId: PACK_ID,
      kind: "ops",
    });
    expect(result.data.some((c) => c.id === "ops-order-lifecycle")).toBe(true);
  });
});

describe("GET /api/knowledge/search — MSW", () => {
  it("returns contract-shaped knowledge hits with facets", async () => {
    const res = await fetch(
      `${API_KNOWLEDGE_SEARCH}?q=${encodeURIComponent("孤品")}`
    );
    expect(res.ok).toBe(true);
    const json = (await res.json()) as unknown;
    const parsed = knowledgeSearchResponseSchema.safeParse(json);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.data.length).toBeGreaterThan(0);
      expect(parsed.data.facets).toBeDefined();
    }
  });

  it("supports material facet filter", async () => {
    const res = await fetch(`${API_KNOWLEDGE_SEARCH}?material=sterling_silver`);
    expect(res.ok).toBe(true);
    const json = (await res.json()) as {
      data: Array<{ facets: { materials: string[] } }>;
    };
    expect(json.data.length).toBeGreaterThan(0);
    expect(
      json.data.every((c) => c.facets.materials.includes("sterling_silver"))
    ).toBe(true);
  });
});
