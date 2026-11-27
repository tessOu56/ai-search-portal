#!/usr/bin/env node
/**
 * Local Workers smoke after `pnpm run build` + `wrangler dev` (or preview).
 * Usage: WORKERS_BASE=http://127.0.0.1:8787 node scripts/workers-smoke.mjs
 */
const base = (
  process.env.WORKERS_BASE ?? "http://127.0.0.1:8787"
).replace(/\/$/, "");

const paths = [
  "/",
  "/catalog-search",
  "/metadata",
  "/vitals",
  "/api/context/packs",
  "/api/release-notes",
];

const PORTAL_MARKER = 'data-app="portal"';

let failed = 0;

for (const route of paths) {
  const url = `${base}${route}`;
  try {
    const res = await fetch(url, {
      headers: { accept: route === "/" ? "text/html" : "*/*" },
      redirect: "manual",
    });
    const body = await res.text();
    if (res.status !== 200) {
      console.error(`FAIL ${route}: HTTP ${res.status}`);
      failed += 1;
      continue;
    }
    if (route === "/" && !body.includes(PORTAL_MARKER)) {
      console.error(`FAIL ${route}: missing portal shell marker`);
      failed += 1;
      continue;
    }
    console.log(`OK   ${route}`);
  } catch (error) {
    console.error(`FAIL ${route}:`, error instanceof Error ? error.message : error);
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`workers-smoke: ${failed} failure(s)`);
  process.exit(1);
}
console.log("workers-smoke: all routes OK");