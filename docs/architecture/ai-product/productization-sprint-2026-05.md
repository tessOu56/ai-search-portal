# Productization sprint（2026-05）

**類型**：reference | **權重**：3

在 v1 mock 與 agent 管線穩定後，本衝刺聚焦 **可觀測性 → 評測 → 設計對齊 UI**，不阻塞既有 chat 契約。

## 現況（2026-05-19）

| 能力              | 狀態        | 位置                                                 |
| ----------------- | ----------- | ---------------------------------------------------- |
| Guardrails v2     | ✅          | `packages/agent-core/src/tools/guardrails.ts`        |
| RAG stub + local  | ✅ 部分     | `packages/agent-core/src/rag/`                       |
| Langfuse trace    | ✅ SDK      | `packages/agent-core/src/observability/langfuse.ts`  |
| Offline eval      | ✅ MVP + CI | `labs/eval-runner/`                                  |
| items.lookup tool | ✅          | `packages/agent-core/src/tools/execute.ts`           |
| design-vibe GAP   | 📋 規劃     | `labs/design-vibe/GAP-REPORT.md`                     |
| catalog-search UI | ✅ 殼       | `/catalog-search` + `CatalogSearchPanel` placeholder |

## Sprint 任務

### 1. Langfuse（本週）

- [x] `beginChatTrace`：trace + RAG spans + `lui-mock` generation + guardrail error
- [x] CLI 驗證：`pnpm run observability:up` + `pnpm run observability:smoke`（見 `labs/observability/README.md`）
- [ ] 本地 UI 確認：compose 後一筆 chat trace 出現在 Langfuse UI
- [x] agent-runtime README 補 Langfuse / RAG / tools env

### 2. Eval 強化

- [x] `eval-runner`：`AGENT_RAG_MODE=local` 與 `expectRag` 案例（run-case 自動設定）
- [x] 分數匯出 `reports/eval-*.json` 納入 CI artifact
- [x] W2：`items.lookup` 真實呼叫 Items API（`AGENT_EXECUTE_TOOLS` / `ITEMS_API_URL`）；CI `eval:offline`

### 3. design-vibe P0

- [ ] Figma MCP：填 GAP 表 **Figma node** 欄
- [x] Portal：`app/features/catalogsearch` 最小殼（`/catalog-search` + `CatalogSearchPanel` + smoke test）

## 環境變數（Langfuse）

```env
LANGFUSE_HOST=http://localhost:3001
LANGFUSE_PUBLIC_KEY=pk-...
LANGFUSE_SECRET_KEY=sk-...
```

未設定時 agent-core **完全 no-op**，不影響本地 dev 與 CI。

## 相關文件

- [productization-roadmap](./productization-roadmap.md) — Phase 5 長期
- [labs/observability/README](../../../labs/observability/README.md)
- [local-dev runbook](../../runbooks/local-dev.md)
