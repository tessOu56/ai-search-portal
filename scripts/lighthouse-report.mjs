#!/usr/bin/env node
/**
 * Production Lighthouse / Core Web Vitals capture.
 *
 * Usage (after `pnpm run build`):
 *   PORT=4173 node scripts/lighthouse-report.mjs
 *
 * Writes reports/lighthouse/<stamp>/{summary.json,*.json} and prints a table.
 * Does not start the app — point LIGHTHOUSE_URL at a running production server.
 */
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
      const row = await runRoute(lighthouse, chrome.port, route);
      const { lhr, ...summary } = row;
      await writeFile(
        path.join(OUT_DIR, `${route.replaceAll("/", "_") || "home"}.json`),
        JSON.stringify(lhr, null, 2)
      );
      rows.push(summary);
    }
  } finally {
    await chrome.kill();
  }

  const payload = {
    method: {
      tool: "lighthouse",
      formFactor: "desktop",
      throttling: "simulate (Lighthouse default desktop)",
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
  console.log(`Wrote ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
