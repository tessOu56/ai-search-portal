# 部署（GitHub + Vercel，可控版）

**類型**：runbook | **權重**：2

本專案使用 **GitHub Actions 控版控與部署節奏**，部署目標為 **Vercel**。  
重點：CI 自動、Release 手動、Deploy 手動（preview / production 皆可指定 ref）。

## Workflow 一覽

| Workflow         | 檔案                                  | 觸發                | 用途                                        |
| ---------------- | ------------------------------------- | ------------------- | ------------------------------------------- |
| CI               | `.github/workflows/ci.yml`            | PR、push `main`     | 品質閘門（build / test / lint / typecheck） |
| Release          | `.github/workflows/release.yml`       | `workflow_dispatch` | 建立 tag + GitHub Release（可 prerelease）  |
| Deploy to Vercel | `.github/workflows/deploy-vercel.yml` | `workflow_dispatch` | 手動部署至 Vercel（preview / production）   |

## 必要 GitHub Secrets（repository 或 environment）

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

建議在 GitHub 建立兩個 Environment：

- `preview`
- `production`

並把同名 secrets 設在對應 environment，搭配 reviewers/protection 控制 production 部署權限。

## 建議 Vercel 專案設定

- 保留 Vercel 與 GitHub 連線（供 metadata 與 preview 記錄）。
- 將 production 的實際上線操作統一由 **GitHub `Deploy to Vercel` workflow** 觸發。
- 若需完全避免「push main 自動上線」，請在 Vercel 專案設定停用 Git auto-deploy（或限制 production branch），把上線權限集中在 GitHub workflow + environment approvals。

## 發版流程（版控）

1. 開發於 `feature/*`，PR 合併到 `main`（CI 必須全綠）。
2. 需對外版本時，手動執行 **Release workflow**：
   - `version`: `vX.Y.Z`（或 `X.Y.Z`）
   - `target_ref`: 預設 `main`（也可指定 SHA）
   - `prerelease`: true/false
3. workflow 會建立 tag 並產生 GitHub Release（含 auto notes）。

## 部署流程（可控）

1. 手動執行 **Deploy to Vercel** workflow：
   - `environment`: `preview` 或 `production`
   - `target_ref`: branch/tag/SHA（預設 `main`）
2. workflow 會先執行：
   - `pnpm install --frozen-lockfile`
   - `pnpm run lint:openapi`
   - `pnpm run verify:openapi-codegen`
3. 通過後才部署至 Vercel，並在 Job Summary 顯示 deploy URL。

## 版本與 Changelog（Changesets）

- 使用 **@changesets/cli** 管理版本與 CHANGELOG。
- 對外可見變更請在 PR 內執行 `pnpm run changeset`。
- 手動 release 前可先在本地跑 `changeset version` 並提交（視團隊流程），或用 GitHub Release notes 做階段性發布記錄。

## 相關

- [local-dev](local-dev.md)：分支、PR、CI 與保護策略
- [CONTRIBUTING.md](../../CONTRIBUTING.md)：Quality checks
