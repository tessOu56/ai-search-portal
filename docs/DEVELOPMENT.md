# 開發與協作流程

本文件說明大型協作時的建議流程、CI/CD、部署（Vercel）與可選工具，供團隊與 AI 輔助開發參考。

## 分支與 PR

- **主分支**：`main`（可選 `develop` 作為整合分支）。
- **功能開發**：自 `main` 開 `feature/xxx` 或 `fix/xxx`，完成後開 PR 合回 `main`。
- **PR 合併前**：CI 必須全綠（見下方 CI 檢查項）；建議至少一人 Review 後再合併。

## CI 檢查（GitHub Actions）

- **Lint workflow**（`.github/workflows/lint.yml`）在 PR / push 到 `main` 時執行：
  - `lint:filenames`：檔名與資料夾命名
  - `lint:strict`：ESLint
  - `typecheck`：TypeScript
  - **建議**：在 `lint.yml` 加上 `npm run test`，讓 PR 時一併跑單元測試（見下方「建議新增」）。
- 合併前請在本地執行：`npm run lint:ci`（含 filenames + lint + typecheck），若有測試則再加 `npm run test`。

## 部署（Vercel）

- 本專案以 **Vercel** 為正式部署環境（`vercel.json`、連線 GitHub 後自動建置與部署）。
- **main** 分支 push 後由 Vercel 自動建置並更新 production。
- 其他分支會產生 **Preview 部署**，可用於 PR 預覽。
- 環境變數、Domain、Region 等請在 Vercel 專案設定中設定；敏感資訊勿提交進 repo。

## 版本與 Changelog（Changesets）

- 使用 **@changesets/cli** 管理版本與 CHANGELOG。
- 對外可見的變更請在 PR 內執行 `npm run changeset`，選擇變更類型並填寫說明。
- 發版時在 main 上執行 `changeset version` 與 `changeset publish`（或透過 CI/手動流程），詳見 [Changesets 文件](https://github.com/changesets/changesets)。

## 依賴更新

- 使用 **Dependabot**（`.github/dependabot.yml`）自動開 PR 更新依賴。
- 建議合併前跑過 CI 與基本手動檢查，再合併 Dependabot PR。

## 大型協作建議（需在 GitHub 設定）

1. **Branch protection（main）**
   - 要求 PR 通過後才能合併。
   - 要求 CI 通過（Lint workflow 等）。
   - 可選：要求至少 1 位 Review、禁止 force push。

2. **CODEOWNERS**（可選）
   - 在 `.github/CODEOWNERS` 指定目錄負責人，PR 會自動請求對應人員 Review。

3. **Issue / PR 範本**
   - 已提供 `.github/ISSUE_TEMPLATE` 與 `pull_request_template.md`，可依團隊習慣微調。

## 建議新增的套件或步驟（可選）

| 項目                | 說明                                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| **CI 跑測試**       | 在 `lint.yml` 增加 `npm run test`，PR 時一併跑 Vitest。                                               |
| **E2E 測試**        | 若需端對端測試，可引入 **Playwright** 或 **Cypress**，並在 CI 中跑 E2E。                              |
| **Vercel 建置驗證** | 若希望「僅驗證建置、不部署」，可在 Actions 加一個 job 跑 `npm run build`（Vercel 仍以自身建置為準）。 |
| **deploy.yml**      | 目前為 GitHub Pages 部署；若已完全改用 Vercel，可改為「僅建置驗證」或停用，避免混淆。                 |

## 相關文件

- `CONTRIBUTING.md`：貢獻流程與品質檢查。
- `docs/CONVENTIONS.md`：命名與程式規範。
- `docs/ARCHITECTURE.md`：架構說明。
- `docs/CAPABILITIES.md`：版號、多語系、無障礙現況與可選改進。
- `docs/VSCODE.md`：VS Code / Cursor 擴充推薦（clone 後可依提示安裝）。
- `.cursor/rules`：AI 輔助開發規範。
