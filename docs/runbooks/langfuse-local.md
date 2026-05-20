# Langfuse — 本機開發（無 Cloud 註冊）

## 預設行為

- 未設定 `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` 時，agent-core **不送 trace**（no-op）。
- `labs/observability` 與 smoke 測試可在 CI 跑，不依賴 Cloud。

## 本機驗證

```powershell
cd ai-search-portal
pnpm --filter @ai-search-portal/agent-core test
# 含 observability/langfuse.test.ts（mock / stub）
```

## 若要接 Cloud（停步 STOP-002）

1. [cloud.langfuse.com](https://cloud.langfuse.com) 建立 project
2. 複製 keys 到 `.env.local`（勿 commit）
3. 設 `LANGFUSE_BASE_URL`（若 EU/US 區域不同）
4. 跑一輪 chat 請求，在 Langfuse UI 確認 trace

## 與產品路線

- Sprint 2+：見 `docs/architecture/ai-product/observability-model.md`
- 向量 DB / 真 RAG 仍與 Langfuse 獨立，可先做 local RAG
