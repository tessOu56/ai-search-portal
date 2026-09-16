import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function loadCatalog(locale: string): Record<string, string> {
  return JSON.parse(
    readFileSync(
      join(ROOT, "app/shared/i18n/translations", `${locale}.json`),
      "utf8"
    )
  ) as Record<string, string>;
}

describe("i18n catalogs (live-demo leftover copy)", () => {
  const zh = loadCatalog("zh-TW");
  const en = loadCatalog("en");

  it("zh-TW and en share the same keys", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort());
  });

  it("does not fall back to the raw key as copy", () => {
    for (const [locale, catalog] of [
      ["zh-TW", zh],
      ["en", en],
    ] as const) {
      for (const [key, value] of Object.entries(catalog)) {
        expect(value, `${locale} ${key}`).not.toBe(key);
        expect(value.trim().length, `${locale} ${key}`).toBeGreaterThan(0);
      }
    }
  });
});
