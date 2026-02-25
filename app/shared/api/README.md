# Shared API 層

所有對「API 路徑」的請求必須透過本層或透過 Remix `useFetcher`/loader 打**已註冊契約的 API 路徑**，不得在 component 內直接寫 `fetch(url)` 或硬編碼 URL。

## 約定

- **Component / 頁面**：只透過 `useFetcher` 打契約內定義的 path（如 `/api/items`），或透過本目錄下的 **typed client**（若有）發送請求。
- **Loader / Action**：若需呼叫 API，使用本目錄的 client 或 Remix 內建資料方法；response 須以契約 schema parse。
- **禁止**：在 `app/components`、`app/features/*/components`、`app/routes` 的 UI 元件內直接 `fetch('https://...')` 或未經契約的相對 path。

## 實作狀態

- 目前 Remix 以 `useFetcher` + 路徑字串為主；路徑與契約由 `app/shared/contracts` 與 `.cursor/wiki/Ref-API-與-Handler-對照` 定義。
- 若需統一 baseURL、攔截、重試，可在此目錄新增 `client.ts`（封裝 fetch + schema parse），並逐步讓 loader 或 hooks 改用。
