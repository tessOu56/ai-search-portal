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

### 現況：chat a11y + 語音輸入已上線（T-2026-078）

- **有**：`<html lang>`；skip link `a11y.skipToContent` → `#main-content`；`eslint-plugin-jsx-a11y`；Radix / Alert ARIA（錯誤 `role="alert"`）；chat history `role="log"` + polite live region（串流中只公告等待，完成後公告摘要／全文，避免 token 洗版）；composer 送出與麥克風皆有 `aria-label`。
- **語音**：共用 `Composer` 在 `SpeechRecognition`／`webkitSpeechRecognition` 可用時顯示麥克風；權限拒絕或不支援不擋鍵盤；辨識結果填入輸入框，由使用者按送出。文案鍵 `composer.voice.*`。
- **規劃**：[docs/product/a11y-voice-plan.md](./product/a11y-voice-plan.md)（Phase 3 TTS 仍未做）。

---

## 總結

| 項目       | 現況                                | 建議                     |
| ---------- | ----------------------------------- | ------------------------ |
| **打版號** | Changesets + footer version         | 維持                     |
| **多語系** | 手動字典 + locale 切換              | 版權與 UI 文案皆走 i18n  |
| **無障礙** | skip link、chat live、composer 語音 | TTS 為後續；axe 抽檢維持 |
