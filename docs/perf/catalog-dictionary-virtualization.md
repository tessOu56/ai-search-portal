# Perf note — catalog dictionary virtualization (T-2026-017 / T-064)

> Route: `/catalog-search/dictionary`
> **Virtual (default):** 100,000 rows parsed in a **Web Worker**; `@tanstack/react-virtual` window.
> **Baseline:** `?virtual=off` renders **10,000** naive DOM rows (same fixture slice — full 100k naive is not a fair baseline).

## What changed (T-064)

|                    | Baseline (`?virtual=off`, 10k) | Virtual (default, 100k + worker)                 |
| ------------------ | ------------------------------ | ------------------------------------------------ |
| Dataset size       | 10,000 rows (server loader)    | 100,000 rows (worker init)                       |
| DOM rows rendered  | 10,000 (all)                   | ~15–25 (viewport 560px / row 44px + overscan 10) |
| Parsing / filter   | main thread (loader)           | **Web Worker** (`dictionary.worker.ts`)          |
| Rendering strategy | full list                      | absolute-positioned window, translateY per row   |

URL contract: `?q=` and `?type=` keep the exact `/catalog-search` semantics;
the paginated `/catalog-search` route is untouched (no-regression acceptance).

## How to measure (locally, Chrome)

1. `pnpm dev` → open `/catalog-search/dictionary?virtual=off`
2. **DOM count**: `document.querySelectorAll('[data-row]').length` → expect **10000**
3. Open `/catalog-search/dictionary` (virtual on) → wait for `data-testid="worker-metrics"` ready
4. **DOM count** virtual → expect **≤40**
5. **Long tasks**: scroll ~5s; check `dictionary-long-task` observer / Performance panel — target **0 tasks >50ms** on main thread during scroll after worker ready
6. **Heap**: Memory snapshot after worker ready + scroll (see `catalog-dictionary-measured.json` memory section)
7. Automated: `pnpm exec playwright test --config=playwright.perf.config.ts`

## Measured results

| Metric                                  | virtual=off (10k naive) | virtual=on (100k worker) | Δ         |
| --------------------------------------- | ----------------------- | ------------------------ | --------- |
| `[data-row]` DOM nodes                  | **10000**               | **≤40** (target)         | **−99%+** |
| Worker init / filter (ms)               | n/a                     | _(see worker-metrics)_   | —         |
| Long tasks >50ms while scrolling (main) | _(baseline high)_       | **0** (target)           | —         |
| Heap retained after scroll (MB)         | _(fill locally)_        | _(fill locally)_         | —         |

> Run `e2e/dictionary-perf.measure.ts` to refresh `docs/perf/catalog-dictionary-measured.json`.

## Design notes

- Shared fixture: `dictionary.fixture.ts` (deterministic `buildDictionaryRow`).
- Virtual path: loader returns metadata only; worker owns 100k array off main thread.
- Naive baseline capped at 10k — comparing 100k DOM nodes is not meaningful.
- Row height fixed at 44px; `estimateSize` exact.

## Gate 2 / hygiene cross-refs

- Ticket: T-2026-064
- README perf card: update DOM delta row after measure run
- Memory leak follow-up: capability-alignment §5.3 — one heap curve per scenario
