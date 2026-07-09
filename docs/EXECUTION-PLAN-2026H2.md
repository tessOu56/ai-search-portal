# ai-search-portal — 執行計畫 2026 H2（互動產品主軸）

> 策略 SSOT：[platform-command/planning/EXECUTION-PLAN-2026H2.md](https://github.com/tessOu56/platform-command/blob/main/planning/EXECUTION-PLAN-2026H2.md)
> 階段出口條件 SSOT：本 repo [`docs/PROJECT-PLAN.md`](./PROJECT-PLAN.md)（Phase 0–5，不變）
> 技術雷達：[platform-command/planning/EXECUTION-PLAN-2026H2-tech-radar.md](https://github.com/tessOu56/platform-command/blob/main/planning/EXECUTION-PLAN-2026H2-tech-radar.md)

本檔不取代 PROJECT-PLAN 的 Phase 出口條件，而是在其上疊一條**「對外可互動產品」主軸**，把既有資產（21 測試、7 Zod 契約、agent-core、eval 管線）變成面試官能實際操作的 demo。

## 1. 在產品線中的角色

**主軸 A 旗艦產品**。對外唯一的「完整可互動 AI 搜尋產品」。後端（py-able-labs / polyglot-labs）、動效（vue-motion）、學習（ai-dev-studio）的成果都往這裡匯流。

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

- **上游**：py-able-labs（itemType/pageSize、catalog 契約 parity）；polyglot-labs（多語言/SRE 敘事，唯讀參考）；vue-motion（promote 動效進 `labs/motion/`）。
- **設計**：消費共用 **DTCG token → Tailwind v4 `@theme`**（與 vue 線視覺統一）。
- **下游**：完成後登錄 `platform-command/registry/projects.json` 的 `deploy.url`，由 command-center 對外展示。

## 5. 部署（STOP 期間 / 解 STOP 後）

- 現況：本地 `pnpm dev` demo 為基準（STOP-001）。
- 解 STOP 後：**改評估 Cloudflare Workers + Static Assets**（邊緣 SSR、頻寬不限、無 Vercel Hobby 商用限制）取代原 Vercel 路線；DB/快取需求走 Neon / Upstash。

## 6. 不做

- 不在 `app/` 直接掛 WebGPU / 本機 LLM（走 Lab + promote）。
- 不複製內部參考 catalog 的五主線 UX。
- 不為趨勢採用未 GA 項目於主線（RSC / Vapor / TS7 一律 spike）。
