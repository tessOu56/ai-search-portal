# Stable Chat Contract（對外 SSE）

**類型**：reference | **權重**：2

## HTTP

- **路徑**：`GET /api/chat`
- **Query**：`q`（必填）；`sessionId`（選填，Phase 4 記憶用保留）

Zod：`chatQueryParamsSchema` — [`packages/shared-contracts/src/chat.contract.ts`](../../../packages/shared-contracts/src/chat.contract.ts)。

## SSE（前端可依賴 — 穩定層）

事件順序（與 [lui-search.md](../../product/lui-search.md) 相容）：

1. `meta` — JSON：`query`、`summary`、`confidence`；可選 `traceId`（除錯，UI 可不顯示）。
2. `token` — **純文字** chunk（非 JSON）。
3. `final` — JSON：`sources[]`、`nextSteps[]`。
4. `done` — 字串 `done` 或空 payload。

可選：

- `failure` — JSON：`{ "message": string, "code"?: string }`（應用層錯誤；**不用**事件名 `error` 以免與 `EventSource` 連線錯誤混淆）。

## 內部層（不可直出給前端）

- Agent／broker 使用 **`internal.*`** 事件名與 payload（見 [specs/events/chat-stream.md](../../../specs/events/chat-stream.md)）。
- Gateway 負責 **映射** → 穩定层；映射函式：`mapInternalSseToStable` — `packages/shared-contracts`。

## 錯誤

- HTTP 400：缺少 `q`（文字訊息或 JSON 依 route 實作）。
- 串流中錯誤：優先發穩定 `error` 事件後結束。
