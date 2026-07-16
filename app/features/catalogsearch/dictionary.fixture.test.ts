import { describe, expect, it } from "vitest";

import {
  DICTIONARY_TOTAL,
  filterDictionaryRows,
  generateDictionaryRows,
} from "./dictionary.fixture";

describe("dictionary.fixture (T-064)", () => {
  it("builds 100k rows for worker init", () => {
    const rows = generateDictionaryRows(DICTIONARY_TOTAL);
    expect(rows).toHaveLength(DICTIONARY_TOTAL);
    expect(rows[99_999].id).toBe("dict-99999");
  });

  it("filters 100k rows consistently", () => {
    const rows = generateDictionaryRows(DICTIONARY_TOTAL);
    const filtered = filterDictionaryRows(rows, "catalog", "API");
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((r) => r.itemType === "API")).toBe(true);
  });
});
