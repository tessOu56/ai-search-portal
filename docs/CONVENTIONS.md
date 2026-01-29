# 專案規範（開發管控）

本文件為 AI 輔助開發（Cursor 等）與人工協作時共同遵守的規範，包含命名、結構與檢查方式。

## 檔案與資料夾命名

### 資料夾

- **規則**：僅使用**小寫英文字母與數字**，不使用連字號、底線或駝峰。
- **範例**：`chat`、`ui`、`lui`、`errorboundary`、`features`、`shared`。
- **錯誤**：`error-boundary`、`ErrorBoundary`、`chat_interface`。
- **適用範圍**：`app/` 下除 `app/routes` 外之所有資料夾（`app/routes` 依 Remix 慣例可含 `_`、`$` 等）。

### 元件檔（React / UI）

- **路徑**：`app/components/**/*.tsx`。
- **規則**：檔名（不含副檔名）為 **PascalCase**。
- **範例**：`ChatInterface.tsx`、`ErrorBoundaryFallback.tsx`、`Button.tsx`。
- **例外**：`index.ts` / `index.tsx` 作為 barrel 可接受。

### 其他程式檔

- **features / services / shared**：可為小寫 + 點號（如 `dish.server.ts`、`dish.types.ts`）或小寫（如 `cn.ts`、`errors.ts`），與現有專案一致即可。
- **routes**：依 Remix 慣例（如 `_index.tsx`、`api.chat.ts`），不在此命名檢查範圍。

### 簡表

| 位置                         | 類型      | 規則           | 範例                        |
| ---------------------------- | --------- | -------------- | --------------------------- |
| `app/**` 資料夾（非 routes） | 資料夾    | 小寫、無分隔符 | `errorboundary`             |
| `app/components/**`          | `.tsx` 檔 | PascalCase     | `ErrorBoundaryFallback.tsx` |
| `app/components/**`          | barrel    | `index.ts`     | `index.ts`                  |

## 檢查方式

- **ESLint**：程式碼與 import 等由既有 ESLint 規則檢查。
- **檔名 / 資料夾名**：由 `npm run lint:filenames` 檢查，CI 與 pre-commit 會執行。
- 新增或重新命名檔案、資料夾後請執行 `npm run lint:filenames` 或透過 commit 觸發檢查。

## AI 輔助開發（Cursor / 其他）

- 建立新元件時：資料夾用**小寫無分隔符**，元件檔用 **PascalCase**。
- 勿使用 kebab-case（`error-boundary`）或 camelCase 資料夾（`errorBoundary`）作為元件目錄名。
- 其餘程式風格依 `.cursor/rules` 與本目錄下 `ARCHITECTURE.md`、`DESIGN_SYSTEM.md`。
