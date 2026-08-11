# Agentic 整合檢閱與路線圖 — Agent-Executable Portal

> 建立日：2026-07-09 · 對齊：[ai-experience-plan.md](ai-experience-plan.md)（dual-path SSOT）、[interface-roadmap.md](interface-roadmap.md)（R1–R4）、[../PROJECT-PLAN.md](../PROJECT-PLAN.md)（Phase 0–5）
> 依據：Gartner 2026-07 預測——至 2030 年約 2,340 億美元（約 20%）企業 SaaS 支出暴露於 agentic arbitrage；產品價值從「畫面功能」移向「能否被 Agent 安全、可控、可稽核地呼叫」。

## 0. 結論先講

本 portal 的定位不是「AI catalog」，而是：

> **Agent 可執行、人可接管、來源可驗證、權限可治理的資料與 API portal。**

檢閱結果：五大趨勢中，「規格與驗證」與「雙介面」基礎最強（CI 契約鏈、MCP gateway 已落地）；最大缺口在 **tool contract schema 化**與**審計實體化**——兩者正是「信任層」的地基，應優先於新增任何 AI 功能。

## 1. 五趨勢 × 現況對照

| #   | 趨勢                                  | 現況    | 證據（repo）                                                                                                                                                                                             | 主要差距                                                                                   |
| --- | ------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1   | 應用經濟學：賣可衡量任務結果，非 seat | 🔄 部分 | `labs/eval-runner/`（golden fixtures + CI `eval:offline`）可衡量任務成功率                                                                                                                               | 無 task-level 成效指標（執行次數、完成率、接手率）對外呈現；eval 不擋 PR                   |
| 2   | Context 是差異化，不是 UI             | 🔄 部分 | `content/context-packs/` + `api.context.*`、`specs/datacontracts/`、`catalog-search.dictionary`、`docs/architecture/ai-product/memory-policy.md`；~~glossary 未接入~~ ✅ 2026-08-11 已接入（見下方證據） | request history / 機構記憶未累積；policy 未接入 agent context（glossary 缺口已關閉）       |
| 3   | 雙介面：人 + Agent                    | ✅ 偏強 | dual-path SSOT（ai-experience-plan）、MCP gateway（`well-known.mcp[.]json` + 4 tools）、agent-core tool allowlist（5 tools）                                                                             | tool 只有 allowlist 字串，無 per-tool I/O schema、權限標籤、discovery metadata             |
| 4   | 信任與治理是產品本身                  | 🔄 部分 | OPA rego + in-process evaluator、HITL 確認卡（`MetadataAssetDetailView`）、輸入層 guardrails、source citation（`chat.contract.ts` sources）                                                              | `auditLogged` 僅為布林，**無 audit log 落盤與查詢**；guardrails 缺輸出層；RBAC 為模擬 role |
| 5   | 規格與驗證 > 純寫碼                   | ✅ 強   | OpenAPI+Zod 雙軌 SoT（ADR `spec-driven-contracts-and-sot.md`）、CI：Spectral + codegen drift check + rego tests + eval                                                                                   | tool contract 未納入同一條 Spec→Contract→Test 鏈                                           |

> **趨勢 2 gap closed（glossary）— 2026-08-11 / T-2026-071**：`scripts/sync-domain-glossary.mjs` 把 `platform-command/specs/domain/*.yaml`（engineering + pm，48 terms）冪等同步進 `content/context-packs/ecosystem-glossary/glossary.json`；`packages/agent-core/src/rag/local-store.ts` 的 `resolveRagCorpus()` 在 `includeDefaults`（預設）時把此 pack 併入**每一個** RAG corpus（不論當前 active pack 為何），所以 LUI 隨時可檢索到生態詞彙。每筆 glossary entry 帶 `source`（如 `platform-command:specs/domain/pm.yaml#sprint`），經 `LocalDoc.source` → `LuiSource.source` → `luiSourceSchema`（`chat.contract.ts`）一路透傳到 `internal.final`/`final` SSE 事件，`ChatInterface.tsx` 在來源連結下方顯示該引用字串。剩餘缺口（policy 未接入、機構記憶）維持開放，見上表。

