# Performance report — Core Web Vitals

**Type:** report · **Weight:** 3  
**Surface:** marketing (`/`) + product (`/catalog-search`, `/metadata`)  
**Date:** 2026-10-20

## Method

1. `pnpm run build` (React Router 7 production, mock-first, no Sentry DSN).
2. `PORT=4173 pnpm start` — `react-router-serve` on loopback.
3. Desktop Lighthouse 13.5 (`pnpm run lighthouse`), **simulated** throttling,
   1280×720, Chromium from Playwright.
4. Script: `scripts/lighthouse-report.mjs`. Raw JSON under
   `reports/lighthouse/` (gitignored).
5. INP is not produced by a cold Lighthouse _navigation_. A one-click
   Playwright sample (`scripts/measure-inp.mjs`) is recorded separately;
   field INP still comes from `web-vitals` on `/vitals`.

Environment: Node 22, Linux CI-style VM, no CDN, HTTP/1.1 to localhost.
Numbers are lab, not field P75.

## Before (main @ `057ae7e`, no font/LCP work)

| Route             | Perf |       LCP |                  INP |   CLS | Notes                                                                                                                    |
| ----------------- | ---: | --------: | -------------------: | ----: | ------------------------------------------------------------------------------------------------------------------------ |
| `/`               |   60 | **4.1 s** | n/a (no interaction) | 0.000 | LCP = `h1` “Ask about data…”; **587 ms element render delay** from opacity-0 motion; Google Fonts **145 KB** third-party |
| `/catalog-search` |   67 |     3.0 s |                  n/a | 0.000 | Same webfont chain                                                                                                       |
| `/metadata`       |   67 |     3.0 s |                  n/a | 0.000 | Same webfont chain                                                                                                       |

Observed (unthrottled) home LCP was ~623 ms; simulated LCP 4.1 s. Lab
score is dominated by LCP weight (25) + TBT.

Bottlenecks Lighthouse named:

- LCP node is the home `h1` (`font-display`), starting at `opacity: 0`.
- Unused preload: `/marketing/home-atmosphere.svg` (never painted).
- Unused Google Fonts CSS (~31 KB, 100% unused at first paint because of
  `media=print` swap) plus Inter/Petrona woff2 from `fonts.gstatic.com`.
- Unused `preconnect` to `fonts.gstatic.com`.

## After (this change)

| Route             |                      Perf | LCP | INP | CLS |
| ----------------- | ------------------------: | --: | --: | --: |
| `/`               | _(remeasure after build)_ |     |     |     |
| `/catalog-search` |                           |     |     |     |
| `/metadata`       |                           |     |     |     |

## What changed

1. **Do not animate the LCP `h1` / brand lockup** — they paint at full
   opacity. Secondary copy still uses motion and honors
   `prefers-reduced-motion`.
2. **Self-host latin Inter + Petrona** (`@fontsource/*`) with metric-matched
   fallbacks. Drop Google Fonts + unused Shippori (CJK uses system serif).
3. **Preload only LCP fonts** (Petrona 500, Inter 400). Extra weights swap
   in via `@font-face`.
4. **Remove the unused atmosphere SVG preload**.
5. Streaming SSR was already `onShellReady` (non-bots); kept. Root loader
   still avoids blocking on seed.

## How to re-run

```bash
pnpm run build
PORT=4173 pnpm start
LIGHTHOUSE_URL=http://127.0.0.1:4173 LIGHTHOUSE_STAMP=after pnpm run lighthouse
```
