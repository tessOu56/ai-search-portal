# Shared API 層

所有對「API 路徑」的請求必須透過本層或透過 Remix `useFetcher`/loader 打**已註冊契約的 API 路徑**，不得在 component 內直接寫 `fetch(url)` 或硬編碼 URL。

## 約定

- **API 路徑**：一律從 `app/shared/api/paths.ts` import，勿在 component、hooks、routes 內硬編碼路徑字串。路徑常數與 `specs/api/handler-mapping.md` 對齊。
- **Component / 頁面**：只透過 `useFetcher` 打契約內定義的 path（由 `paths.ts` 提供），或透過本目錄下的 **typed client**（若有）發送請求。
- **Loader / Action**：若需呼叫 API，使用本目錄的 client 或 Remix 內建資料方法；response 須以契約 schema parse。
- **禁止**：在 `app/components`、`app/features/*/components`、`app/routes` 的 UI 元件內直接 `fetch('https://...')` 或未經契約的相對 path。

## 實作狀態

- **路徑單一來源**：`paths.ts` 匯出所有 API 路徑常數與輔助函式（如 `apiDish(id)`）；新增 API 時請同步更新此檔與 handler-mapping。
- 目前 Remix 以 `useFetcher` + `paths.ts` 為主；契約由 `app/shared/contracts` 與 `specs/api/handler-mapping.md` 定義。
- 若需統一 baseURL、攔截、重試，可在此目錄新增 `client.ts`（封裝 fetch + schema parse），並逐步讓 loader 或 hooks 改用。
