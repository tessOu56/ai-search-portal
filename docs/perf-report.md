# Performance — Core Web Vitals

Lab numbers for the CWV change (self-hosted fonts, static LCP headline).
Not a roadmap. Re-run after `pnpm run build`.

## Method

1. `pnpm run build` (React Router 7 production, mock-first, no Sentry DSN).
2. `PORT=4173 pnpm start`.
3. Desktop Lighthouse 13.5 (`pnpm run lighthouse`), simulated throttle,
   1280×720, Chromium from Playwright. Script: `scripts/lighthouse-report.mjs`.
4. Raw JSON under `reports/lighthouse/` (gitignored).
5. INP is not produced by a cold Lighthouse navigation. Field INP is
   `web-vitals` on `/vitals`.

Environment: Node 22, Linux VM, no CDN, HTTP/1.1 to localhost. Lab, not field P75.

## Before (main @ `057ae7e`) vs after

| Route             | Before perf / LCP / CLS | After perf / LCP / CLS |
| ----------------- | ----------------------: | ---------------------: |
| `/`               |          60 / 4.1 s / 0 |         67 / 2.9 s / 0 |
| `/catalog-search` |          67 / 3.0 s / 0 |         64 / 3.4 s / 0 |
| `/metadata`       |          67 / 3.0 s / 0 |         65 / 3.3 s / 0 |

Home observed LCP **623 → 310 ms**; render delay **587 → 284 ms**. Catalog /
metadata simulated scores moved within Lighthouse noise; unthrottled LCP
~150–190 ms.

Bottlenecks removed: LCP `h1` started at `opacity: 0`; unused
`/marketing/home-atmosphere.svg` preload; Google Fonts ~145 KB.

## How to re-run

```bash
pnpm run build
PORT=4173 pnpm start
LIGHTHOUSE_URL=http://127.0.0.1:4173 LIGHTHOUSE_STAMP=after pnpm run lighthouse
```
