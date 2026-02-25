# RA-Release-Notes與版號

本文件描述版號與 Release Notes 的現況規格：資料來源、API、UI。

---

## 資料來源

- **檔案**：`content/release-notes.json`
- **格式**：JSON 陣列，每筆為 `ReleaseNote`：
  - `version`: string
  - `date`: string
  - `summary`: string
  - `highlights`: string[]
  - `commits`: string[]
- **讀取**：`app/shared/release-notes.server.ts` 的 `getReleaseNotes()`、`getReleaseNoteByVersion(version)`；有記憶體快取。
- **當前版號**：`getCurrentVersion()` 讀取 `package.json` 的 `version`，預設 `"0.0.0"`。

---

## API 與路由

- **API**：`GET /api/release-notes` 回傳完整列表（依 `app/routes/api.release-notes.ts` 實作為準）。
- **頁面**：`/release-notes`（列表）、`/release-notes/:version`（單一版本）；loader 使用 `getReleaseNotes()` / `getReleaseNoteByVersion()`。

---

## UI 顯示

- 首頁 footer 顯示「版本 vx.y.z」連結至 `/release-notes`；版號來自 root loader 的 `package.json` version。

---

## 最小維護要點

- 新增版本：編輯 `content/release-notes.json` 加入一筆；不需改程式。
- 若檔案不存在或非合法 JSON，`getReleaseNotes()` 回傳空陣列，不拋錯。
