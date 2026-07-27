import { describe, expect, it } from "vitest";

import {
  getCatalogSearchPlaceholder,
  getCatalogSearchViewModel,
} from "./catalog-search.server";

describe("getCatalogSearchViewModel (hybrid metadata bridge)", () => {
  it("returns placeholder phase when no metadata matches", () => {
    const model = getCatalogSearchViewModel("zzz-no-match-xyz");
    expect(model.phase).toBe("placeholder");
    expect(model.sourceCounts?.metadata).toBe(0);
  });

  it("merges knowledge and metadata assets ahead of catalog placeholder rows", () => {
    const model = getCatalogSearchViewModel("customer");
    expect(model.phase).toBe("hybrid");
    expect(
      (model.sourceCounts?.knowledge ?? 0) + (model.sourceCounts?.metadata ?? 0)
    ).toBeGreaterThan(0);
    expect(["knowledge", "metadata"]).toContain(model.results[0]?.source);
    expect(model.results[0]?.detailHref).toMatch(/^\/metadata/);
  });

  it("preserves ai-fallback intent in the view model", () => {
    const model = getCatalogSearchViewModel("orders", {
      intent: "ai-fallback",
    });
    expect(model.intent).toBe("ai-fallback");
  });
});

describe("getCatalogSearchPlaceholder (legacy placeholder)", () => {
  it("returns filters and mock rows", () => {
    const model = getCatalogSearchPlaceholder("");
    expect(model.phase).toBe("placeholder");
    expect(model.filters.length).toBeGreaterThan(0);
    expect(model.results.length).toBeGreaterThan(0);
    expect(model.pagination.total).toBeGreaterThan(0);
  });
});
