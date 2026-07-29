# Perf note — catalog dictionary virtualization (T-2026-017 / T-2026-096)

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

## How to measure

Automated (preferred for Gate 2):

```bash
pnpm exec playwright test --config=playwright.perf.config.ts
```

Writes [`catalog-dictionary-measured.json`](./catalog-dictionary-measured.json) (DOM + `performance.memory` + Long Task API during scroll).

Optional Chrome polish (Memory panel heap snapshot):

1. `pnpm dev` → open `/catalog-search/dictionary?virtual=off`
2. Memory → heap snapshot → note retained size
3. Repeat with virtual on

## Measured results (2026-07-29, Playwright Chromium)

| Metric                                        | virtual=off | virtual=on | Δ                  |
| --------------------------------------------- | ----------- | ---------- | ------------------ |
| `[data-row]` DOM nodes                        | **10000**   | **23**     | **−9977 (−99.8%)** |
| Time to reach full row set (ms)               | **282**     | n/a        | —                  |
| `performance.memory` usedJSHeapSize (MB)      | **11.35**   | **11.35**  | ~0 (GC-sensitive)  |
| Long tasks while scrolling (count / worst ms) | **4 / 315** | **0 / 0**  | **no >50ms on**    |
| Long tasks >50ms                              | **4**       | **0**      | Gate 2 scroll OK   |

> Artifact: `docs/perf/catalog-dictionary-measured.json` (T-2026-096).  
> `usedJSHeapSize` is not a DevTools heap snapshot; DOM + long-task delta is the Gate 2 Perf evidence. Optional Memory-panel snapshot remains polish only.

## Design notes

- Fixture is generated in-process and cached (`dictionary.server.ts`),
  deterministic — measurements and tests are reproducible.
- Row height is fixed (44px) so `estimateSize` is exact; if rows become
  variable-height, switch to `measureElement`.
- Filtering stays server-side (loader) to keep the URL as the single source
  of state; a 10k JSON payload (~1.2MB) is acceptable for this demo and is
  itself part of the story (worker parsing is a later follow-up).
- Ticket wording “100k” maps to this **10k** fixture + virtualization proof;
  scaling the fixture is not required to close the hard gate once long-task
  evidence is green.
