# Theme 目錄（預留）

此目錄用於 **token / 主題** 的擴充，與「UI kit 可換、骨架不換」架構對齊。見 [docs/architecture/design-system.md](../../../docs/architecture/design-system.md) 的「骨架 vs 視覺／UI kit」。

## 用途

- **目前**：應用主題由 `app/tailwind.css` 提供（`:root` / `.dark` 的 CSS 變數），對應當前選用的 UI kit 的 design tokens。
- **預留**：日後若引入第二套 UI kit 或需多 theme 並存，可在此新增例如 `flowbite.css`、`untitled.css`，內含該 kit 的 CSS 變數覆寫（或 `@import` 該 kit 的 token 產物）。
- **入口**：應用入口（`app/root.tsx`）只會 import **單一** theme。目前為 `../tailwind.css`；未來可改為本目錄下的 `current.css` 或依環境選擇對應 theme 檔。

## 換 UI kit 時

1. 更新或新增本目錄下的 `<kit>.css`（或改寫根目錄 `app/tailwind.css`），使 token 對應新 kit。
2. 若有 kit 專用元件層，替換 `app/components/theme/*` 內容。
3. 不改動 `app/components/ui/*`（骨架層）。
