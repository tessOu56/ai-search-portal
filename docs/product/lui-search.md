# LUI 搜尋入口

**類型**：reference | **權重**：2

本文件描述首頁與 LUI（Language User Interface）搜尋的現況規格：流程、API、回應結構。

---

## 業務流程（現況）

1. 使用者開啟首頁，看到標語與單一 composer（empty = marketing）。
2. 使用者輸入問題（query），送出後切換為全幅對話工作區，呼叫 **SSE** `GET /api/chat?q=...`（可選 `sessionId`，見契約 `chatQueryParamsSchema`）。
3. 伺服器回傳串流事件：先 **meta**（query、summary、confidence，可選 traceId），再 **token**（逐字/詞回答），最後 **final**（sources、nextSteps）與 **done**。應用層錯誤使用 **`failure`**（JSON `message`／`code`），**不用**事件名 `error`，以免與 `EventSource` 連線錯誤混淆。可選 **tool_status**（Phase 3+）。
4. 前端以 `EventSource` 或等效方式消費 SSE；每則助手回答內嵌摘要／信心、串流正文、來源與下一步（無資料不畫空卡）。

---

## 首頁與 UI

- **路由**：`app/routes/_index.tsx`
- **Loader**：提供 SEO meta、i18n、structured data（JSON-LD）；版號與語系來自 root loader。
- **空態**：`HomeLanding` + 共用 `Composer`（typewriter 建議與 `data-testid="golden-question"` chips）。
- **對話態**：`WorkspaceChatView`（`min-h-[100dvh]`）— 頂列新對話、transcript（`role="log"`）、置底 `Composer`。`ChatInterface` 消費 SSE；`AssistantTurn` 呈現結構化回覆。
- **i18n**：首頁文案由 `app/shared/i18n` 與 root 的 `translations` 提供；語系切換經 `POST /api/locale` + cookie。

---

## API：GET /api/chat

- **查參**：`q`（必填）；`sessionId`（選填，記憶／Phase 4 預留）
- **回傳**：SSE stream（穩定層；Zod：`@ai-search-portal/contracts`）
  - `meta`：`{ query, summary, confidence, traceId? }`
  - `token`：回答片段（字串）
  - `final`：`{ sources: LuiSource[], nextSteps: string[] }`
  - `done`：結束
  - `failure`（可選）：`{ message, code? }`
  - `tool_status`（可選）：`{ tool, status }`
- **實作**：`app/routes/api.chat.ts` 使用 `remix-utils/sse` 的 `eventStream` → **`app/services/chat-gateway.server.ts`**：預設同 process 呼叫 **`@ai-search-portal/agent-core`**；若設定 **`AGENT_RUNTIME_URL`** 則改以 HTTP 銜接 **`services/agent-runtime`**（內部 `internal.*` SSE 再映射為穩定事件）。Mock 回應仍來自 agent-core 的 `buildLuiResponse`（`app/services/lui.server.ts` re-export）。

---

## LUI 回應結構（現況）

- **LuiResponse**：`summary`, `answer`, `confidence`, `sources`, `nextSteps`
- **LuiSource**：`title`, `url`
- 目前為 **mock**：固定範例文案與來源，無真實檢索或 LLM；`splitToTokens` 僅依空白分詞模擬串流。

---

## 測試與 Mock

- 單元測試可 mock `buildLuiResponse` 或直接測 `lui.server.ts`。
- `AssistantTurn` 覆蓋 empty / streaming / complete / error 四態。
- MSW 可攔截 `/api/chat` 回傳自訂 SSE 或 JSON（視測試需求）；現況 `app/test/handlers.ts` 為空陣列。
