# agent-runtime

Agent orchestration **HTTP** 服務：對內提供 `GET /v1/chat/stream`（**internal.\*** SSE）。Remix `api.chat` 經 `AGENT_RUNTIME_URL` 轉接並映射為對外穩定事件。

## 指令

- 開發：`pnpm dev`（預設 `AGENT_PORT=3002`）
- 建置：`pnpm build`
- 啟動：`pnpm start`
- 測試：`pnpm test`

自 repo 根目錄：`pnpm run dev:agent`。

## 環境變數

| 變數          | 說明                           |
| ------------- | ------------------------------ |
| `AGENT_PORT`  | 監聽埠（預設 `3002`）          |
| `CORS_ORIGIN` | 允許來源，逗號分隔；未設為 `*` |
