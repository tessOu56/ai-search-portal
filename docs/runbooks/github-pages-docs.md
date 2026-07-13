# GitHub Pages — VitePress docs 首次部署

> **T-2026-067** 驗收項之一。`deploy-docs` workflow 的 build 已綠；`configure-pages@v5` 失敗代表 **repo 尚未啟用 GitHub Pages（Actions 來源）**。

## 一次性設定（通常不必手動）

本 repo workflow 已在 `configure-pages` 設 **`enablement: true`**——首次成功 run 會自動把 Pages 設為 **GitHub Actions** 來源。若仍 404，再手動：

1. 開啟 [Settings → Pages](https://github.com/tessOu56/ai-search-portal/settings/pages)
2. **Build and deployment → Source** 選 **GitHub Actions**
3. **Custom domain** 留空（project site 用 `https://tessou56.github.io/ai-search-portal/`）
4. Actions → **deploy-docs** → **Run workflow**（或 push `docs/**` 觸發）

## 驗收

- Workflow：`build` + `deploy` 皆 success
- URL 可開：`https://tessou56.github.io/ai-search-portal/`（VitePress `base: /ai-search-portal/`）
- 成功後更新 `platform-command/registry/projects.json` 的 `deploy.docs.url`（若欄位存在）或 sprint 檢查項

## 常見失敗

| 症狀                                             | 根因                                                                                                  |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `configure-pages@v5` 紅、`Get Pages site failed` | Pages 未啟用 → workflow 已加 `enablement: true`；仍失敗則手動 Settings → Pages → GitHub Actions       |
| 404 但 workflow 綠                               | `base` 與 project site 路徑不一致                                                                     |
| pnpm version 衝突                                | `pnpm/action-setup` 勿同時設 `version:` 與 `package.json#packageManager`（已對齊 ci.yml，2026-07-13） |

## 本機預檢

```powershell
cd C:\Users\11412616t\ai-search-portal
pnpm run docs:build
# 產物：docs/.vitepress/dist
```
