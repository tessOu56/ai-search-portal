# ai-search-api

獨立 HTTP API，與 **`@ai-search-portal/contracts`**（Zod）及 Remix routes `app/routes/api.items*.ts` 對齊（Items CRUD + 記憶體 seed）。OpenAPI 見 `specs/openapi/openapi.yaml`。

## 指令

- 開發：`pnpm dev`（預設 `PORT=3001`）
- 建置：`pnpm build` → 輸出 `dist/`
- 啟動：`pnpm start`
- 測試：`pnpm test`

自 repo 根目錄亦可：`pnpm run dev:api`、`pnpm run build:api`、`pnpm run test:api`。

## 環境變數

| 變數          | 說明                                 |
| ------------- | ------------------------------------ |
| `PORT`        | 監聽埠（預設 `3001`）                |
| `CORS_ORIGIN` | 允許的來源，逗號分隔；未設定則為 `*` |
