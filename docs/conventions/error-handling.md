# 錯誤與邊界處理

**類型**：reference | **權重**：2

本文件簡述 API 與 UI 層的錯誤處理原則，供開發者與 AI 在實作與 code review 時對齊。

## 契約層

- **錯誤 response**：API 回傳錯誤時，形狀應與 `app/shared/contracts` 內定義一致。既有 `errorResponseSchema`（`{ error: string }`）可作為通用錯誤格式；新 API 可沿用或擴充。
- **Parse 失敗**：loader / action 或 MSW handler 回傳前應以對應 Zod schema parse；parse 失敗時依專案慣例回傳 4xx/5xx 或統一的錯誤 payload。

## UI 層

- **顯示**：錯誤訊息以既有 UI 元件（如 `Alert`）呈現，避免裸 `console.error` 作為唯一回饋。
- **SSE / 串流**：如 ChatInterface 的 EventSource，在 `onerror` 時應設 error state、關閉連線，並在 UI 顯示可理解的訊息（如「連線中斷，請重試」）。

## 與 Code Review 的關係

- 新增或變更 API 時，若會回傳錯誤，請在契約中定義或沿用既有 error schema，並在 [specs/api/handler-mapping.md](../../specs/api/handler-mapping.md) 註明。
- 審查時可依 [Code Review 規範](../code-review-spec.md) 的「契約與錯誤」項檢查。
