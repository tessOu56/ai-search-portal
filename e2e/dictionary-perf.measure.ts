/**
 * One-shot DOM-count measurement for T-2026-017.
 * Run via: pnpm exec playwright test --config=playwright.perf.config.ts
 * Not part of CI gate — fills docs/perf numbers.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

const ROW_SELECTOR = "[data-row]";
const WAIT_DOM = "domcontentloaded";

test.describe.configure({ mode: "serial" });

test("measure dictionary virtualization DOM counts", async ({ page }) => {
  const offUrl = "/catalog-search/dictionary?virtual=off";
  const onUrl = "/catalog-search/dictionary";

  await page.goto(offUrl, { waitUntil: WAIT_DOM });
  await expect(page.getByText("naive render")).toBeVisible({ timeout: 60_000 });
  const tOff0 = Date.now();
  await page.waitForFunction(
    (sel) => document.querySelectorAll(sel).length >= 10000,
    ROW_SELECTOR,
    { timeout: 120_000 }
  );
  const offMs = Date.now() - tOff0;
  const offCount = await page.evaluate(
    (sel) => document.querySelectorAll(sel).length,
    ROW_SELECTOR
  );

  await page.goto(onUrl, { waitUntil: WAIT_DOM });
  await expect(page.getByText("virtualized")).toBeVisible({ timeout: 60_000 });
  await page.waitForSelector(ROW_SELECTOR, { timeout: 60_000 });
  // Give virtualizer a paint cycle.
  await page.waitForTimeout(500);
  const onCount = await page.evaluate(
    (sel) => document.querySelectorAll(sel).length,
    ROW_SELECTOR
  );

  const result = {
    measuredAt: new Date().toISOString(),
    off: { domRows: offCount, waitForRowsMs: offMs },
    on: { domRows: onCount },
    deltaDom: offCount - onCount,
  };

  const out = path.join("docs", "perf", "catalog-dictionary-measured.json");
  writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  // eslint-disable-next-line no-console
  console.log("PERF_RESULT", JSON.stringify(result));

  expect(offCount).toBe(10000);
  expect(onCount).toBeLessThanOrEqual(40);
  expect(onCount).toBeGreaterThan(0);
});
