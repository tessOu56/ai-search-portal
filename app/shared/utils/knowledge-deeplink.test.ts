import { describe, expect, it } from "vitest";

import { buildKnowledgeChunkHref } from "./knowledge-deeplink";

const PACK_ID = "metalcraft-studio";

describe("buildKnowledgeChunkHref", () => {
  it("links metadata asset refs", () => {
    expect(
      buildKnowledgeChunkHref(
        {
          id: "term-925-silver",
          title: "925 銀",
          kind: "glossary",
          refs: ["dim-material"],
          facets: { standards: ["925"] },
        },
        PACK_ID
      )
    ).toBe(`/metadata/dim-material?pack=${PACK_ID}`);
  });

  it("uses catalog facet URL when no asset ref", () => {
    const href = buildKnowledgeChunkHref(
      {
        id: "term-18k",
        title: "18K",
        kind: "glossary",
        refs: [],
        facets: { materials: ["gold"], standards: ["18K"] },
      },
      PACK_ID,
      "manual"
    );
    expect(href).toContain("/catalog-search?");
    expect(href).toContain("standard=18K");
  });

  it("carries commerce facets on catalog deep links", () => {
    const href = buildKnowledgeChunkHref(
      {
        id: "narr-prod-phy-2",
        title: "潮汐銅手鐲",
        kind: "narrative",
        refs: ["prod-phy-2"],
        facets: {
          materials: ["copper"],
          productTypes: ["physical"],
          auctionEligible: true,
        },
      },
      PACK_ID,
      "manual"
    );
    expect(href).toContain("productType=physical");
    expect(href).toContain("auctionEligible=true");
  });
});
