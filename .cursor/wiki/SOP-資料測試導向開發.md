# SOP-資料測試導向開發

本專案採**資料測試導向**：所有 API 呼叫都經過可被 MSW 攔截的請求，且每個 API 都有對應的 MSW handler，方便 mock 與資料驅動測試。

---

## 三步驟流程（開發者必遵）

### 1. 確定需求 feature 業務

- 釐清功能範圍、使用者、驗收條件。
- 產出：RA- 文件或 ticket 描述（可參考 `.cursor/wiki/RA-*.md`）。

### 2. 確定資料 schema 與 handler

- **Schema**：定義 request / response 型別（放在 `app/features/*/ *.types.ts` 或 `app/shared/types`）。
- **API 契約**：路徑、方法、body/query、回傳格式。
- **MSW handler**：在 `app/test/handlers.ts`（或依專案約定合併的 handler 檔）新增對應的 mock handler，回傳符合 schema 的假資料。
- 先寫 handler、再實作 route 或 UI，測試即可用同一份 mock 資料驅動。

### 3. 分配子任務：UI 或 模組基礎架構

- **UI 子任務**：頁面、元件、hooks（`useFetcher` / `fetch` 打 API）；不直接 import `*.server`。
- **模組基礎架構**：新增 `app/features/<name>/`（_.types.ts, _.server.ts, _.hooks.ts）、或 `app/routes/api._`；實作與 schema 一致，並可被同一 MSW handler 覆寫以測試。

---

## 約定：所有 API 都要有 handler

| 項目     | 說明                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **範圍** | 所有前端或 loader 會呼叫的 API（含 Remix resource routes 如 `/api/items`、未來 `/api/dishes` 等）。                            |
| **位置** | `app/test/handlers.ts` 匯總所有 handler；可依 feature 拆成 `handlers/items.ts` 等再 merge。                                    |
| **格式** | MSW 2.x：`http.get(path, resolver)` / `http.post(...)`，回傳 `HttpResponse.json(data)`；response 形狀需與 schema 一致。        |
| **測試** | 單元/整合測試中 MSW 已 `listen`，未註冊的 request 會觸發 onUnhandledRequest（目前設為 error）；新增 API 時須同步新增 handler。 |

---

## Handler 撰寫要點

- Path 與實際呼叫的 URL 一致（同源用相對路徑如 `/api/items` 即可）。
- 回傳 status、body 符合 API 契約與型別定義。
- Mock 資料可集中成常數或從 `app/test/fixtures` 讀取，方便維護與資料驅動測試。

---

## 參考

- **Ref-API-與-Handler-對照**：API 清單與 handler 對應表。
- **.cursor/rules/data-test-driven.mdc**：強制規則摘要。
