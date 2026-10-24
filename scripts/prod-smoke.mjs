#!/usr/bin/env node
/**
 * HTTP smoke — fail if any route is not a same-origin portal 200.
 * Usage: node scripts/prod-smoke.mjs [baseUrl]
 *
 * Does not follow redirects (SSO 302 to vercel.com must not count as 200).
 * Optional: VERCEL_AUTOMATION_BYPASS_SECRET for SSO-protected previews.
 */
const base = (process.argv[2] || "https://ai-search-portal.vercel.app").replace(
  /\/$/,
  ""
);

const paths = ["/", "/catalog-search", "/metadata", "/vitals"];
const PORTAL_MARKER = 'data-app="portal"';

function requestHeaders() {
  const headers = { accept: "text/html" };
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
      const res = await fetch(url, { redirect: "manual", headers });
      const vercelError = res.headers.get("x-vercel-error");
      const location = res.headers.get("location") ?? "";
      const extra = [
        vercelError ? `x-vercel-error=${vercelError}` : "",
        location ? `location=${location}` : "",
      ]
        .filter(Boolean)
        .join(" ");

      if (res.status >= 300 && res.status < 400) {
        failed += 1;
        console.log(`FAIL ${res.status} ${url}${extra ? ` ${extra}` : ""}`);
        if (location.includes("vercel.com/sso") || location.includes("sso-api")) {
          console.error(
            "SSO redirect — not the portal. Set VERCEL_AUTOMATION_BYPASS_SECRET or smoke the custom domain."
          );
        }
        continue;
      }

      const body = await res.text();
      const isPortal = res.status === 200 && body.includes(PORTAL_MARKER);
      console.log(
        `${isPortal ? "PASS" : "FAIL"} ${res.status} ${url}${extra ? ` ${extra}` : ""}`
      );
      if (!isPortal) {
        failed += 1;
        if (vercelError === "NOT_FOUND") {
          console.error(
            "Vercel has no SSR function for this path (platform 404). Check Framework Preset is React Router, not Remix."
          );
        } else if (res.status === 200) {
          console.error(
            `200 but body is not the portal (missing ${PORTAL_MARKER}).`
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
