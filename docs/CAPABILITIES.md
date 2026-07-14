# 專案能力現況：版號、多語系、無障礙

**類型**：reference | **權重**：2

本文件說明專案在**打版號、多語系、無障礙**的現況與可選改進，供協作與規劃參考。  
（與根目錄 **AGENT_CAPABILITIES.md** 不同：該檔為 agent 能力邊界與 agent class；本檔為產品／技術能力現況。）

---

## 1. 打版號（Versioning）

### 現況：有流程，無 UI 顯示

- **有**：使用 **Changesets**（`@changesets/cli`）管理版本與 CHANGELOG。
  - PR 內執行 `pnpm run changeset` 選擇變更類型（major/minor/patch）並填寫說明。
  - 發版時在 main 上執行 `pnpm run changeset:version`（更新版號與 CHANGELOG）、`pnpm run changeset:publish`（若為可發佈套件）。
  - 詳見 `docs/DEVELOPMENT.md`。
- **沒有**：專案為 `"private": true`，沒有在 **UI 上顯示版號**（例如 footer 的「v1.2.3」）。

### 可選改進

- **在頁面顯示版號**：建置時將版號注入環境變數或 JSON，root 或 footer 讀取並顯示（例如從 `package.json` 的 `version` 或 Vercel 的 `VERCEL_GIT_COMMIT_SHA` 簡短版）。
- **Release 流程**：可加 GitHub Action 在 main 合併 changeset 後自動跑 `changeset version` 並 commit，或手動發版。

---

## 2. 多語系（i18n）

### 現況：有（手動字典）

- Cookie / Accept-Language locale（`zh-TW` · `en`）。
- 翻譯在 `app/shared/i18n/translations/*.json`；`{year}` / `{version}` 等 placeholder 於 runtime 插值。
- **版權年**勿寫死：`footer.copyright` 用 `© {year} …` + `new Date().getFullYear()`。

---

## 3. 無障礙（Accessibility / a11y）

### 現況：部分具備 + 規劃中

- **有**：`<html lang>`；`eslint-plugin-jsx-a11y`；部分 Radix / Alert ARIA；chat history `role="log"` + polite live region（起步）；home ask 圖示按鈕含 `aria-label`。
- **規劃 SSOT**：[docs/product/a11y-voice-plan.md](./product/a11y-voice-plan.md) · ticket **T-2026-078**（語音輸入 Web Speech、chat live region 深化）。

### 目標改進

| 項目          | 說明                                                  |
| ------------- | ----------------------------------------------------- |
| **Skip Link** | `a11y.skipToContent` → 主內容 / `#home-chat`          |
| **Chat live** | 有資料時禮貌公告助理回覆；錯誤用 assertive            |
| **Voice**     | `SpeechRecognition` 能力偵測 + 權限；失敗不擋文字輸入 |
| **檢查**      | axe / jsx-a11y；PR 抽檢                               |

---

## 總結

| 項目       | 現況                        | 建議                            |
| ---------- | --------------------------- | ------------------------------- |
| **打版號** | Changesets + footer version | 維持                            |
| **多語系** | 手動字典 + locale 切換      | 版權與 UI 文案皆走 i18n         |
| **無障礙** | 部分 ARIA + chat live 起步  | 完成 T-2026-078（a11y + voice） |
