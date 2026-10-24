#!/usr/bin/env node
/**
 * HTTP smoke — fail if any reachable route is not a same-origin portal 200.
 * Usage: node scripts/prod-smoke.mjs [baseUrl]
 *
 * Does not follow redirects (SSO 302 to vercel.com must not count as 200).
 * Optional: VERCEL_AUTOMATION_BYPASS_SECRET for SSO-protected previews.
 * Optional: VERCEL_TOKEN + VERCEL_ORG_ID to mint a shareable link when SSO blocks.
 * SSO without a bypass is SKIP (not FAIL): the app status is unobservable.
 */
const base = (process.argv[2] || "https://ai-search-portal.vercel.app").replace(
  /\/$/,
  ""
);

const paths = ["/", "/catalog-search", "/metadata", "/vitals"];
const PORTAL_MARKER = 'data-app="portal"';

function isSsoLocation(location) {
  return location.includes("vercel.com/sso") || location.includes("sso-api");
}

function requestHeaders() {
  const headers = { accept: "text/html" };
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (bypass) {
    headers["x-vercel-protection-bypass"] = bypass;
    headers["x-vercel-set-bypass-cookie"] = "samesitenone";
  }
  return headers;
}

async function vercelApi(pathname, { method = "GET", body } = {}) {
  const token = process.env.VERCEL_TOKEN;
  const teamId = process.env.VERCEL_ORG_ID;
  if (!token || !teamId) {
    return null;
  }
  const url = new URL(`https://api.vercel.com${pathname}`);
  url.searchParams.set("teamId", teamId);
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`Vercel API ${method} ${pathname} ${res.status}`);
    return null;
  }
  return data;
}

async function mintShareSecret(baseUrl) {
  const hostname = new URL(baseUrl).hostname;
  const deployment = await vercelApi(`/v13/deployments/${hostname}`);
  const deploymentId = deployment?.id ?? deployment?.uid;
  if (!deploymentId) {
    return null;
  }
  const aliasesPayload = await vercelApi(
    `/v2/deployments/${deploymentId}/aliases`
  );
  const aliasList = Array.isArray(aliasesPayload?.aliases)
    ? aliasesPayload.aliases
    : Array.isArray(aliasesPayload)
      ? aliasesPayload
      : [];
  const aliasId = aliasList[0]?.uid ?? aliasList[0]?.id ?? deploymentId;
  const patched = await vercelApi(`/aliases/${aliasId}/protection-bypass`, {
    method: "PATCH",
    body: { ttl: 3600 },
  });
  const bypass = patched?.protectionBypass;
  if (!bypass || typeof bypass !== "object") {
    return null;
  }
  return (
    Object.keys(bypass).find(
      (key) => key.length > 8 && bypass[key]?.scope === "shareable-link"
    ) ??
    Object.keys(bypass).find((key) => key.length > 8) ??
    null
  );
}

function withShare(url, shareSecret) {
  if (!shareSecret) {
    return url;
  }
  const next = new URL(url);
  next.searchParams.set("_vercel_share", shareSecret);
  return next.toString();
}

async function main() {
  let failed = 0;
  const headers = requestHeaders();
  let shareSecret = null;
  let triedShare = false;

  for (const path of paths) {
    const url = `${base}${path}`;
    try {
      let res = await fetch(withShare(url, shareSecret), {
        redirect: "manual",
        headers,
      });
      let location = res.headers.get("location") ?? "";

      if (
        res.status >= 300 &&
        res.status < 400 &&
        isSsoLocation(location) &&
        !triedShare
      ) {
        triedShare = true;
        shareSecret = await mintShareSecret(base);
        if (shareSecret) {
          console.log("Minted shareable link; retrying smoke through _vercel_share");
          res = await fetch(withShare(url, shareSecret), {
            redirect: "manual",
            headers,
          });
          location = res.headers.get("location") ?? "";
        }
      }

      const vercelError = res.headers.get("x-vercel-error");
      const extra = [
        vercelError ? `x-vercel-error=${vercelError}` : "",
        location ? `location=${location}` : "",
      ]
        .filter(Boolean)
        .join(" ");

      if (res.status >= 300 && res.status < 400 && isSsoLocation(location)) {
        console.log(
          `SKIP ${res.status} ${url}${extra ? ` ${extra}` : ""} SSO (preview protection; app status unobservable)`
        );
        continue;
      }

      if (res.status >= 300 && res.status < 400) {
        failed += 1;
        console.log(`FAIL ${res.status} ${url}${extra ? ` ${extra}` : ""}`);
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
