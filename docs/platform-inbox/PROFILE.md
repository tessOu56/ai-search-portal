# Agent Profile — ai-search-portal

> **GENERATED — do not edit.** 產生器：`scripts/build-agent-profiles.py`；業務維度 SSOT：`registry/business-profiles.json`；其餘由既有 registry 合成。
> 來源版本：business-profiles 2026-08-07 · agent-assets 2026-08-07 · domain-spec 2026-07-09
> ⚠️ 業務維度為 **draft**，owner 確認後轉 confirmed。

## 業務（為何存在）

- **問題**：資料使用者找不到、看不懂、不敢用內部資料；申請存取流程慢且不透明；AI 幫忙時無法驗證依據與權限。
- **使用者**：資料分析師、資料管理員（審核者）、工程師（API 消費者）、外部 AI agent（經 MCP）
- **價值主張**：Agent 可執行、人可接管、來源可驗證、權限可治理的資料與 API portal——AI 加速但永遠能降級手動，每步可稽核。
- **成功指標**：任務完成率、AI 失敗接手率（fallback taken）、HITL 介入次數、eval pass rate、E2E 雙軌綠

## 詞彙（這個 repo 說什麼語言）

| 詞                     | 定義                                                                                       | 生態對照                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| **Dual-path**          | 每條 AI 流程都有等價手動路徑，AI 失敗可帶狀態接手。                                        | portal docs/product/ai-experience-plan.md（SSOT）、AiFallbackPanel                    |
| **Human-in-the-loop**  | 高風險步驟強制停下等人批准/修改/拒絕，伺服器端強制。                                       | access request need_approval 確認流；tool contract requiresHitl                       |
| **Tool contract**      | agent tool 的註冊契約——I/O schema、風險層級、HITL、audit、timeout 缺一不可。               | portal packages/shared-contracts/src/tool.contract.ts、specs/schemas/tool-contract.md |
| **Risk level**         | tool 動作的風險分級（low 直接執行 / medium 產草稿 / high 必停 HITL）。                     | tool.contract.ts riskLevel + superRefine 不變式（high ⇒ HITL）                        |
| **Audit trail**        | 每個 agent 行動可回答「依據什麼、誰批准、結果如何、失敗怎麼接手」。                        | audit.contract.ts + audit-log.server.ts + api.audit（最小落盤 2026-07-09）            |
| **Source citation**    | AI 回答必附可驗證來源，無來源即失敗。                                                      | chat.contract luiSourceSchema、final 事件 sources                                     |
| **Context pack**       | 供 agent 使用的領域脈絡包（glossary/metrics/bindings），可切換（本生態自有詞，反向收錄）。 | portal content/context-packs/ + api.context.*（ADR context-pack-domain-binding）      |
| **Offline evaluation** | 以固定 golden 資料集離線驗證 agent 行為回歸。                                              | portal labs/eval-runner + CI eval:offline                                             |

## 技術（agent 可用什麼）

- **進場檔**：agentsMd、agentCapabilitiesMd
- **Skills**：`portal-contract-change`（改 API/SSE/OpenAPI/shared-contracts 時 spec-first + eval）；`portal-lab-boundary`（labs/WebGPU/WASM 觸碰時守 v1 契約邊界）；`portal-phase-work`（階段工作先讀 PROJECT-PLAN 再定範圍）
- **Rules**：collaboration-architecture、data-test-driven、project-standards、spec-driven-workflow、spec-review
- **Code graph**：turbo.json + pnpm-workspace
- **能力域（capabilities.json owner）**：LUI 搜尋產品（Catalog 搜尋、Agent SSE 串流、Local RAG、Guardrails v2、離線 Eval、Identity 接入示範（passkey + GitHub 登入）、Notification email 模板（MJML））

## 目標（現在往哪走）

- **currentFocus**：Flagship LIVE — T-023/T-068 done; next T-069 eval PR gate · Human ops: T-079 VERCEL_* secrets; T-114 Pages settings · Remix BFF = production owner; Hono = reference (backend-next) · Local-dev priority (see registry/local-dev-set.json)
- **中央規劃**：`planning/projects/ai-search-portal.md`

## 邊界（不要做什麼）

- 依該 repo `AGENTS.md` 禁止段與 `planning/projects/ai-search-portal.md`「不做」清單為準。
- 備註：旗艦產品線；業務敘事對齊 docs/product/agentic-integration-review.md §0
