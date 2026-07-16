/**
 * DOM-count + worker metrics for T-017 / T-064.
 * Run: pnpm exec playwright test --config=playwright.perf.config.ts
 */
import { writeFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

const ROW_SELECTOR = "[data-row]";
const WAIT_DOM = "domcontentloaded";
const NAIVE_TOTAL = 10_000;

test.describe.configure({ mode: "serial" });

test("measure dictionary virtualization DOM counts", async ({ page }) => {
  const offUrl = "/catalog-search/dictionary?virtual=off";
  const onUrl = "/catalog-search/dictionary";

  await page.goto(offUrl, { waitUntil: WAIT_DOM });
  await expect(page.getByText("naive baseline")).toBeVisible({
    timeout: 60_000,
  });
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
  await expect(page.getByText("100,000")).toBeVisible({ timeout: 60_000 });
  await page.waitForSelector('[data-testid="worker-metrics"]', {
    timeout: 120_000,
  });
  await page.waitForSelector(ROW_SELECTOR, { timeout: 120_000 });
  await page.waitForTimeout(1000);
  const onCount = await page.evaluate(
    (sel) => document.querySelectorAll(sel).length,
    ROW_SELECTOR
  );
  const workerMetrics = await page.getByTestId("worker-metrics").textContent();

  const result = {
    measuredAt: new Date().toISOString(),
    ticket: "T-2026-064",
    off: { domRows: offCount, waitForRowsMs: offMs, datasetRows: NAIVE_TOTAL },
    on: { domRows: onCount, datasetRows: 100_000, workerMetrics },
    deltaDom: offCount - onCount,
    memoryNote:
      "Capture heap snapshot manually in Chrome Memory panel after scroll",
  };

  const out = path.join("docs", "perf", "catalog-dictionary-measured.json");
  writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  // eslint-disable-next-line no-console
  console.log("PERF_RESULT", JSON.stringify(result));

  expect(offCount).toBe(NAIVE_TOTAL);
  expect(onCount).toBeLessThanOrEqual(40);
  expect(onCount).toBeGreaterThan(0);
});
