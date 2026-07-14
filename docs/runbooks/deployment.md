# 部署（GitHub + Vercel，可控版）

**類型**：runbook | **權重**：2

本專案使用 **GitHub Actions 控版控與部署節奏**，部署目標為 **Vercel**。  
重點：CI 自動、Release 手動；App **preview** 手動驗收、**production** 在 CI 成功後自動或手動部署。文件站走 **GitHub Pages**（見 [github-pages-docs](github-pages-docs.md)），與 App 分離。

## 發布通道

| 通道     | 平台                          | 內容                 |
| -------- | ----------------------------- | -------------------- |
| 文件     | GitHub Pages (`gh-pages`)     | VitePress 靜態站     |
| App 測試 | Vercel **preview** URL        | 完整 Remix SSR + API |
| App 正式 | `ai-search-portal.vercel.app` | production domain    |

對外：文件看 Pages；試產品用 Vercel preview；正式 Demo 用 production domain。

## Workflow 一覽

| Workflow         | 檔案                                  | 觸發                                                                | 用途                                                     |
| ---------------- | ------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------- |
| CI               | `.github/workflows/ci.yml`            | PR、push `main`                                                     | 品質閘門（build / test / lint / typecheck）              |
| Release          | `.github/workflows/release.yml`       | `workflow_dispatch`                                                 | 建立 tag + GitHub Release（可 prerelease）               |
| Deploy to Vercel | `.github/workflows/deploy-vercel.yml` | `workflow_dispatch`；**main CI 成功後** `workflow_run` → production | preview / production 部署至 Vercel                       |
| deploy-docs      | `.github/workflows/deploy-docs.yml`   | push **`docs/**`**（或本 workflow）；`workflow_dispatch`            | VitePress → `gh-pages`（與 Vercel／`package.json` 無關） |

> **獨立通道**：App 上 Vercel、文件走 Pages。改 `package.json`／lockfile **不會**再觸發 `deploy-docs`（避免「跟 Vercel 一起上 gh-pages」的誤感）。依賴變更若需重建文件站：Actions → deploy-docs → Run workflow。

## 冷啟動／LCP（App）

- Document shell **不** `await ensureSeeded()`——氛圍底＋品牌可先畫；seed 留在需要 mock 資料的路由。
- 首頁 LCP 候選：`/marketing/home-atmosphere.*`（prefer webp／svg，目標 **≤ ~200KB**）；`root` links 有 preload。
- Web Vitals 仍走既有 reporter；本輪不開 PostHog P75 真面板。

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

1. **首次或重大變更**：手動執行 **Deploy to Vercel** → `environment: preview`，驗收 `/catalog-search` 等路由後再 production。
2. **main 合併後**：CI 全綠 → `deploy-vercel` 自動以 `workflow_run` 部署 **production**（亦可改用手動 `workflow_dispatch`）。
3. 手動部署參數：
   - `environment`: `preview` 或 `production`
   - `target_ref`: branch/tag/SHA（預設 `main`）
4. workflow 會先執行：
   - `pnpm install --frozen-lockfile`
   - `pnpm run lint:openapi`
   - `pnpm run verify:openapi-codegen`
   - `vercel build`（Linux；需 `vite.config.ts` 內 `process.env.VERCEL` 時啟用 `vercelPreset`）
5. 通過後 `vercel deploy --prebuilt`，Job Summary 顯示 deploy URL。

### 本機注意（Windows）

- **不要**在本機跑 `vercel build --prebuilt`（Remix 動態路由 symlink 含 `:`，Windows 會失敗）。
- 正式部署路徑：**GitHub Actions（ubuntu-latest）** 或 Vercel 雲端 `vercel deploy --prod`（非 prebuilt）。

## 版本與 Changelog（Changesets）

- 使用 **@changesets/cli** 管理版本與 CHANGELOG。
- 對外可見變更請在 PR 內執行 `pnpm run changeset`。
- 手動 release 前可先在本地跑 `changeset version` 並提交（視團隊流程），或用 GitHub Release notes 做階段性發布記錄。

## 相關

- [local-dev](local-dev.md)：分支、PR、CI 與保護策略
- [CONTRIBUTING.md](../../CONTRIBUTING.md)：Quality checks