## 2. 三層架構對照

### 2.1 Human Control Plane（人可監督、接管）

| 能力                         | 現況                                                                       |
| ---------------------------- | -------------------------------------------------------------------------- |
| Chat / LUI + 降級接手        | ✅ `ChatInterface` + `AiFallbackPanel`（失敗帶 `?q=`+`?type=` 預填手動頁） |
| Catalog / 篩選 / 字典        | ✅ `/catalog-search`（URL 契約 `catalog-search-url.ts`）                   |
| 資產詳情 + 血緣              | 🔄 `metadata.$assetId`；DAG 視覺化 T-2026-016                              |
| 申請追蹤 / 審核中心          | ⬜ 申請畫面 T-2026-023；審核中心未規劃為獨立頁                             |
| Audit log 檢視頁             | ⬜ 無（依賴 §3 階段五）                                                    |
| 全站導覽 / Dashboard         | ⬜ interface-roadmap R1                                                    |
| Developer Hub / API explorer | ⬜ interface-roadmap R3（`/developers/apis/$apiId` 純規劃）                |

### 2.2 Agent Tool Layer（Agent 可呼叫）

| 能力                                | 現況                                                                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 內部 tools（allowlist + 執行器）    | ✅ `items.lookup` `metadata.lookup` `context.resolve_metric` `context.bindings` `rag.search`（經 Zod 契約 parse、timeout、env gate） |
| MCP tools                           | ✅ `metadata.search` `metadata.get` `metadata.lineage` `policy.evaluate`（stateless，lineage >6 節點走 async task）                  |
| per-tool I/O schema + 權限/審計標籤 | ⬜ tool-boundary.md 標「預留」；MCP arguments 為寬鬆 `z.record`                                                                      |
| 申請類 tools（draft / submit）      | ⬜ route 已有（`api.metadata.access-requests*`）但未包成 agent tool                                                                  |
| Tool discovery（能力目錄）          | 🔄 MCP discover 有 tool 清單，缺 schema 與風險層級註記                                                                               |

### 2.3 Trust & Governance Layer（不亂做事）

| 能力                             | 現況                                                        |
| -------------------------------- | ----------------------------------------------------------- |
| Policy check（OPA）              | ✅ `specs/policies/access-request.rego` + evaluator + tests |
| HITL（need_approval → 人工確認） | ✅ 申請流程有；未泛化為「風險層級 × 動作」框架              |
| 輸入 guardrails                  | ✅ `tools/guardrails.ts`（長度、prompt-injection）          |
| 輸出 guardrails / PII 遮罩應用   | ⬜ `mask_fields` 決策存在，未應用於 tool 輸出；R4 M2        |
| Source citation                  | ✅ `luiSourceSchema` + final 事件 sources                   |
| Audit trail（落盤、可查）        | ⬜ 僅 response 布林                                         |
| 離線評測                         | ✅ eval-runner + CI；⬜ 不擋 PR                             |
| Observability                    | 🔄 Langfuse env-gated no-op，trace 待 Phase 2               |
| 真實 auth / RBAC                 | ⬜ 刻意維持 role 模擬（roadmap 明示）                       |

## 3. 五階段路線圖（對齊既有 Phase / R / T）

原則：**不追 fully autonomous**。每階段的 agent 能力提升，必須伴隨同等的治理能力，否則不進下一階段。

### 階段一：來源可驗證的 AI 搜尋 — ✅ 大致完成，收尾

回答必附來源，資料來自 catalog / spec / policy，非模型生成。

