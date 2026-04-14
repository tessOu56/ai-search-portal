# Chat SSE：內部層 ↔ 穩定層

**類型**：spec | **權重**：2

## 穩定層（對 `/api/chat`）

| event     | data 型式 | 說明                                                                                  |
| --------- | --------- | ------------------------------------------------------------------------------------- |
| `meta`    | JSON      | `query`, `summary`, `confidence`, 可選 `traceId`                                      |
| `token`   | 純文字    | 回答片段                                                                              |
| `final`   | JSON      | `sources`, `nextSteps`                                                                |
| `done`    | 字串或空  | 流結束                                                                                |
| `failure` | JSON      | `message`, 可選 `code`（**避免使用事件名 `error`**，以免與 EventSource 連線錯誤混淆） |

## 內部層（Agent HTTP `GET /v1/chat/stream`）

| event                  | data 型式 | 說明                                                                                                     |
| ---------------------- | --------- | -------------------------------------------------------------------------------------------------------- |
| `internal.meta`        | JSON      | 與穩定 `meta` 相同欄位；可含除錯欄位（由 Zod strip）                                                     |
| `internal.chunk`       | JSON      | `{ "text": string }`                                                                                     |
| `internal.tool_status` | JSON      | `{ "tool": string, "status": string }`（Phase 3；映射為穩定 `tool_status`）                              |
| `internal.rag_step`    | JSON      | `{ "step": "retrieve" \| "rerank" \| "compose", "detail"?: string }`（**不**映射到前端；僅 Gateway log） |
| `internal.final`       | JSON      | 同穩定 `final`                                                                                           |
| `internal.done`        | JSON 或空 | 結束                                                                                                     |
| `internal.error`       | JSON      | 同穩定 `error`                                                                                           |

## 映射規則（摘要）

- `internal.meta` → `meta`（payload 經 `stableChatMetaSchema` parse）。
- `internal.chunk` → `token`（僅輸出 `text`）。
- `internal.tool_status` → `tool_status`（若前端未監聽可忽略）。
- `internal.final` → `final`。
- `internal.done` → `done`。
- `internal.error` → `failure`。
- `internal.rag_step`：預設不轉發；可由環境開啟「除錯模式」轉成自訂事件（預設關閉）。
