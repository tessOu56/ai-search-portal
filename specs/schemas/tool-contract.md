# Tool contract — agent tool 註冊規格

> SoT：`packages/shared-contracts/src/tool.contract.ts`（Zod，程式層 SoT，同 ADR spec-driven-contracts-and-sot）。本文件描述模型與治理不變式；欄位以 Zod schema 為準。

## 模型

每個 agent tool 註冊時必須提供：

| 欄位               | 說明                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `name`             | 點分小寫（`items.lookup`），對齊 allowlist 與 MCP tool 命名           |
| `description`      | 供 discover 顯示                                                      |
| `riskLevel`        | `low` 直接執行 / `medium` 產生草稿 / `high` 必停 HITL                 |
| `requiresHitl`     | 執行前需人工確認（伺服器端強制）                                      |
| `forceAudit`       | 執行必寫 audit log                                                    |
| `requiredRoles`    | 可選，對齊 `userRoleSchema`                                           |
| `timeoutMs`        | 執行逾時                                                              |
| `input` / `output` | Zod schema，**無 schema 無法註冊**（`defineToolContract` 型別層強制） |

## 治理不變式

1. `riskLevel === "high"` ⇒ `requiresHitl === true`（schema superRefine 強制，違反無法 parse）。
2. registry（`packages/agent-core/src/tools/registry.ts`）鍵集 = `agentToolNameSchema` 選項 = `DEFAULT_ALLOWED_TOOLS`，由 `registry.test.ts` 交叉驗證。
3. 對外行為與 allowlist 時代一致；本規格為階段二地基，不改執行路徑。

## 後續（規劃，未實作）

- 階段三：`access_request.draft`（medium）、`access_request.submit`（high，HITL 必停）包成 tool。
- 階段四：MCP discover 回傳 `listToolMetadata()`（serializable）+ per-tool schema，取代 `z.record` 寬鬆 arguments。
- 相關：audit 事件契約 `audit.contract.ts`（`auditLogged` 已於 2026-07-09 實體化為真實寫入結果，見 `app/services/audit-log.server.ts`）。
