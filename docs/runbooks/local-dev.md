# 本地開發

**類型**：runbook | **權重**：1

本文件說明分支與 PR、CI 檢查、依賴更新與大型協作建議。

## 分支與 PR

- **主分支**：`main`（可選 `develop` 作為整合分支）。
- **功能開發**：自 `main` 開 `feature/xxx` 或 `fix/xxx`，完成後開 PR 合回 `main`。
- **PR 合併前**：CI 必須全綠（見下方 CI 檢查項）；建議至少一人 Review 後再合併。

## CI 檢查（GitHub Actions）

- **CI workflow**（`.github/workflows/ci.yml`）在 PR / push 到 `main` 時執行，**build、test、lint 皆通過才放行**：
  - **Build**：`npm run build`
  - **Test**：`npm run test`（產出 `reports/vitest-results.json`、`reports/junit.xml`；JUnit 會由 **Publish Test Results** 步驟顯示在 GitHub Actions 該次 run 的測試摘要）
  - **Lint**：`lint:filenames`、`lint:handlers`、ESLint（strict）、`typecheck`（產出 `reports/eslint-report.json` 供失敗時彙整）
- **失敗時**：會產出說明報告（`reports/ci-failure-summary.md`）並上傳為 Artifact **ci-reports**（保留 7 天），PR 的 Job summary 也會顯示簡要說明。
- 合併前請在本地執行：`npm run build`、`npm run test`、`npm run lint:ci`。

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

## 建議新增的套件或步驟（可選）

| 項目           | 說明                                                                 |
| -------------- | -------------------------------------------------------------------- |
| **E2E 測試**  | 若需端對端測試，可引入 **Playwright** 或 **Cypress**，並在 CI 中跑 E2E。 |
| **deploy.yml** | 目前為 GitHub Pages 部署；若已完全改用 Vercel，改為「僅建置驗證」或停用。 |

## 相關文件

- [CONTRIBUTING.md](../../CONTRIBUTING.md)：貢獻流程與品質檢查
- [coding-conventions](../conventions/coding-conventions.md)：命名與程式規範
- [system-overview](../architecture/system-overview.md)：架構說明
- [deployment](deployment.md)：部署（Vercel）
