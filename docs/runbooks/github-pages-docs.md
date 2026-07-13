# GitHub Pages — VitePress docs 首次部署

> **T-2026-067** 驗收項之一。`pnpm run docs:build` 與 workflow install/build 已綠；**`configure-pages` 失敗 = repo 尚未完成 Pages 一次性設定**（無法只靠 YAML 自動開）。

## 必做：一次性手動設定（repo admin）

`GITHUB_TOKEN` **不能**在大多數個人 repo 上呼叫 `Create Pages site`（會出現 `Resource not accessible by integration`）。workflow 的 `enablement: true` 已移除——請在 GitHub UI 完成下列兩步，**只做一次**。

### A. 開啟 GitHub Pages（Actions 來源）

1. [Settings → Pages](https://github.com/tessOu56/ai-search-portal/settings/pages)
2. **Build and deployment → Source** → **GitHub Actions**（不要選 Deploy from a branch）
3. **Custom domain** 留空

### B. 放寬 Workflow token 權限（若 A 後仍 `Resource not accessible`）

1. [Settings → Actions → General](https://github.com/tessOu56/ai-search-portal/settings/actions)
2. **Workflow permissions** → 選 **Read and write permissions**
3. Save

### C. 重跑部署

Actions → **deploy-docs** → **Run workflow**（或 push `docs/**`）

## 驗收

- Workflow：`build` + `deploy` 皆 success
- URL：`https://tessou56.github.io/ai-search-portal/`（VitePress `base: /ai-search-portal/`）
- 成功後更新 `platform-command/registry/projects.json` deploy 欄或 sprint 檢查項

## 常見失敗對照

| Annotation                                                              | 意義                       | 處理                                                              |
| ----------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------- |
| `Get Pages site failed` / **Not Found**                                 | Pages 從未啟用             | 完成上方 **A**                                                    |
| `Create Pages site failed` / **Resource not accessible by integration** | token 無權自動建立 site    | 完成 **A + B**；勿依賴 `enablement: true`                         |
| Node.js 20 deprecated（configure-pages@v5）                             | runner 強制 Node 24 的警告 | 可忽略，不擋部署                                                  |
| 404 但 workflow 綠                                                      | `base` 路徑錯              | 確認 `docs/.vitepress/config.mts` 的 `base: "/ai-search-portal/"` |
| pnpm version 衝突                                                       | 重複宣告 pnpm 版本         | 已對齊 `ci.yml`（2026-07-13）                                     |

## 本機預檢

```powershell
cd C:\Users\11412616t\ai-search-portal
pnpm run docs:build
# 產物：docs/.vitepress/dist
```
