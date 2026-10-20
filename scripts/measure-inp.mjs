#!/usr/bin/env node
/**
 * One-interaction INP sample via Playwright (Lighthouse navigation has no INP).
 */
import { chromium } from "@playwright/test";

const BASE = process.env.LIGHTHOUSE_URL ?? "http://127.0.0.1:4173";
const ROUTE = process.env.INP_ROUTE ?? "/";

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
  args: ["--headless=new", "--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(new URL(ROUTE, BASE).toString(), { waitUntil: "networkidle" });
await page.waitForTimeout(500);
const input = page.getByLabel(/Ask a question|提問|home.composer.label/);
if (await input.count()) {
  await input.click();
  await input.type("pii", { delay: 20 });
} else {
  await page.mouse.click(400, 400);
}
await page.waitForTimeout(1200);
const inp = await page.evaluate(() => {
  const entries = performance.getEntriesByType("event");
  const worst = entries.reduce((max, entry) => {
    const duration = entry.duration ?? 0;
    return duration > max ? duration : max;
  }, 0);
  return { worstEventMs: worst, eventCount: entries.length };
});
console.log(JSON.stringify({ route: ROUTE, ...inp }, null, 2));
await browser.close();
