# GitHub Pages — VitePress docs 首次部署

> **T-2026-067** 驗收項。`deploy-docs` 使用 **純 shell + `gh-pages` 分支**，不依賴 `actions/checkout` 等第三方 action（避開 repo「僅允許 tessOu56 actions」政策）。

## 必做：Pages 來源設為 branch（一次性）

1. [Settings → Pages](https://github.com/tessOu56/ai-search-portal/settings/pages)
2. **Build and deployment → Source** → **Deploy from a branch**
3. **Branch** → `gh-pages` · **Folder** → `/ (root)`
4. **Custom domain** 留空

首次 workflow 成功 push `gh-pages` 後，數分鐘內站點可用。

## 觸發部署

- push `main` 且 paths 含 **`docs/**`** 或本 workflow 檔（**不含** `package.json` / lockfile，避免與 App／Vercel 依賴變更誤聯）
- 文件依賴需重建時：Actions → **deploy-docs** → **Run workflow**

兩條管道獨立：Vercel 從不推 `gh-pages`；改 App 依賴不會自動重佈 Pages。

## 驗收

- Workflow **deploy** job success
- URL：`https://tessou56.github.io/ai-search-portal/`（`base: /ai-search-portal/`）
- 成功後更新 `platform-command/registry/projects.json` deploy 欄

## 常見失敗

| Annotation                                              | 意義                                         | 處理                                                                      |
| ------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `actions/... are not allowed ... must be from tessOu56` | repo 禁止非 tessOu56 的 action               | 本 workflow 已改純 shell；若 **CI** 仍報此錯，見下方「放寬 Actions 政策」 |
| Pages 404 / 空白                                        | Source 仍為 GitHub Actions 或未選 `gh-pages` | 改 **Deploy from a branch → gh-pages**                                    |
| `base` 路徑錯                                           | 資源 404                                     | 確認 `docs/.vitepress/config.mts` 的 `base: "/ai-search-portal/"`         |

## 可選：放寬 Actions 政策（讓 CI 等 workflow 用官方 action）

若希望 `ci.yml` 繼續用 `actions/checkout`、`pnpm/action-setup` 等：

1. [Settings → Actions → General](https://github.com/tessOu56/ai-search-portal/settings/actions)
2. **Actions permissions** → **Allow all actions and reusable workflows**（或允許 `actions/*`、`pnpm/*`）
3. Save

`deploy-docs` **不必**改回 GitHub Actions Pages 管線；branch 部署已足夠。

## 本機預檢

```powershell
cd C:\Users\11412616t\ai-search-portal
pnpm run docs:build
# 產物：docs/.vitepress/dist
```
