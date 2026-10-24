#!/usr/bin/env node
/**
 * HTTP smoke — fail if any route is not 200.
 * Usage: node scripts/prod-smoke.mjs [baseUrl]
 *
 * Optional: VERCEL_AUTOMATION_BYPASS_SECRET for SSO-protected previews.
 */
const base = (process.argv[2] || "https://ai-search-portal.vercel.app").replace(
  /\/$/,
  ""
);

const paths = ["/", "/catalog-search", "/metadata", "/vitals"];

function requestHeaders() {
  const headers = {};
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (bypass) {
    headers["x-vercel-protection-bypass"] = bypass;
    headers["x-vercel-set-bypass-cookie"] = "samesitenone";
  }
  return headers;
}

async function main() {
  let failed = 0;
  const headers = requestHeaders();
  for (const path of paths) {
    const url = `${base}${path}`;
    try {
      const res = await fetch(url, { redirect: "follow", headers });
      const vercelError = res.headers.get("x-vercel-error");
      const ok = res.status === 200;
      const extra = vercelError ? ` x-vercel-error=${vercelError}` : "";
      console.log(`${ok ? "PASS" : "FAIL"} ${res.status} ${url}${extra}`);
      if (!ok) {
        failed += 1;
        if (vercelError === "NOT_FOUND") {
          console.error(
            "Vercel has no SSR function for this path (platform 404). Check Framework Preset is React Router, not Remix."
          );
        } else if (res.status === 401 || res.status === 403) {
          console.error(
            "Deployment is protection-gated. Set VERCEL_AUTOMATION_BYPASS_SECRET or smoke the custom domain."
          );
        }
      }
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
