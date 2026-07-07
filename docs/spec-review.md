# Spec Review 規範（開發前）

**類型**：spec | **權重**：1

本文件為 **feature / ticket 開工前**的規格審查標準，與 [code-review-spec.md](code-review-spec.md)（**階段後**規格對齊）互補、不重複。目的：先確認 spec 完整、無 drift、影響面清楚，再動程式碼。適用對象：**開發者**與 **AI（Coding / Review Agent）**。

Canonical workflow（工具無關、跨 repo）：[develop-md/ai-skills/spec-review/SKILL.md](https://github.com/tessOu56/develop-md/blob/main/ai-skills/spec-review/SKILL.md)。本文件只定義 portal 內的落地細節。

---

## 1. 使用時機

- 接到 platform-inbox ticket 或自發 feature，**寫第一行程式碼之前**。
- 變更涉及對外 HTTP 形狀、domain 狀態機、datacontract、policy 時**必做**；純文件或不動契約的小修可略過，但 PR 仍須填 spec impact。

## 2. 審查步驟（portal 版）

1. **讀上游**：[AGENTS.md](../AGENTS.md) → [specs/README.md](../specs/README.md) → 相關 [docs/adr/](adr/)、[specs/domain/](../specs/domain/)、[specs/datacontracts/](../specs/datacontracts/)。
2. **Drift 檢查**：
   - Zod（`packages/shared-contracts`）↔ `specs/openapi/openapi.yaml` 是否對齊（過渡期規則：先 Zod、再 OpenAPI）
   - `pnpm run verify:openapi-codegen`（generated 是否 stale）
   - [specs/api/handler-mapping.md](../specs/api/handler-mapping.md) ↔ `app/test/handlers.ts` 是否涵蓋
3. **缺漏檢查**：feature 需要但 spec 未定義的 domain rule、錯誤碼（`errorResponseSchema`）、權限規則（`specs/policies/`）。
4. **影響面與計畫**：impacted spec files、契約是否 breaking、implementation plan（spec → 契約 → codegen → 實作 → test）。
5. **裁決**：`ready` / `ready-with-notes` / `blocked`。**blocked＝先補 spec，不先寫碼。**

## 3. 產出與存放

- 報告依 [develop-md 模板](https://github.com/tessOu56/develop-md/blob/main/ai-skills/spec-review/templates/spec-review-report.md) 填寫，存 [code-review/spec-reviews/](../code-review/spec-reviews/)，檔名 `YYYY-MM-DD-<slug>.md`。
- 報告 §8（spec impact 摘要）於 PR 時貼入 PR template 對應欄位。
- 審查發現的既存問題若不在本 feature 範圍：登錄 `code-review/issues.md`（CR-xxx），不順手改。

## 4. 與其他制度的關係

| 制度                      | 時機             | 入口                                                 |
| ------------------------- | ---------------- | ---------------------------------------------------- |
| **Spec review（本文件）** | 開工前           | code-review/spec-reviews/                            |
| Code review               | 階段後 / PR 前   | [code-review-spec.md](code-review-spec.md) ＋ CR-xxx |
| Architecture review       | 季度 / wave 收尾 | develop-md `reports/architecture-reviews/`           |
| PR 守門                   | 每個 PR          | `.github/pull_request_template.md` spec impact 欄    |
