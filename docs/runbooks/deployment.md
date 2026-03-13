# 部署（Vercel）

**類型**：runbook | **權重**：2

- 本專案以 **Vercel** 為正式部署環境（`vercel.json`、連線 GitHub 後自動建置與部署）。
- **main** 分支 push 後由 Vercel 自動建置並更新 production。
- 其他分支會產生 **Preview 部署**，可用於 PR 預覽。
- 環境變數、Domain、Region 等請在 Vercel 專案設定中設定；敏感資訊勿提交進 repo。

## 版本與 Changelog（Changesets）

- 使用 **@changesets/cli** 管理版本與 CHANGELOG。
- 對外可見的變更請在 PR 內執行 `npm run changeset`，選擇變更類型並填寫說明。
- 發版時在 main 上執行 `changeset version` 與 `changeset publish`（或透過 CI/手動流程），詳見 [Changesets 文件](https://github.com/changesets/changesets)。

## 相關

- [local-dev](local-dev.md)：分支、PR、CI
- [CONTRIBUTING.md](../../CONTRIBUTING.md)：Quality checks
