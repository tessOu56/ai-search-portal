# AI 體驗流程 × 可手動畫面 — 規劃 SSOT

> 決策日：2026-07-08 · 對齊：T-2026-020（Defensive GenUI + dual-path）、[DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)、[explore-design-sdk PROJECT-PLAN Phase 1](https://github.com/tessOu56/explore-design-sdk)
> 原則：**每一條 AI 流程都有對應的手動操作路徑**。AI 是加速器，不是唯一入口；AI 失敗、降級或使用者不信任時，同一任務可純手動完成。
> 上層定位與 agentic 分階段路線圖見 [agentic-integration-review.md](agentic-integration-review.md)（2026-07-09）。

## 1. 雙路徑（dual-path）原則

| 規則      | 說明                                                                                    |
| --------- | --------------------------------------------------------------------------------------- |
| 任務完備  | 每個使用者任務（搜尋、篩選、申請、建立、追蹤）都有手動 UI 可獨立完成，不依賴 LLM        |
| AI 可降級 | agent 逾時/guardrail 攔截/信心不足 → 自動退到手動畫面並保留使用者輸入（預填篩選、表單） |
| 狀態同步  | AI 路徑產生的中間狀態（篩選條件、表單草稿）寫入 URL/store，手動畫面可接手續作           |
| 可稽核    | AI 代填/代選的欄位有視覺標記，使用者可逐項確認或改寫                                    |
| E2E 雙軌  | 每條流程的 E2E 同時驗 AI 路徑與手動路徑（T-2026-020 既有方向，擴為全站規範）            |

## 2. 流程 × 畫面對照表

| 任務              | AI 路徑                                                          | 手動路徑                                         | 狀態                                                                                                                                       |
| ----------------- | ---------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 目錄搜尋          | LUI 對話（`api.chat` + agent-core SSE）→ 生成篩選條件 → 導向結果 | `/catalog-search` 篩選（`?type=` + 分頁）        | 手動 ✅ / AI→手動預填 ✅（2026-07-09：`AiFallbackPanel` 於 chat 失敗時帶 `?q=`+`?type=` 預填接手；URL 契約收斂於 `catalog-search-url.ts`） |
| 項目瀏覽/建立     | LUI 引導建立（草稿代填）                                         | `/items`、`/items/new` 表單                      | 手動 ✅ / AI 代填標記 ⬜                                                                                                                   |
| Metadata 存取申請 | `access-requests.evaluate` AI 預審 + 建議                        | 申請表單 + 人工送出（G1 flow）                   | AI 評估 ✅ / 申請畫面 ⬜（T-2026-023）                                                                                                     |
| 資產/血緣檢視     | LUI 問答（「這個資產上游是誰」）                                 | `/metadata/$assetId` + Lineage DAG（T-2026-016） | 手動 🔄                                                                                                                                    |
| Insights          | AI 摘要（依目前資訊 + 下一步）                                   | 圖表 + 手動 metric 選擇（`api.context.metrics`） | 手動 🔄                                                                                                                                    |
| Context pack 切換 | agent 依對話自動選 pack                                          | `pack-select` 手動指定                           | 兩者 ✅，缺 UI 標示 ⬜                                                                                                                     |

缺口優先序：① AI→手動預填（搜尋）✅（2026-07-09）② AI 代填視覺標記（items/申請）③ 降級 fallback 統一元件（`AiFallbackPanel`）✅ 首發（2026-07-09，chat 錯誤/斷線觸發；逾時與信心不足觸發待 T-2026-020）。

## 3. 外接元件系統（explore-design-sdk）接入

**決策（2026-07-08）**：portal 視覺層全面改用 explore-design-sdk，portal 不再自持 design tokens 與基礎元件。

| 階段                 | 內容                                                                                                                                                                                                                                                | 出口條件                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **S1 tokens** ✅     | 2026-07-08 完成：SDK `portal` map 對齊 portal 亮色主題 → `tokens.portal.css`（vendored generated）→ `app/tailwind.css` 只留 shadcn 橋接；`tailwind.config` 改 `var(--x)` 全值；`data-app="portal"` 掛 `<html>`；dark theme 暫留 portal（S2 移 SDK） | 視覺 diff 為零（值逐項對齊）、SDK CI `tokens:validate` 綠；**待本機 `pnpm dev` 目視確認** |
| **S2 components** 🔄 | 2026-07-08：`@explore-design/components` 已建（9 元件上移為 canonical，portal 端暫為 vendored 副本）；**和色色盤**換裝（生成り紙底 + 藍主色 + 紙紋理，見 DESIGN_SYSTEM.md 色盤段）。待 npm 發布後 portal 改 import、清空 `app/components/ui`        | portal `app/components/ui` 清空、typecheck/E2E 綠                                         |
| **S3 LUI 語義層**    | 評估 `shared/lui/*`（ChatBubble 等）：通用者入 SDK，產品專屬留 portal                                                                                                                                                                               | 邊界文件化於 DESIGN_SYSTEM.md                                                             |

限制：`components/shared/chat`、`components/app` 為產品組合層，**不外移**。Token canonical 從 portal repo 移轉為 SDK repo（DESIGN_SYSTEM.md「Token Source of Truth」段落隨 S1 改寫）。

## 4. 與生態的邊界

- 本文件不含任何公司鏡像業務內容與術語；展示一律用 food/recipe mock domain。
- 練習 repo（nx-playground、polyglot-labs 等）作為情境靈感來源，成熟能力經 SDK 或 contracts 引入，不直接複製碼。
- 進度回報：platform-command `planning/projects/ai-search-portal.md`。
