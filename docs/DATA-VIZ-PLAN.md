# 資料視覺化規劃（Data Viz Plan）

> 2026-07-07 初版。目標：讓用戶在 portal 內以圖表檢視 catalog / 搜尋資料，並提供圖表類型選項。

## 目標

1. 新增 `/insights` 頁：用戶可視覺化檢視資料（項目分布、搜尋趨勢、類型佔比）。
2. 提供圖表選項：bar / line / pie 可切換，之後擴充 area、table 檢視。
3. 架構上與既有 feature 模式一致（`app/features/insights/`），可漸進接上真實資料。

## 選型

| 候選                       | 評估                                                                | 結論             |
| -------------------------- | ------------------------------------------------------------------- | ---------------- |
| **recharts**               | React 原生宣告式、與 nx-playground 生態一致、SSR 需 ClientOnly 包裝 | ✅ 採用 `^3.8.1` |
| chart.js + react-chartjs-2 | canvas 效能好，但命令式 config、與 Tailwind 主題整合較繞            | 備選             |
| visx                       | 最靈活但要自組，POC 成本高                                          | 不採用           |
| ECharts                    | 功能最全但 bundle 大，portal 用不到地圖/3D                          | 不採用           |

Flow/節點圖需求（如 agent pipeline 視覺化）另用 `@xyflow/react`，不混入本規劃；先在 nx-playground event-cms 驗證後再評估移植。

## 資訊架構

```
app/routes/insights._index.tsx      # /insights 路由（meta + loader）
app/features/insights/
  ├── InsightsPanel.tsx             # 主面板：圖表類型切換 + 圖表渲染
  ├── insights.mock.ts              # Phase 1 mock 聚合資料
  └── index.ts
```

- 圖表在 `ClientOnly`（remix-utils）內渲染，避免 SSR window 依賴。
- 圖表類型狀態放 URL searchParam（`?chart=bar`）以利分享連結（POC 先用 useState，Phase 2 收斂到 URL）。

## 資料流（分期）

- **Phase 1（本次 POC）**：mock 聚合資料（`insights.mock.ts`），驗證 UI 與切換體驗。
- **Phase 2**：loader 端聚合真實資料 — 復用 `catalog-search.server.ts` 資料源，輸出 `{ label, value }[]` 契約，型別進 `packages/shared-contracts`。
- **Phase 3**：後端 metrics API（`api.insights.ts`），支援時間區間 / 類型篩選參數；快取於 loader。

## 待辦（Phase 2 起）

- [ ] i18n：`insights.*` 翻譯鍵（zh-TW / en），套 `getTranslations` 既有模式
- [ ] SEO：`buildSeoMeta` + JSON-LD（比照 catalog-search）
- [ ] 導覽入口：sidebar / 首頁加 `/insights` 連結
- [ ] 測試：InsightsPanel smoke test（比照 `catalog-search.smoke.test.tsx`）
- [ ] a11y：圖表加 `role="img"` + 摘要文字（eslint-plugin-jsx-a11y 已啟用）
