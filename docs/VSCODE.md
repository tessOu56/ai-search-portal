# VS Code / Cursor 擴充推薦

本專案以 **Remix + React + TypeScript + Git flow** 為前提，偏向「實務穩定、低心智負擔」的擴充清單。  
Clone 後開啟專案時，VS Code / Cursor 會提示「此工作區有擴充推薦」；可**全部安裝**或依下方分類自行挑選。

說明：**必要** = 強烈建議裝、**可選** = 視個人/團隊、**視團隊** = 依協作習慣決定。

---

## 核心必裝（幾乎沒有爭議）

| 擴充                                                        | 用途                                                                                                           |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **ESLint** (`dbaeumer.vscode-eslint`)                       | 靜態分析核心。專案中負責避免隱性錯誤（未使用變數、hooks 規則等），非僅風格。前提是專案 ESLint 規則已定義清楚。 |
| **Prettier** (`esbenp.prettier-vscode`)                     | 只處理格式，不碰語意。與 ESLint 分工清楚時協作成本最低。                                                       |
| **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) | class 自動完成與衝突提示。Remix + Tailwind / shadcn 專案中幾乎標配，可減少 class 拼錯。                        |

---

## React / Remix 開發體驗

| 擴充                                                              | 用途                                                    |
| ----------------------------------------------------------------- | ------------------------------------------------------- |
| **Path Intellisense** (`christian-kohler.path-intellisense`)      | 補齊 import 路徑。Remix 路徑多時可減少路徑寫錯。        |
| **ES7+ React/Redux Snippets** (`dsznajder.es7-react-js-snippets`) | 快速產生 function component、hooks 結構，減少重複打字。 |
| **Remix Dev Tools** (`remix-run.remix-dev-tools`)                 | Remix 官方除錯工具，輕量可選。                          |

**TypeScript / 自動 import**：多數情況 VS Code 內建 + 專案 `~/` alias 已足夠，可不另裝 TypeScript Importer。

---

## 測試與除錯

| 擴充                                           | 用途                                                                  |
| ---------------------------------------------- | --------------------------------------------------------------------- |
| **Vitest** (`vitest.explorer`)                 | 在編輯器內執行、除錯、watch Vitest 測試。專案使用 Vitest 時建議安裝。 |
| **JavaScript Debugger** (`ms-vscode.js-debug`) | 內建 JS/TS 除錯，通常已內含。                                         |

---

## Git 與協作（可選）

| 擴充                                 | 用途                                                           |
| ------------------------------------ | -------------------------------------------------------------- |
| **GitLens** (`eamodio.gitlens`)      | 檢視誰改、為何改，理解歷史與 legacy。不建議用它做複雜 rebase。 |
| **Git Graph** (`mhutchie.git-graph`) | 視覺化 branch / PR 關係，對多分支策略與新成員有幫助。          |

---

## 品質與可讀性（視個人偏好）

| 擴充                                    | 用途                                                           |
| --------------------------------------- | -------------------------------------------------------------- |
| **Error Lens** (`usernamehw.errorlens`) | 錯誤直接顯示在行內。TS 密集時直觀，部分人覺得畫面較滿。        |
| **Todo Tree** (`gruntfuggly.todo-tree`) | 集中檢視 TODO / FIXME。不適合「嚴禁 TODO 留 codebase」的團隊。 |

---

## 依編輯器（可選）

| 擴充                            | 用途                                       |
| ------------------------------- | ------------------------------------------ |
| **Cursor** (`anysphere.cursor`) | 若使用 Cursor 作為編輯器可安裝，其餘可略。 |

---

## 不需特別安裝

- **Remix 專用擴充**：除上述 Remix Dev Tools 外，不需再找其他 Remix 專用擴充；Remix 本質是 React + Web APIs，顧好 ESLint / TS / React 工具鏈即可。
- **魔法型擴充**：不建議裝會自動改架構、強改 import 的擴充，易與專案既有規範衝突。

---

## 安裝方式

1. Clone 專案後用 VS Code 或 Cursor 開啟專案資料夾。
2. 若出現「此工作區有擴充推薦」，點 **「安裝全部」** 或依 `docs/VSCODE.md` 自行勾選。
3. 未自動跳出時：`Ctrl+Shift+X`（擴充）→ 搜尋上述名稱，或由 **指令面板** 執行「Extensions: Show Recommended Extensions」。

專案內 `.vscode/extensions.json` 即為推薦清單；`.vscode/settings.json` 已配合 ESLint、Prettier、Tailwind 做儲存時格式與檢查。
