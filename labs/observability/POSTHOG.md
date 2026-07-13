# PostHog / RUM spike (T-2026-058)

## Local compose

```bash
docker compose -f labs/observability/docker-compose.posthog.yml up -d
```

- Capture stub: `http://localhost:19000` (echoes request bodies — proves events leave the browser)
- Postgres reserved on `5434` for a later full PostHog image swap

## Portal wiring

- Event schemas: `packages/shared-contracts/src/analytics.contract.ts` (closed Zod; no free-text properties)
- Web Vitals helper: `app/lib/analytics/web-vitals-reporter.ts`
- Env:
  - `VITE_ANALYTICS_ENDPOINT` — POST target (default `http://localhost:19000`)
  - `VITE_ANALYTICS_ENABLED=1` — enable browser reporting

## Seeing P75

1. Enable reporter in the app shell (call `startWebVitalsReporting()` once on client load).
2. Load a few pages; watch capture stub logs for `LCP` / `INP` / `CLS` payloads.
3. For a real PostHog UI, replace `posthog-capture` with the official image and set project API key; P75 is under Web Vitals / Insights.

Sentry is intentionally out of scope until STOP registration.
