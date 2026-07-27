import { describe, expect, it } from "vitest";

import { loader as knowledgeSearchLoader } from "~/routes/api.knowledge.search";
import { API_KNOWLEDGE_SEARCH } from "~/shared/api/paths";
import { knowledgeSearchResponseSchema } from "~/shared/contracts";
import { parseIndustryFacetsFromSearchParams } from "~/shared/utils/industry-facets-url";

async function callLoader(url: string): Promise<Response> {
  const result = knowledgeSearchLoader({
    request: new Request(url),
    params: {},
    context: {},
  });
  return Promise.resolve(result as Response);
}

describe("api.knowledge.search — non-success paths", () => {
  it("returns 400 for invalid material", async () => {
    const res = await callLoader(
      "http://localhost/api/knowledge/search?material=not_a_metal"
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for unknown industry standard", async () => {
    const res = await callLoader(
      "http://localhost/api/knowledge/search?standard=ZZZ999"
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid pack id", async () => {
    const res = await callLoader(
      "http://localhost/api/knowledge/search?pack=../etc"
    );
    expect(res.status).toBe(400);
  });

  it("normalizes Au750 and returns 200 hits", async () => {
    const res = await callLoader(
      "http://localhost/api/knowledge/search?pack=metalcraft-studio&standard=Au750&limit=10"
    );
    expect(res.status).toBe(200);
    const body = knowledgeSearchResponseSchema.parse(await res.json());
    expect(body.data.length).toBeGreaterThan(0);
  });

  it("returns empty data for unmatched query", async () => {
    const res = await callLoader(
      "http://localhost/api/knowledge/search?q=zzznomatchxyz123"
    );
    expect(res.status).toBe(200);
    const body = knowledgeSearchResponseSchema.parse(await res.json());
    expect(body.data).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("returns 400 for invalid productType", async () => {
    const res = await callLoader(
      "http://localhost/api/knowledge/search?productType=not-a-type"
    );
    expect(res.status).toBe(400);
  });
});

describe("MSW /api/knowledge/search — 400 alignment", () => {
  it("rejects invalid material with 400", async () => {
    const res = await fetch(`${API_KNOWLEDGE_SEARCH}?material=nope`);
    expect(res.status).toBe(400);
  });

  it("rejects unknown standard with 400", async () => {
    const res = await fetch(`${API_KNOWLEDGE_SEARCH}?standard=not-a-code`);
    expect(res.status).toBe(400);
  });
});

describe("parseIndustryFacetsFromSearchParams", () => {
  it("normalizes Au750 and strips unknown material with warning", () => {
    const sp = new URLSearchParams({
      material: "bogus",
      standard: "Au750",
    });
    const parsed = parseIndustryFacetsFromSearchParams(sp);
    expect(parsed.material).toBeUndefined();
    expect(parsed.standard).toBe("18K");
    expect(parsed.facetWarning).toContain("Unknown material");
  });

  it("keeps valid URL facets without inference", () => {
    const sp = new URLSearchParams({ material: "gold", standard: "14K" });
    const parsed = parseIndustryFacetsFromSearchParams(sp);
    expect(parsed).toEqual({
      material: "gold",
      standard: "14K",
      productType: undefined,
      auctionEligible: undefined,
      facetWarning: undefined,
    });
  });

  it("parses productType and auctionEligible=true", () => {
    const sp = new URLSearchParams({
      productType: "physical",
      auctionEligible: "true",
    });
    const parsed = parseIndustryFacetsFromSearchParams(sp);
    expect(parsed.productType).toBe("physical");
    expect(parsed.auctionEligible).toBe(true);
  });
});
