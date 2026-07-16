import { describe, expect, it } from "vitest";

import { buildCatalogSearchUrl } from "./catalog-search-url";
import {
  DICTIONARY_TOTAL,
  filterDictionaryRows,
  generateDictionaryRows,
  NAIVE_BASELINE_TOTAL,
} from "./dictionary.fixture";
import { getDictionaryModel, getNaiveBaselineRows } from "./dictionary.server";

const DICTIONARY_PATH = "/catalog-search/dictionary";
const ORDERS_LIST_QUERY = "orders/list";

describe("dictionary fixture (T-2026-017 / T-064)", () => {
  it("generates deterministic rows", () => {
    const rows = generateDictionaryRows(100);
    expect(rows[0].id).toBe("dict-0");
    expect(generateDictionaryRows(100)[12]).toEqual(rows[12]);
  });

  it("naive baseline is 10k rows", () => {
    const rows = getNaiveBaselineRows();
    expect(rows).toHaveLength(NAIVE_BASELINE_TOTAL);
    expect(getNaiveBaselineRows()[1234]).toEqual(rows[1234]);
  });

  it("virtual model uses worker mode with 100k total", () => {
    const model = getDictionaryModel("");
    expect(model.virtual).toBe(true);
    expect(model.workerMode).toBe(true);
    expect(model.totalUnfiltered).toBe(DICTIONARY_TOTAL);
    expect(model.results).toHaveLength(0);
  });

  it("keeps ?type= filter semantics on naive baseline", () => {
    const model = getDictionaryModel("", { type: "Dataset", virtual: false });
    expect(model.total).toBeGreaterThan(0);
    expect(model.results.every((r) => r.itemType === "Dataset")).toBe(true);
    const api = getDictionaryModel("", { type: "API", virtual: false });
    expect(api.total + model.total).toBe(NAIVE_BASELINE_TOTAL);
  });

  it("filters by q across name and description", () => {
    const all = getNaiveBaselineRows();
    const filtered = filterDictionaryRows(all, ORDERS_LIST_QUERY);
    const model = getDictionaryModel(ORDERS_LIST_QUERY, { virtual: false });
    expect(model.total).toBe(filtered.length);
    expect(model.total).toBeGreaterThan(0);
    expect(model.total).toBeLessThan(NAIVE_BASELINE_TOTAL);
  });

  it("virtual flag honours off for naive path", () => {
    expect(getDictionaryModel("", { virtual: false }).virtual).toBe(false);
    expect(getDictionaryModel("", { virtual: false }).workerMode).toBe(false);
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
