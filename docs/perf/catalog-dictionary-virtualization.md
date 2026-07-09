# Perf note — catalog dictionary virtualization (T-2026-017)

> Route: `/catalog-search/dictionary` (10,000 deterministic mock rows)
> Baseline toggle: `?virtual=off` renders the naive full list on the SAME data
> and filters, so before/after is measured apples-to-apples.

## What changed

|                    | Before (`?virtual=off`)                | After (default, `@tanstack/react-virtual`)       |
| ------------------ | -------------------------------------- | ------------------------------------------------ |
| DOM rows rendered  | 10,000 (all)                           | ~15–25 (viewport 560px / row 44px + overscan 10) |
| Rendering strategy | full list, browser layout on every row | absolute-positioned window, translateY per row   |
| Pagination         | none (this view)                       | none — replaced by virtual scroll                |

URL contract: `?q=` and `?type=` keep the exact `/catalog-search` semantics;
the paginated `/catalog-search` route is untouched (no-regression acceptance).

## How to measure (locally, Chrome)

1. `pnpm dev` → open `/catalog-search/dictionary?virtual=off`
2. **DOM count**: DevTools console
   `document.querySelectorAll('[data-row]').length` → expect 10000
3. **Initial render**: Performance panel → reload with recording →
   note scripting + rendering time for first paint of the list
4. **Heap**: Memory panel → heap snapshot after load → note retained size
5. **Scroll responsiveness**: Performance panel → record while scrolling the
   list for ~5s → check for long tasks (>50ms) and dropped frames
6. Repeat 2–5 on `/catalog-search/dictionary` (virtual on) and fill the table

## Measured results (fill after local run)

| Metric                                        | virtual=off                           | virtual=on     | Δ                  |
| --------------------------------------------- | ------------------------------------- | -------------- | ------------------ |
| `[data-row]` DOM nodes                        | **10000**                             | **23**         | **−9977 (−99.8%)** |
| Time to reach full row set (ms)               | **70** (waitForFunction after paint)  | n/a (windowed) | —                  |
| First render scripting+rendering (ms)         | _(optional Chrome Performance panel)_ |                |                    |
| Heap retained (MB)                            | _(optional heap snapshot)_            |                |                    |
| Long tasks while scrolling (count / worst ms) | _(optional)_                          |                |                    |

> Measured 2026-07-09 via `playwright.perf.config.ts` → `e2e/dictionary-perf.measure.ts`
> (artifact: `docs/perf/catalog-dictionary-measured.json`). DOM-node delta is the
> Gate 0 acceptance number; Chrome Performance/heap panels remain optional resume polish.

## Design notes

- Fixture is generated in-process and cached (`dictionary.server.ts`),
  deterministic — measurements and tests are reproducible.
- Row height is fixed (44px) so `estimateSize` is exact; if rows become
  variable-height, switch to `measureElement`.
- Filtering stays server-side (loader) to keep the URL as the single source
  of state; a 10k JSON payload (~1.2MB) is acceptable for this demo and is
  itself part of the story (worker parsing is the Phase 2 follow-up).
