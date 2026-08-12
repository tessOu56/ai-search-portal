#!/usr/bin/env node
/**
 * Prod smoke — HTTP 200 for home / catalog / metadata / vitals.
 * Usage: node scripts/prod-smoke.mjs [baseUrl]
 */
const base = (process.argv[2] || "https://ai-search-portal.vercel.app").replace(
  /\/$/,
  ""
);

const paths = ["/", "/catalog-search", "/metadata", "/vitals"];

async function main() {
  let failed = 0;
  for (const path of paths) {
    const url = `${base}${path}`;
    try {
      const res = await fetch(url, { redirect: "follow" });
      const ok = res.status === 200;
      console.log(`${ok ? "PASS" : "FAIL"} ${res.status} ${url}`);
      if (!ok) failed += 1;
    } catch (err) {
      failed += 1;
      console.log(`FAIL  ERR ${url} ${err instanceof Error ? err.message : err}`);
    }
  }
  if (failed > 0) {
    process.exitCode = 1;
  }
}

void main();
