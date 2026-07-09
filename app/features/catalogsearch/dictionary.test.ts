import { describe, expect, it } from "vitest";

import { buildCatalogSearchUrl } from "./catalog-search-url";
import {
  DICTIONARY_TOTAL,
  getDictionaryModel,
  getDictionaryRows,
} from "./dictionary.server";

const DICTIONARY_PATH = "/catalog-search/dictionary";
const ORDERS_LIST_QUERY = "orders/list";

describe("dictionary fixture (T-2026-017)", () => {
  it("generates exactly 10k deterministic rows", () => {
    const rows = getDictionaryRows();
    expect(rows).toHaveLength(DICTIONARY_TOTAL);
    // Deterministic: same call, same data (cached + seedless generation).
    expect(getDictionaryRows()[1234]).toEqual(rows[1234]);
    expect(rows[0].id).toBe("dict-0");
  });

  it("keeps ?type= filter semantics from the catalog contract", () => {
    const model = getDictionaryModel("", { type: "Dataset" });
    expect(model.total).toBeGreaterThan(0);
    expect(model.results.every((r) => r.itemType === "Dataset")).toBe(true);
    // API + Dataset partition the fixture completely.
    const api = getDictionaryModel("", { type: "API" });
    expect(api.total + model.total).toBe(DICTIONARY_TOTAL);
  });

  it("filters by q across name and description", () => {
    const model = getDictionaryModel(ORDERS_LIST_QUERY);
    expect(model.total).toBeGreaterThan(0);
    expect(model.total).toBeLessThan(DICTIONARY_TOTAL);
    expect(
      model.results.every(
        (r) =>
          r.name.toLowerCase().includes(ORDERS_LIST_QUERY) ||
          r.description.toLowerCase().includes(ORDERS_LIST_QUERY)
      )
    ).toBe(true);
  });

  it("virtual flag defaults on and honours off", () => {
    expect(getDictionaryModel("").virtual).toBe(true);
    expect(getDictionaryModel("", { virtual: false }).virtual).toBe(false);
  });
});

describe("URL contract with basePath (dictionary view)", () => {
  it("builds dictionary URLs with the shared contract", () => {
    expect(buildCatalogSearchUrl({}, DICTIONARY_PATH)).toBe(DICTIONARY_PATH);
    expect(
      buildCatalogSearchUrl({ q: "orders", type: "API" }, DICTIONARY_PATH)
    ).toBe(`${DICTIONARY_PATH}?q=orders&type=API`);
  });

  it("default basePath is unchanged (no regression to /catalog-search)", () => {
    expect(buildCatalogSearchUrl({ q: "a", page: 2 })).toBe(
      "/catalog-search?q=a&page=2"
    );
  });
});
