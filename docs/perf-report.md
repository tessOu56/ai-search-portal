# CWV lab (Lighthouse 13.5 desktop viewport, simulated, `PORT=4173`)

Median of 5 runs. Re-run: `PORT=4173 pnpm start` then `LIGHTHOUSE_RUNS=5 pnpm run lighthouse`.

| Route             | Before (`057ae7e`) |      After |
| ----------------- | -----------------: | ---------: |
| `/`               |     60 / LCP 4.1 s | 67 / 3.1 s |
| `/catalog-search` |         67 / 3.0 s | 69 / 2.8 s |
| `/metadata`       |         67 / 3.0 s | 69 / 2.8 s |

After scores: `/` 67/63/65/67/67; `/catalog-search` 69/72/69/69/70; `/metadata` 70/69/69/69/69. CLS ≤ 0.002 on all three. INP is empty in this lab (no Event Timing).
