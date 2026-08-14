# ai-search-portal — 執行計畫 2026 H2（互動產品主軸）

> 階段出口條件 SSOT：本 repo [`docs/PROJECT-PLAN.md`](./PROJECT-PLAN.md)（Phase 0–5，不變）

本檔不取代 PROJECT-PLAN 的 Phase 出口條件，而是在其上疊一條**「對外可互動產品」主軸**，把既有資產（測試、Zod 契約、agent-core、eval 管線）變成可實際操作的 public demo。

## 1. 在產品線中的角色

**旗艦 showcase**：完整可互動的 AI 搜尋／治理參考產品。相關 labs／姐妹專案的成果可選擇 promote 進來；本檔不依賴私有編排面。

## 2. 互動作品里程碑（新增主軸，全部走 `labs/` 不破壞 v1 契約）

| 里程碑                       | 內容                                                                                                                                          | 對應既有 ticket / Phase                 |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| M1 Agent 推理可視化          | SSE 串流不只串文字，串 reasoning / tool-call 事件（帶 latency）/ partial JSON 漸進渲染                                                        | Phase 2–3、呼應 token→agent stream 趨勢 |
| M2 三層 Guardrails demo 面板 | 輸入(Prompt Guard 風格標示 injection) / 工具(default-deny allowlist，角色不同可見工具不同) / 輸出(SSE 雙流早停紅標) 即時可視化，附 OWASP 標籤 | 既有 guardrails v2 + T-2026-020         |
| M3 可解釋 RAG                | 並排 dense-only vs hybrid 召回差異（用錯誤碼類 query 展示 dense 靜默失敗），標出引用來源，資訊不足誠實拒答                                    | Phase 3 Retriever 抽象                  |
| M4 GenUI（防禦性）           | tool-calling 回結構化資料 → 綁 React 元件渲染；Zod 驗證 + HITL 批准卡片                                                                       | T-2026-020 GenUI + HITL                 |
| M5 catalog-search 完成度     | 篩選 + 分頁 + 虛擬列表 perf（10k mock benchmark，產出量化數字補 ledger）                                                                      | T-2026-004 / T-2026-017                 |
| M6 Playwright E2E 基線       | 權限申請手動路徑 + 視覺回歸（補測試敘事缺口）                                                                                                 | T-2026-015                              |

## 3. 技術選型（趨勢對齊，主線穩定）

- 框架：**React Router v7 Framework Mode + SSR**（穩定）；RSC 僅 `labs/` spike。
- React **19.2**，漸進開啟 **React Compiler**（先 build 開、配 ESLint 規則）。
- 串流：維持 SSE；對齊 **Vercel AI SDK v5 Data Stream Protocol** 心智模型（start/delta/end、唯一 ID、取消/續傳/heartbeat、`X-Accel-Buffering: no`）。
- Agent 編排敘事：對標 **LangGraph 1.0 stateful**（checkpoint / HITL）；本 repo 以 agent-core 呈現等價概念。
- 契約：維持 **Zod 4 + OpenAPI 3.1**（openapi-typescript）；**勿**在 `app/**` 新增 `*.contract.ts`。
- 治理閘：CI 加 **Spectral lint + oasdiff** 破壞性變更檢查。
- 測試：**Vitest 4 + Playwright 1.59 + MSW 2**；可展示 Playwright MCP 自癒測試當亮點。
- GenUI：**避免 RSC `streamUI`（已暫停）**，改 tool-calling 綁元件。

## 4. 串接點

- **契約／labs**：catalog 欄位契約（如 `itemType` / `pageSize`）與 labs promote（動效進 `labs/motion/` 等）以本 repo specs 為準。
- **設計**：消費共用 **DTCG token → Tailwind**（explore-design-sdk）。
- **部署**：公開 live URL 見 README；私有編排 registry 更新屬 optional private notes，不寫死於此。

## 5. 部署（STOP 期間 / 解 STOP 後）

- 現況：本地 `pnpm dev` demo 為基準（STOP-001）。
- 解 STOP 後：**改評估 Cloudflare Workers + Static Assets**（邊緣 SSR、頻寬不限、無 Vercel Hobby 商用限制）取代原 Vercel 路線；DB/快取需求走 Neon / Upstash。

## 6. 不做

- 不在 `app/` 直接掛 WebGPU / 本機 LLM（走 Lab + promote）。
- 不複製內部參考 catalog 的五主線 UX。
- 不為趨勢採用未 GA 項目於主線（RSC / Vapor / TS7 一律 spike）。
