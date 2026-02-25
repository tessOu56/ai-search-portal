# RA-LUI-搜尋入口

本文件描述首頁與 LUI（Language User Interface）搜尋的現況規格：流程、API、回應結構。

---

## 業務流程（現況）

1. 使用者開啟首頁，看到標語、Chat 輸入框與信任說明。
2. 使用者輸入問題（query），送出後呼叫 **SSE** `GET /api/chat?q=...`。
3. 伺服器回傳串流事件：先 **meta**（query、summary、confidence），再 **token**（逐字/詞回答），最後 **final**（sources、nextSteps）與 **done**。
4. 前端以 `EventSource` 或等效方式消費 SSE，更新 UI（摘要、回答、來源、下一步）。

---

## 首頁與 UI

- **路由**：`app/routes/_index.tsx`
- **Loader**：提供 SEO meta、i18n、structured data（JSON-LD）；版號與語系來自 root loader。
- **元件**：`ChatInterface`（`app/components/chat/ChatInterface.tsx`）負責輸入與 SSE 消費；`ChatBubble` 等呈現對話。
- **i18n**：首頁文案由 `app/shared/i18n` 與 root 的 `translations` 提供；語系切換經 `POST /api/locale` + cookie。

---

## API：GET /api/chat

- **查參**：`q`（必填，查詢字串）
- **回傳**：SSE stream
  - `meta`：`{ query, summary, confidence }`
  - `token`：回答片段（字串）
  - `final`：`{ sources: LuiSource[], nextSteps: string[] }`
  - `done`：結束
- **實作**：`app/routes/api.chat.ts` 使用 `remix-utils/sse` 的 `eventStream`；回答內容由 `app/services/lui.server.ts` 的 `buildLuiResponse(query)` 產生。

---

## LUI 回應結構（現況）

- **LuiResponse**：`summary`, `answer`, `confidence`, `sources`, `nextSteps`
- **LuiSource**：`title`, `url`
- 目前為 **mock**：固定範例文案與來源，無真實檢索或 LLM；`splitToTokens` 僅依空白分詞模擬串流。

---

## 測試與 Mock

- 單元測試可 mock `buildLuiResponse` 或直接測 `lui.server.ts`。
- MSW 可攔截 `/api/chat` 回傳自訂 SSE 或 JSON（視測試需求）；現況 `app/test/handlers.ts` 為空陣列。
