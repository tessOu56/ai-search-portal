# Theme 元件層（預留）

此目錄為 **可隨 UI kit 替換** 的元件層，與「骨架穩定、UI kit 可換」架構對齊。見 [docs/architecture/design-system.md](../../../docs/architecture/design-system.md) 的「骨架 vs 視覺／UI kit」。

## 用途

- 僅放與 **當前 UI kit／視覺** 強相關的內容，例如：
  - 某 kit 專用的 **wrapper**（包 `ui/Button` 並加上 kit 專用 `className`），或
  - 某 kit 才有的 **variant 擴充**（若不想改動 `ui/Button.tsx`，可在此用 wrapper 提供額外樣式）。
- **不放** 通用 primitives；primitives 一律在 `app/components/ui/*`。

## 依賴規則

- `theme/*` 僅能依賴 `app/components/ui/*` 與 `app/shared/utils`（如 `cn`）。
- routes / features 建議預設使用 `ui/*`；僅在必要時（例如 kit 專用樣式）使用 `theme/*`。

## 換 UI kit 時

- 只替換此目錄內容（與 `app/styles/themes/*` 的 token 檔）。
- **不**改動 `app/components/ui/*`（骨架層）。
