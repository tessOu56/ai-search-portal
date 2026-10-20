#!/usr/bin/env node
/** Lab CWV: LIGHTHOUSE_URL must already be serving `pnpm start`. */
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

const BASE = process.env.LIGHTHOUSE_URL ?? "http://127.0.0.1:4173";
const ROUTES = (process.env.LIGHTHOUSE_ROUTES ?? "/,/catalog-search,/metadata")
  .split(",")
  .map((route) => route.trim())
  .filter(Boolean);
const STAMP = process.env.LIGHTHOUSE_STAMP ?? "run";
const RUNS = Math.max(
  1,
  Number.parseInt(process.env.LIGHTHOUSE_RUNS ?? "5", 10) || 5
);
const OUT_DIR = path.join(process.cwd(), "reports", "lighthouse", STAMP);

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  try {
    const { chromium } = require("@playwright/test");
    return chromium.executablePath();
  } catch {
    return undefined;
  }
}

function metric(audits, id) {
  const audit = audits[id];
  if (!audit || typeof audit.numericValue !== "number") return null;
  return {
    id,
    value: audit.numericValue,
    display: audit.displayValue ?? String(audit.numericValue),
    score: audit.score,
  };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function formatMs(value) {
  if (value == null) return "—";
  if (value >= 1000) return `${(value / 1000).toFixed(1)} s`;
  return `${Math.round(value)} ms`;
}

function formatCls(value) {
  if (value == null) return "—";
  return value.toFixed(3);
}

async function runRoute(lighthouse, port, route) {
  const url = new URL(route, BASE).toString();
  const result = await lighthouse(url, {
    port,
    output: "json",
    logLevel: "error",
    onlyCategories: ["performance"],
    formFactor: "desktop",
    screenEmulation: {
      mobile: false,
      width: 1280,
      height: 720,
      deviceScaleFactor: 1,
      disabled: false,
    },
    throttlingMethod: "simulate",
    preset: "desktop",
  });
  const lhr = result?.lhr;
  if (!lhr) throw new Error(`No Lighthouse result for ${url}`);
  const audits = lhr.audits;
  return {
    route,
    url,
    performance: Math.round((lhr.categories.performance?.score ?? 0) * 100),
    lcp: metric(audits, "largest-contentful-paint"),
    inp: metric(audits, "interaction-to-next-paint"),
    cls: metric(audits, "cumulative-layout-shift"),
    tbt: metric(audits, "total-blocking-time"),
    fcp: metric(audits, "first-contentful-paint"),
    unusedPreload: audits["unused-preload"]?.details?.items ?? [],
    renderBlocking: audits["render-blocking-resources"]?.details?.items ?? [],
    lhr,
  };
}

function medianRow(route, url, samples) {
  const perf = Math.round(median(samples.map((row) => row.performance)));
  const lcpValues = samples
    .map((row) => row.lcp?.value)
    .filter((value) => typeof value === "number");
  const clsValues = samples
    .map((row) => row.cls?.value)
    .filter((value) => typeof value === "number");
  const lcp = lcpValues.length ? median(lcpValues) : null;
  const cls = clsValues.length ? median(clsValues) : null;
  return {
    route,
    url,
    performance: perf,
    lcp: lcp == null ? null : { value: lcp, display: formatMs(lcp) },
    inp: null,
    cls: cls == null ? null : { value: cls, display: formatCls(cls) },
    runs: samples.map((row) => ({
      performance: row.performance,
      lcp: row.lcp?.value ?? null,
      cls: row.cls?.value ?? null,
    })),
  };
}

function printTable(rows) {
  console.log(
    [
      "route".padEnd(20),
      "perf".padStart(6),
      "LCP".padStart(10),
      "INP".padStart(10),
      "CLS".padStart(8),
    ].join("  ")
  );
  for (const row of rows) {
    console.log(
      [
        row.route.padEnd(20),
        String(row.performance).padStart(6),
        (row.lcp?.display ?? "—").padStart(10),
        (row.inp?.display ?? "—").padStart(10),
        (row.cls?.display ?? "—").padStart(8),
      ].join("  ")
    );
  }
}

async function main() {
  const { default: lighthouse } = await import("lighthouse");
  const { launch } = await import("chrome-launcher");
  const executablePath = chromePath();
  await mkdir(OUT_DIR, { recursive: true });

  const chrome = await launch({
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
    chromePath: executablePath,
  });

  const rows = [];
  try {
    for (const route of ROUTES) {
      const samples = [];
      for (let run = 1; run <= RUNS; run += 1) {
        const row = await runRoute(lighthouse, chrome.port, route);
        const { lhr, ...summary } = row;
        await writeFile(
          path.join(
            OUT_DIR,
            `${route.replaceAll("/", "_") || "home"}-run${run}.json`
          ),
          JSON.stringify(lhr, null, 2)
        );
        samples.push(summary);
      }
      rows.push(medianRow(route, samples[0]?.url ?? route, samples));
    }
  } finally {
    await chrome.kill();
  }

  const payload = {
    method: {
      tool: "lighthouse",
      formFactor: "desktop",
      throttling: "simulate (Lighthouse default desktop)",
      aggregation: "median",
      runs: RUNS,
      base: BASE,
      stamp: STAMP,
      chrome: executablePath ?? "system",
    },
    routes: rows,
  };
  await writeFile(
    path.join(OUT_DIR, "summary.json"),
    JSON.stringify(payload, null, 2)
  );
  printTable(rows);
  console.log(`Wrote ${OUT_DIR} (median of ${RUNS})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