- 待補：AI 代填視覺標記（缺口②）、`AiFallbackPanel` 逾時與信心不足觸發（T-2026-020）。
- **驗收**：六條 dual-path 任務的 AI 路徑皆帶 sources；E2E 雙軌覆蓋；eval golden set 涵蓋「無來源即失敗」案例。

### 階段二：Tool contract schema 化 — 🔄 最優先

把 allowlist 升級為 tool registry：每個 tool 定義 Zod I/O schema、timeout、**風險層級（low / medium / high）**、所需 role、是否需 HITL、是否強制 audit。落實 tool-boundary.md 的預留設計。

- 新增契約：`packages/shared-contracts/src/tool.contract.ts`（遵守「app/** 不新增 contract」邊界）。
- MCP `z.record` 換成 per-tool schema；discover 回傳 schema + 風險註記。
- 申請能力包成 tools：`access_request.draft`（medium）、`access_request.submit`（high, HITL 必停）。
- **驗收**：registry 內無 schema 的 tool 無法註冊（型別層擋）；CI 契約鏈涵蓋 tool contract（codegen drift check 同款手法）。

### 階段三：HITL 泛化 — 依賴階段二

從「申請流程專用」泛化為「風險層級驅動」：low 直接執行、medium 產生草稿、high 停下等人 approve / edit / reject。

- 申請畫面（T-2026-023）+ 審核中心頁（Human Control Plane 補位）。
- AI 代填欄位視覺標記全站化（缺口②延伸）。
- **驗收**：high-risk tool 無人工確認即無法執行（伺服器端強制，非 UI 擋）；E2E 驗 approve / edit / reject 三徑。

### 階段四：MCP / OpenAPI 對外化 — 🔄 已起步，補治理再開放

MCP gateway 已存在；對外開放前先補齊階段二、三，否則等於輸出無治理的能力。

- Developer Hub（R3）：`/developers` API explorer + try-it sandbox（fork-on-write，見 interface-roadmap §4.4），讓「人的 API 文件」與「Agent 的 MCP discover」同源。
- 外部 agent 接入的 identity 傳遞（即使 role 仍模擬，介面先定義）。
- **驗收**：外部 AI workspace 可經 MCP 完成「搜尋 → 查血緣 → 政策預審 → 申請草稿」全鏈，且 high-risk 步驟停在 HITL。

### 階段五：治理與審計產品化 — ⬜ 企業真正買單的部分

- Audit log 實體化：execution log、policy decision log（含 `decision_id`）、approval history、source trace 落盤 + 查詢 API + 檢視頁。
- 輸出層 guardrails：`mask_fields` 實際應用於 tool 輸出；guardrails 三層面板（R4 M2）。
- eval 擋 PR（PROJECT-PLAN Phase 2 待辦轉必辦）；Langfuse trace 常態化。
- 成效指標對外：任務完成率、接手率、平均 HITL 介入次數（回應趨勢 1）。
- **驗收**：任一 agent 行動可回答「依據什麼、誰批准、結果如何、失敗怎麼接手」四問。

## 4. 立即行動（本週可動工）

1. `tool.contract.ts` 草稿 + registry 型別改造（階段二地基，不動行為）。
2. Audit log 最小落盤：先寫 JSONL / in-memory store + `api.audit` 查詢 route，讓 `auditLogged` 不再是空頭布林（階段五提前拉一小塊，成本低、敘事價值高）。
3. ai-experience-plan 缺口②（AI 代填視覺標記）與 T-2026-023 申請畫面照原優先序推進——它們同時是階段一收尾與階段三前置。

## 5. 反面校正（避免走偏）

- 不是「加聊天框」：chat 已有，價值在 tool contract 與治理。
- 不是「先做 fully autonomous」：每階段 agent 能力 ≤ 治理能力。
- 不是「MCP = 企業治理」：MCP 只是介面標準；治理在階段二、三、五。
- 不是「UI 不重要」：UI 轉為監督面、接管面、稽核面——R1 導覽、審核中心、audit 檢視頁都是這個角色。
