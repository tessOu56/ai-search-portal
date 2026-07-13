# 停步 — 需外部註冊

## STOP-001 Vercel production（T-2026-001）

1. [vercel.com](https://vercel.com) 註冊／登入
2. Import `tessOu56/ai-search-portal`
3. 設定 GitHub Secrets：`VERCEL_TOKEN`、`VERCEL_ORG_ID`、`VERCEL_PROJECT_ID`
4. 走 **Deploy to Vercel** workflow（先 preview，再 production）；見 [deployment](runbooks/deployment.md)
5. production 綠且路由可開後，將 URL 填入 `platform-command/registry/projects.json`

**解除條件**：`https://ai-search-portal.vercel.app` production 可開（含 `/catalog-search`），非 500。

**解除前可繼續**：本機 `pnpm dev`、catalog-search、labs、CI。

## STOP-002 Langfuse Cloud（可選）

見 [`docs/runbooks/langfuse-local.md`](runbooks/langfuse-local.md) — 預設本機 **不送 trace**。

## STOP-003 Figma MCP（T-2026-004 部分）

GAP 表可用 **waiver** 直到設定 `FIGMA_ACCESS_TOKEN`。本機仍可做 catalog-search UI 對照 fixtures。

中央清單：[platform-command/docs/external-service-stop-points.md](https://github.com/tessOu56/platform-command/blob/main/docs/external-service-stop-points.md)
