/**
 * Perf probe for T-2026-017 / T-2026-096.
 * Run: pnpm exec playwright test --config=playwright.perf.config.ts
 * Not part of CI gate — fills docs/perf numbers (DOM + long tasks + heapUsed).
 */
import { writeFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

const ROW_SELECTOR = "[data-row]";
const WAIT_DOM = "domcontentloaded";

test.describe.configure({ mode: "serial" });

type HeapSnapshot = {
  usedJSHeapSizeMb: number | null;
  totalJSHeapSizeMb: number | null;
};

type LongTaskProbe = {
  count: number;
  worstMs: number;
  over50ms: number;
};

async function readHeap(page: {
  evaluate: (fn: () => HeapSnapshot) => Promise<HeapSnapshot>;
}): Promise<HeapSnapshot> {
  return page.evaluate(() => {
    const perf = performance as Performance & {
      memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
    };
    if (!perf.memory) {
      return { usedJSHeapSizeMb: null, totalJSHeapSizeMb: null };
    }
    return {
      usedJSHeapSizeMb: Number(
        (perf.memory.usedJSHeapSize / (1024 * 1024)).toFixed(2)
      ),
      totalJSHeapSizeMb: Number(
        (perf.memory.totalJSHeapSize / (1024 * 1024)).toFixed(2)
      ),
    };
  });
}

async function probeScrollLongTasks(page: {
  evaluate: (fn: () => Promise<LongTaskProbe>) => Promise<LongTaskProbe>;
}): Promise<LongTaskProbe> {
  return page.evaluate(async () => {
    const entries: number[] = [];
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        entries.push(entry.duration);
      }
    });
    try {
      observer.observe({ type: "longtask", buffered: true });
    } catch {
      // Chromium without longtask support
    }

    const scroller =
      document.querySelector(
        '[data-testid="virtual-scroll"], [data-testid="naive-scroll"]'
      ) ??
      document.scrollingElement ??
      document.documentElement;
    const max = Math.min(scroller.scrollHeight - scroller.clientHeight, 4000);
    for (let y = 0; y <= max; y += 200) {
      scroller.scrollTop = y;
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
    }
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 400);
    });
    observer.disconnect();
    const worstMs = entries.length ? Math.max(...entries) : 0;
    return {
      count: entries.length,
      worstMs: Number(worstMs.toFixed(2)),
      over50ms: entries.filter((d) => d > 50).length,
    };
  });
}

test("measure dictionary virtualization DOM + heap + long tasks", async ({
  page,
}) => {
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
  const offHeap = await readHeap(page);
  const offLongTasks = await probeScrollLongTasks(page);

  await page.goto(onUrl, { waitUntil: WAIT_DOM });
  await expect(page.getByText("virtualized")).toBeVisible({ timeout: 60_000 });
  await page.waitForSelector(ROW_SELECTOR, { timeout: 60_000 });
  await page.waitForTimeout(500);
  const onCount = await page.evaluate(
    (sel) => document.querySelectorAll(sel).length,
    ROW_SELECTOR
  );
  const onHeap = await readHeap(page);
  const onLongTasks = await probeScrollLongTasks(page);

  const result = {
    measuredAt: new Date().toISOString(),
    ticket: "T-2026-096",
    method: "Playwright Chromium — DOM + performance.memory + Long Task API",
    note: "usedJSHeapSize is not a DevTools heap snapshot; optional polish only.",
    off: {
      domRows: offCount,
      waitForRowsMs: offMs,
      heap: offHeap,
      longTasks: offLongTasks,
    },
    on: {
      domRows: onCount,
      heap: onHeap,
      longTasks: onLongTasks,
    },
    deltaDom: offCount - onCount,
  };

  const out = path.join("docs", "perf", "catalog-dictionary-measured.json");
  writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  // eslint-disable-next-line no-console
  console.log("PERF_RESULT", JSON.stringify(result));

  expect(offCount).toBe(10000);
  expect(onCount).toBeLessThanOrEqual(40);
  expect(onCount).toBeGreaterThan(0);
  expect(onLongTasks.over50ms).toBe(0);
});
