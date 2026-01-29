# AI 搜尋入口

基於 Remix 框架建置的智能 AI 搜尋平台。

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

## 開發

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 建置生產版本
npm run build

# 啟動生產伺服器
npm start
```

## 開發流程（協作規範）

- 本地檢查：`npm run lint`、`npm run typecheck`
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
3. 導入 GitHub 倉庫
4. Vercel 會自動偵測 Remix 專案並完成部署

### 方法 2: 使用其他 Node.js 平台

- **Railway**: 連接 GitHub 倉庫即可自動部署
- **Render**: 選擇 Node.js 環境並設定建置命令為 `npm run build`
- **Fly.io**: 需要額外設定 Dockerfile

## 功能

- 🔍 AI 智能搜尋
- 🎨 現代化 UI 設計
- 📱 響應式設計
- ⚡ 快速載入
