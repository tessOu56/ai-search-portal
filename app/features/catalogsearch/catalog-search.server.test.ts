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

  it("filters placeholder rows by type and clamps overflow pages", () => {
    const filtered = getCatalogSearchPlaceholder("", { type: "Dataset" });
    expect(filtered.results.every((row) => row.itemType === "Dataset")).toBe(
      true
    );

    const overflow = getCatalogSearchPlaceholder("", { page: 99 });
    expect(overflow.pagination.page).toBe(overflow.pagination.totalPages);
    expect(overflow.pagination.page).toBeGreaterThanOrEqual(1);
  });
});

describe("getCatalogSearchViewModel (facets and paging)", () => {
  it("keeps Table metadata matches ahead of catalog placeholders", () => {
    const model = getCatalogSearchViewModel("customer", { type: "Table" });
    expect(model.activeType).toBe("Table");
    expect(model.sourceCounts?.metadata).toBeGreaterThan(0);
    expect(
      model.results
        .filter((row) => row.source === "metadata")
        .every((row) => row.itemType === "Table")
    ).toBe(true);
    expect(
      model.results.some((row) => row.detailHref?.includes("/metadata/"))
    ).toBe(true);
  });

  it("drops catalog placeholders when a commerce facet is active", () => {
    const model = getCatalogSearchViewModel("", {
      packId: "metalcraft-studio",
      productType: "experience",
    });
    expect(model.sourceCounts?.catalog).toBe(0);
    expect(model.sourceCounts?.knowledge).toBeGreaterThan(0);
    expect(model.results.every((row) => row.source !== "catalog")).toBe(true);
  });

  it("pages hybrid results past page 1", () => {
    const pageOne = getCatalogSearchViewModel("");
    expect(pageOne.pagination.total).toBeGreaterThan(
      pageOne.pagination.pageSize
    );
    const pageTwo = getCatalogSearchViewModel("", { page: 2 });
    expect(pageTwo.pagination.page).toBe(2);
    expect(pageTwo.results[0]?.id).not.toBe(pageOne.results[0]?.id);
  });
});
