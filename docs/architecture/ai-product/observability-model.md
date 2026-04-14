# Observability Model

**類型**：reference | **權重**：2

## Trace 貫穿

| 邊界                 | 欄位                                                  |
| -------------------- | ----------------------------------------------------- |
| 瀏覽器 → Remix       | `traceparent`（若無則 Gateway 生成並記 log）          |
| Gateway → Agent HTTP | 轉發相同 `traceparent` 或 `x-trace-id`                |
| 日誌                 | `traceId`（從 `traceparent` 解析或直用 `x-trace-id`） |

## 最小實作

- `app/services/chat-gateway.server.ts`：`getTraceContext(request)` 回傳 `traceparent`/`traceId`。
- 穩定 `meta` JSON 可含 **`traceId`**（選填）供前端除錯開關使用。

## Metrics（預留）

- 每請求：first token latency、總時長、錯誤碼（與 Phase 5 productization 對齊）。
