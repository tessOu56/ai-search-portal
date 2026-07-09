import { describe, expect, it } from "vitest";

import { buildCatalogSearchUrl } from "./catalog-search-url";

const CATALOG_PATH = "/catalog-search";

/**
 * URL contract tests — /catalog-search ?q= ?type= ?page=
 * This contract is consumed by both the manual path (CatalogSearchPanel)
 * and the AI dual-path (AiFallbackPanel). T-2026-017 requires no regression.
 */
describe("buildCatalogSearchUrl (URL contract)", () => {
  it("returns bare path when no params", () => {
    expect(buildCatalogSearchUrl()).toBe(CATALOG_PATH);
    expect(buildCatalogSearchUrl({})).toBe(CATALOG_PATH);
  });

  it("omits empty q and unset type", () => {
    expect(buildCatalogSearchUrl({ q: "" })).toBe(CATALOG_PATH);
    expect(buildCatalogSearchUrl({ q: "", type: undefined })).toBe(
      CATALOG_PATH
    );
  });

  it("carries q with proper encoding", () => {
    expect(buildCatalogSearchUrl({ q: "weather data" })).toBe(
      `${CATALOG_PATH}?q=weather+data`
    );
  });

  it("carries type and combines with q", () => {
    expect(buildCatalogSearchUrl({ q: "dict", type: "API" })).toBe(
      `${CATALOG_PATH}?q=dict&type=API`
    );
  });

  it("omits page=1 (canonical) but carries page>1", () => {
    expect(buildCatalogSearchUrl({ q: "a", page: 1 })).toBe(
      `${CATALOG_PATH}?q=a`
    );
    expect(buildCatalogSearchUrl({ q: "a", page: 2 })).toBe(
      `${CATALOG_PATH}?q=a&page=2`
    );
  });

  it("round-trips through URLSearchParams", () => {
    const url = buildCatalogSearchUrl({
      q: "台北 天氣",
      type: "Dataset",
      page: 3,
    });
    const sp = new URLSearchParams(url.split("?")[1]);
    expect(sp.get("q")).toBe("台北 天氣");
    expect(sp.get("type")).toBe("Dataset");
    expect(sp.get("page")).toBe("3");
  });
});
