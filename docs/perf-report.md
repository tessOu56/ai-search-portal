# CWV lab (Lighthouse 13.5 desktop, simulated, `PORT=4173`)

| Route             | Before (`057ae7e`) |      After |
| ----------------- | -----------------: | ---------: |
| `/`               |     60 / LCP 4.1 s | 67 / 2.9 s |
| `/catalog-search` |         67 / 3.0 s | 64 / 3.4 s |
| `/metadata`       |         67 / 3.0 s | 65 / 3.3 s |

Home observed LCP 623→310 ms. Re-run: `PORT=4173 pnpm start` then `pnpm run lighthouse`.
