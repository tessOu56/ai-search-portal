# Invocation Boundary（Backend → Agent）

**類型**：reference | **權重**：2

## 預設

- **生產與整合測試**：Remix Gateway 以 **HTTP** 呼叫 `AGENT_RUNTIME_URL`，路徑 **`GET /v1/chat/stream`**（見 [stable-chat-contract.md](stable-chat-contract.md)）。
- **傳遞 trace**：使用 **`traceparent`**（W3C）優先；若無則 **`x-trace-id`**（自生成 UUID）。

## 過渡（本機／CI）

- 未設定 `AGENT_RUNTIME_URL`：`app/services/chat-gateway.server.ts` 直接呼叫 **`@ai-search-portal/agent-core`** 的內部事件產生器，**行為與經 Agent HTTP 一致**（契約測試同一套）。

## 升級條件

| 情境                            | 建議                                                          |
| ------------------------------- | ------------------------------------------------------------- |
| 單機開發、快速迭代              | 可不啟 Agent process（library 模式）                          |
| 需與真實 Agent 對齊、多服務整合 | 啟動 `services/agent-runtime` 並設定 `AGENT_RUNTIME_URL`      |
| HTTP 同步串流成瓶頸             | 先優化 chunk 大小與連線；再評估 gRPC streaming（列為 future） |

## 禁止

- 在 `app/routes/api.chat.ts` 內堆疊 prompt／tool orchestration（應在 Agent 層／`agent-core`）。
