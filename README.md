# AI Search Portal

> **用 AI 找資料與申請存取——可加速，但永遠能降級成手動，且每步可稽核。**

**痛點**：企業導入 AI 搜尋後最常見的失敗不是「AI 不夠聰明」，而是 AI 出錯時使用者無路可退、治理流程不可稽核——資料團隊因此不敢把 AI 放進資料存取的關鍵路徑。

**承諾（本產品證明的三件事）**：

1. **Dual-path**：每條 AI 流程都有對應的手動畫面；AI 串流失敗時 `AiFallbackPanel` 保留你的輸入、預填 `?q=` 交給手動目錄搜尋接手
2. **HITL 可稽核**：存取申請走 policy 評估 → 人工確認 → 狀態機（`approved / pending_approval / denied`）＋稽核旗標；這條手動路徑有 Playwright E2E 把關（`e2e/access-request.spec.ts`，PR 必跑）
3. **來源／信心度**：AI 回覆附 confidence 與 sources，mock 誠實標示——不假裝有真 LLM

**非目標**：這不是完整的企業 Catalog SaaS（不做連線器、多租戶、合規認證、銷售通路）。這是「可信 AI 資料發現」的**參考產品**——證明體驗與治理模式，domain 知識放在可換裝的 context pack，不寫死在核心。

## 數字卡（證據）

| 證據                                   | 數字                                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 治理申請 E2E（狀態機斷言，非 UI 文案） | 4 tests，PR 必跑，離線自足                                                                        |
| 10k 列虛擬列表 vs naive 渲染           | **10000 → 23 DOM nodes（−99.8%）**（[perf note](docs/perf/catalog-dictionary-virtualization.md)） |
| Contract 管線                          | OpenAPI codegen＋Spectral lint＋drift check＋zod v4，CI 亮紅可擋                                  |
| 離線 AI 評測                           | `eval:offline` 於 CI 執行（lab-eval-runner）                                                      |

視覺層採外接元件系統 [explore-design-sdk](https://github.com/tessOu56/explore-design-sdk)（semantic tokens × application maps），portal 不自持 design tokens。

## Portfolio / 履歷

| 資源                                                                     | 說明                               |
| ------------------------------------------------------------------------ | ---------------------------------- |
| [docs/RESUME-DEMO.md](docs/RESUME-DEMO.md)                               | 3 分鐘 demo 腳本、檢查清單、履歷句 |
| [docs/product/ai-experience-plan.md](docs/product/ai-experience-plan.md) | AI 體驗流程 × 手動畫面規劃 SSOT    |

**本地 demo**：`pnpm dev` → `/`（chat＋3 題 golden demo）→ `/catalog-search`（`?type=`＋分頁）→ `/catalog-search/dictionary`（10k 虛擬列表）→ `/metadata/tbl-customers?purpose=marketing&role=analyst`（治理申請 HITL）。

## 技術棧

- **框架**: Remix v2 + React 18
- **語言**: TypeScript
- **建置**: Vite
- **樣式**: Tailwind CSS
- **部署**: Vercel (推薦) / 其他 Node.js 平台 / Docker

## 架構概覽（大型協作向）

此專案以「features 模組化」為核心，降低跨功能耦合。

- `app/features/*`: 功能模組（hook/server/types）
- `app/shared`: 跨模組共用邏輯（service/types/utils）
- `app/services`: 應用層 service（整合或計算）
- `app/routes`: Remix 路由層

完整架構與協作規範請見 `docs/ARCHITECTURE.md`、`docs/DESIGN_SYSTEM.md` 與 `CONTRIBUTING.md`。

**架構範本與可套用性**：本專案之 specs/docs、AGENTS.md、AGENT_CAPABILITIES.md 分層、契約與依賴規則、tool adapter 設計，可作為它專案之參考或複用；詳細對應見 [docs/README.md](docs/README.md)、[AGENTS.md](AGENTS.md)、[AGENT_CAPABILITIES.md](AGENT_CAPABILITIES.md)。每階段工作後保持規格與現況一致請依 [docs/code-review-spec.md](docs/code-review-spec.md)（Code Review 規範）。

## 開發

```bash
# 安裝依賴（需先 corepack enable，見 CONTRIBUTING.md）
pnpm install

# 啟動開發伺服器
pnpm run dev

# 建置生產版本
pnpm run build

# 啟動生產伺服器
pnpm start
```

## 開發流程（協作規範）

- 本地檢查：`pnpm run lint`、`pnpm run typecheck`
- 預提交：`lint-staged` 自動修正 ESLint/Prettier
- CI：PR 必跑 `lint:strict` + `typecheck` + `knip`

## Cursor 開發規範

- 以最小變更完成需求，避免無關重構或格式化
- 變更前先讀相關檔案並說明影響範圍
- 修改後確認型別/編譯/格式/測試（視專案腳本而定）
- 不提交任何機敏資訊（`.env`、金鑰、憑證）
- 提交訊息需描述原因與影響，不只描述表面改動

## 部署到 GitHub

### 方法 1: 使用 Vercel (推薦)

1. 將專案推送到 GitHub 倉庫
2. 前往 [Vercel](https://vercel.com) 並登入
3. 導入 GitHub 倉庫並綁定專案（取得 `VERCEL_TOKEN` / `ORG_ID` / `PROJECT_ID`）
4. 在 GitHub Actions 使用：
   - `.github/workflows/release.yml`（手動建立版本 tag + GitHub Release）
   - `.github/workflows/deploy-vercel.yml`（手動部署 preview/production，可指定 ref）
5. 建議在 GitHub 設定 `production` environment reviewers，以控制上線權限

### 方法 2: 使用其他 Node.js 平台

- **Railway**: 連接 GitHub 倉庫即可自動部署
- **Render**: 選擇 Node.js 環境並設定建置命令為 `pnpm run build`（並啟用 pnpm／Corepack 與本 repo 的 `packageManager`）
- **Fly.io**: 需要額外設定 Dockerfile

## 功能

- 🔍 AI 智能搜尋
- 🎨 現代化 UI 設計
- 📱 響應式設計
- ⚡ 快速載入
