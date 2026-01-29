# 專案能力現況：版號、多語系、無障礙

本文件說明專案在**打版號、多語系、無障礙**的現況與可選改進，供協作與規劃參考。

---

## 1. 打版號（Versioning）

### 現況：有流程，無 UI 顯示

- **有**：使用 **Changesets**（`@changesets/cli`）管理版本與 CHANGELOG。
  - PR 內執行 `npm run changeset` 選擇變更類型（major/minor/patch）並填寫說明。
  - 發版時在 main 上執行 `npm run changeset:version`（更新版號與 CHANGELOG）、`npm run changeset:publish`（若為可發佈套件）。
  - 詳見 `docs/DEVELOPMENT.md`。
- **沒有**：專案為 `"private": true`，沒有在 **UI 上顯示版號**（例如 footer 的「v1.2.3」）。

### 可選改進

- **在頁面顯示版號**：建置時將版號注入環境變數或 JSON，root 或 footer 讀取並顯示（例如從 `package.json` 的 `version` 或 Vercel 的 `VERCEL_GIT_COMMIT_SHA` 簡短版）。
- **Release 流程**：可加 GitHub Action 在 main 合併 changeset 後自動跑 `changeset version` 並 commit，或手動發版。

---

## 2. 多語系（i18n）

### 現況：無

- **沒有**：未引入 i18n 套件，無翻譯檔、無語系切換、無 `useTranslation`。
- 僅在 `app/root.tsx` 設定 `<html lang="zh-TW">`，介面文案皆為中文寫死。

### 可選改進（若未來要支援多語）

| 方案              | 說明                                                                           |
| ----------------- | ------------------------------------------------------------------------------ |
| **remix-i18next** | Remix 常見搭配，支援 server/client、namespace、locale 切換。                   |
| **Paraglide**     | 輕量、型別友善，編譯期產出翻譯。                                               |
| **手動字典**      | 自建 `locale/zh.json`、`locale/en.json` + context 或 loader 注入，無額外套件。 |

引入後需決定：預設語系、語系切換方式（URL / cookie / 選單）、Remix loader 如何帶入 locale。

---

## 3. 無障礙（Accessibility / a11y）

### 現況：部分具備

- **有**：
  - `<html lang="zh-TW">` 已設定，利於螢幕朗讀與語言判定。
  - **ESLint**：`@remix-run/eslint-config` 已包含 `eslint-plugin-jsx-a11y`，會檢查部分 a11y 問題（例如圖片 alt、表單 label）。
  - 部分元件具語意或 ARIA：例如 `Alert` 使用 `role="alert"`；Radix UI 元件（Button、ScrollArea 等）自帶一定鍵盤與 ARIA 支援。
- **尚未系統化**：
  - 無 **Skip Link**（跳過主內容的連結）。
  - 未全面檢查表單與互動元件的 `aria-label` / `aria-describedby`。
  - 未在文件或 PR 檢查清單中明確列出 a11y 要求。

### 可選改進

| 項目           | 說明                                                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Skip Link**  | 在 `root.tsx` 主內容前加「跳至主內容」連結，並以 CSS 僅在 focus 時顯示，利於鍵盤與螢幕朗讀。                           |
| **焦點與鍵盤** | 確認所有互動元件可鍵盤操作、焦點順序合理；Modal / 下拉關閉時焦點回到觸發元素。                                         |
| **表單與按鈕** | 表單欄位對應 `<label>` 或 `aria-label`；圖標按鈕提供 `aria-label`。                                                    |
| **a11y 檢查**  | 可選：加入 **axe-core** 或 **eslint-plugin-jsx-a11y** 更嚴格規則；PR 或發版前手動用瀏覽器擴充（如 axe DevTools）抽檢。 |
| **文件**       | 在 `CONTRIBUTING.md` 或本文件註明「新 UI 需考慮無障礙（鍵盤、ARIA、對比）」。                                          |

---

## 總結

| 項目       | 現況                           | 建議                                                                    |
| ---------- | ------------------------------ | ----------------------------------------------------------------------- |
| **打版號** | 有 Changesets 流程，無 UI 版號 | 可選：建置時注入版號並在 footer 顯示；自動化 changeset version。        |
| **多語系** | 無                             | 若需要：引入 remix-i18next / Paraglide 或手動字典，並訂語系與切換方式。 |
| **無障礙** | 有 lang、jsx-a11y、部分 ARIA   | 可選：Skip Link、系統化 aria/鍵盤、a11y 檢查與文件。                    |

若你希望，我可以下一步幫你：

- 在 root/footer 加「版號顯示」範例，或
- 在 root 加 Skip Link 與簡短 a11y 說明，或
- 在 `CONTRIBUTING.md` 加一節「無障礙與多語系」指引。
