# Tool Boundary

**類型**：reference | **權重**：2

## 原則

- Tool **allowlist** 置於 Agent 層（`@ai-search-portal/agent-core` registry）。
- 每個 tool：**名稱**、**輸入／輸出 Zod schema**、**timeout**、**所需權限／審計標籤**（預留）。

## 禁止

- Tool **直連資料庫／ORM**。
- 繞過 domain-facing API／契約的讀寫。

## 實作位置

- 註冊表：`packages/agent-core/src/tools/registry.ts`
- Guardrails 勾子（PII／injection）：`packages/agent-core/src/tools/guardrails.ts`（可擴充）

## 與 RAG

- RAG 當作一組 **內部步驟**（retrieve → rerank → compose），對外仍只暴露穩定 `token`／`final`，不暴露 raw retrieval trace。
