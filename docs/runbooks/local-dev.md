# 本地開發

**類型**：runbook | **權重**：1

本文件說明分支與 PR、CI 檢查、依賴更新與大型協作建議。

## 分支與 PR

- **主分支**：`main`（可選 `develop` 作為整合分支）。
- **功能開發**：自 `main` 開 `feature/xxx` 或 `fix/xxx`，完成後開 PR 合回 `main`。
- **PR 合併前**：CI 必須全綠（見下方 CI 檢查項）；建議至少一人 Review 後再合併。

## CI 檢查（GitHub Actions）

- **CI workflow**（`.github/workflows/ci.yml`）在 PR / push 到 `main` 時執行，**build、test、lint 皆通過才放行**：
  - **Build**：`pnpm run build`
  - **Test**：`pnpm run test`（產出 `reports/vitest-results.json`、`reports/junit.xml`；JUnit 會由 **Publish Test Results** 步驟顯示在 GitHub Actions 該次 run 的測試摘要）
  - **Lint**：`lint:filenames`、`lint:handlers`、ESLint（strict）、`typecheck`（產出 `reports/eslint-report.json` 供失敗時彙整）
- **失敗時**：會產出說明報告（`reports/ci-failure-summary.md`）並上傳為 Artifact **ci-reports**（保留 7 天），PR 的 Job summary 也會顯示簡要說明。
- 合併前請在本地執行：`pnpm run build`、`pnpm run test`、`pnpm run lint:ci`。

## 依賴更新

- 使用 **Dependabot**（`.github/dependabot.yml`）自動開 PR 更新依賴。
- 建議合併前跑過 CI 與基本手動檢查，再合併 Dependabot PR。

## 大型協作建議（需在 GitHub 設定）

1. **Branch protection（main）**
   - 要求 PR 通過後才能合併。
   - 要求 CI 通過（CI workflow：build / test / lint）。
   - 可選：要求至少 1 位 Review、禁止 force push。

2. **CODEOWNERS**（可選）
   - 在 `.github/CODEOWNERS` 指定目錄負責人，PR 會自動請求對應人員 Review。

3. **Issue / PR 範本**
   - 已提供 `.github/ISSUE_TEMPLATE` 與 `pull_request_template.md`，可依團隊習慣微調。

4. **Environment 保護（部署控制）**
   - 建立 `preview`、`production` environments。
   - `production` 建議啟用 required reviewers，限制可部署人員。
   - 在 `.github/workflows/deploy-vercel.yml` 透過 environment gate 控制上線。

## 建議新增的套件或步驟（可選）

| 項目          | 說明                                                                             |
| ------------- | -------------------------------------------------------------------------------- |
| **E2E 測試**  | 若需端對端測試，可引入 **Playwright** 或 **Cypress**，並在 CI 中跑 E2E。         |
| **Main 建置** | 已併入 `ci.yml`（push `main` 時與 PR 同一套檢查）；不再維護獨立的 `deploy.yml`。 |
| **可控部署**  | 使用 `.github/workflows/deploy-vercel.yml` 手動部署 preview/production。         |
| **可控發版**  | 使用 `.github/workflows/release.yml` 手動建立 tag 與 GitHub Release。            |

## Agent Runtime（可選）

- 啟動獨立 Agent HTTP：`pnpm run dev:agent`（預設 `http://127.0.0.1:3002`，見 `services/agent-runtime/README.md`）。
- Remix 若要以 HTTP 連線 Agent：設定 **`AGENT_RUNTIME_URL=http://127.0.0.1:3002`**；未設定時 `api.chat` 使用同 process 的 `@ai-search-portal/agent-core`。
- **Local RAG**（in-memory docs）：`AGENT_RAG_MODE=local` 再啟動 dev；retrieve 會命中 `packages/agent-core/src/rag/local-store.ts` 內建文件。
- **Items tool**：另開 `pnpm run dev:api`（port 3001），設定 `AGENT_EXECUTE_TOOLS=1` 或 `ITEMS_API_URL=http://127.0.0.1:3001/api/v1/items`；chat 串流會執行 `items.lookup`。
- **Offline eval**：`pnpm run test:labs`、`pnpm run eval:offline` → `reports/eval-YYYY-MM-DD.json`（見 `labs/eval-runner/`）。
- **Langfuse（可選）**：`labs/observability/docker-compose.langfuse.yml`；設定 `LANGFUSE_HOST` / `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` 後，每筆 chat 會在 Langfuse 建立 trace（含 RAG spans 與 mock generation）。見 `packages/agent-core/src/observability/langfuse.ts`。
- 架構決策見 [ai-product](../architecture/ai-product/README.md)。

## 相關文件

- [CONTRIBUTING.md](../../CONTRIBUTING.md)：貢獻流程與品質檢查
- [coding-conventions](../conventions/coding-conventions.md)：命名與程式規範
- [system-overview](../architecture/system-overview.md)：架構說明
- [deployment](deployment.md)：部署（Vercel）
