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
});
