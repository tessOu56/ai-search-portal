# Agent Profile — ai-search-portal

> **GENERATED — do not edit.** 產生器：`scripts/build-agent-profiles.py`；業務維度 SSOT：`registry/business-profiles.json`；其餘由既有 registry 合成。
> 來源版本：business-profiles 2026-07-09 · agent-assets 2026-07-09 · domain-spec unknown
> ⚠️ 業務維度為 **draft**，owner 確認後轉 confirmed。

## 業務（為何存在）

- **問題**：資料使用者找不到、看不懂、不敢用內部資料；申請存取流程慢且不透明；AI 幫忙時無法驗證依據與權限。
- **使用者**：資料分析師、資料管理員（審核者）、工程師（API 消費者）、外部 AI agent（經 MCP）
- **價值主張**：Agent 可執行、人可接管、來源可驗證、權限可治理的資料與 API portal——AI 加速但永遠能降級手動，每步可稽核。
- **成功指標**：任務完成率、AI 失敗接手率（fallback taken）、HITL 介入次數、eval pass rate、E2E 雙軌綠

## 詞彙（這個 repo 說什麼語言）

| 詞                | 定義                  | 生態對照 |
| ----------------- | --------------------- | -------- |
| `dual-path`       | ⚠️ domain spec 未收錄 | —        |
| `hitl`            | ⚠️ domain spec 未收錄 | —        |
| `tool-contract`   | ⚠️ domain spec 未收錄 | —        |
| `risk-level`      | ⚠️ domain spec 未收錄 | —        |
| `audit-trail`     | ⚠️ domain spec 未收錄 | —        |
| `source-citation` | ⚠️ domain spec 未收錄 | —        |
| `context-pack`    | ⚠️ domain spec 未收錄 | —        |
| `offline-eval`    | ⚠️ domain spec 未收錄 | —        |

## 技術（agent 可用什麼）

- **進場檔**：agentsMd、agentCapabilitiesMd
- **Skills**：`portal-contract-change`（改 API/SSE/OpenAPI/shared-contracts 時 spec-first + eval）；`portal-lab-boundary`（labs/WebGPU/WASM 觸碰時守 v1 契約邊界）；`portal-phase-work`（階段工作先讀 PROJECT-PLAN 再定範圍）
- **Rules**：collaboration-architecture、data-test-driven、project-standards、spec-driven-workflow、spec-review
- **Code graph**：turbo.json + pnpm-workspace
- **能力域（capabilities.json owner）**：LUI 搜尋產品（Catalog 搜尋、Agent SSE 串流、Local RAG、Guardrails v2、離線 Eval、Identity 接入示範（passkey + GitHub 登入）、Notification email 模板（MJML））

## 目標（現在往哪走）

- **currentFocus**：Gate 0 Wave A done (2026-07-09): T-004/015/017 — dual-path + E2E 4 green + 10k virtual −99.8% DOM · Next: Journey C polish / T-020 dual-path E2E depth (Wave B) · career: senior-architecture-roadmap Wave B
- **中央規劃**：`planning/projects/ai-search-portal.md`

## 邊界（不要做什麼）

- 依該 repo `AGENTS.md` 禁止段與 `planning/projects/ai-search-portal.md`「不做」清單為準。
- 備註：旗艦產品線；業務敘事對齊 docs/product/agentic-integration-review.md §0
