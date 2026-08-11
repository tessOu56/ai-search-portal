# Web Vitals panel (T-2026-115, Pillar 4)

Local, offline-first Core Web Vitals — no backend, no analytics endpoint
required.

## What it is

- `app/lib/analytics/web-vitals-reporter.ts` subscribes to `onLCP` / `onINP` /
  `onCLS` from `web-vitals` and always mirrors each metric into
  `app/lib/analytics/vitals-store.ts` (in-memory `Map` + `sessionStorage`
  mirror, tab-scoped).
- `/vitals` (`app/routes/vitals.tsx`) reads that store via
  `useSyncExternalStore` and renders the latest LCP/INP/CLS with their
  rating (`good` / `needs-improvement` / `poor`) and standard thresholds.
- The event payload is a closed schema —
  `webVitalReportedEventSchema` in
  `packages/shared-contracts/src/analytics.contract.ts`
  (`name`, `value`, `rating`, `route`; `.strict()`, no free-form properties).

## Seeing it locally

```bash
pnpm dev
```

1. Open `http://localhost:5173/`, click around a few routes (LCP/CLS finalize
   as the page settles; INP needs at least one interaction).
2. Open `http://localhost:5173/vitals` — the last known value per metric for
   this browser tab is shown live and updates as new metrics land.
3. Cross-reference with the measured, scripted numbers for the catalog
   dictionary virtualization work in
   [`docs/perf/catalog-dictionary-measured.json`](./catalog-dictionary-measured.json)
   (Playwright-driven DOM/heap/long-task capture, not live web-vitals).

## Optional: aggregate P75 in PostHog

The local `/vitals` panel shows only _this tab's_ latest sample per metric —
useful for a live demo, not for a fleet-wide P75. To see an aggregate:

1. Set `VITE_ANALYTICS_ENABLED=1` (and optionally `VITE_ANALYTICS_ENDPOINT`)
   so `web-vitals-reporter.ts` also POSTs each metric (see
   `labs/observability/POSTHOG.md`).
2. Bring up the local capture stub / PostHog compose:

   ```bash
   docker compose -f labs/observability/docker-compose.posthog.yml up -d
   ```

3. Load several pages to accumulate samples, then view Web Vitals / Insights
   in PostHog (or the capture stub logs at `http://localhost:19000` for a
   quick sanity check that events are leaving the browser).

### Screenshot placeholder

_No screenshot captured yet — this repo intentionally avoids checking in a
live PostHog project screenshot until STOP-003 registration is resolved
(see `labs/observability/POSTHOG.md`). When available, add it here as:_

```markdown
![PostHog Web Vitals P75](./posthog-web-vitals-p75.png)
```
