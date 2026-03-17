# Design System 與半自動化 UI

**類型**：reference | **權重**：2

本專案朝向 **逐漸建立 Design System**，並以 **半自動化 UI 處理** 維持一致性與可維護性：單一來源的設計 token、元件層與使用規範，未來可搭配工具（如元件目錄、lint 規則）減少手動重複。

---

## 目標

- **單一來源**：顏色、間距、元件 API 以 [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) 與 `app/components/ui/*` 為準。**Token canonical 在 repo**（見 DESIGN_SYSTEM.md「Token Source of Truth」）；Figma 為設計參考，同步規則見 [figma-mcp](figma-mcp.md)。
- **漸進建立**：先穩固 core 元件與 tokens，再擴充語義元件與複合元件；不追求一次到位。
- **半自動化**：透過規範與約定減少 ad-hoc 樣式；後續可引入元件文件站、ESLint 規則（如偏好 design system 元件）等。

---

## 分層結構（與 docs/DESIGN_SYSTEM.md 對齊）

| 層級                | 路徑                                | 說明                                                            |
| ------------------- | ----------------------------------- | --------------------------------------------------------------- |
| **Design Tokens**   | `app/tailwind.css`、Tailwind config | brand、semantic、border 等；頁面與元件使用 token，不寫魔術數字  |
| **Core / UI 元件**  | `app/components/ui/*`               | 最小顆粒、以 cva 定義 variants（Button、Input、Card、Alert 等） |
| **語義 / 領域元件** | `app/components/shared/lui/*` 等    | 基於 UI 元件的語義組合（如 ChatBubble）                         |
| **複合元件**        | `app/components/shared/chat/*` 等   | 組合多個 UI + 語義元件（如 ChatInterface）                      |
| **頁面**            | `app/routes/*`                      | 使用 Container / Card 等約定，透過 variant API 調整樣式         |

---

## 骨架 vs 視覺／UI kit

為預留 **UI kit 可換、骨架不換** 的擴充：

- **骨架（Skeleton）**：`app/components/ui/*`（shadcn primitives）。元件 API、結構、行為與無障礙以此為準；**不隨 UI kit 更換而改動**。
- **視覺（Token / 主題）**：`app/tailwind.css`（目前預設）、預留 `app/styles/themes/`。顏色、間距、圓角、陰影等數值；換 kit 時改 token 來源或 theme 檔即可。
- **Kit 表面（可選）**：`app/components/theme/*`。僅放與當前 UI kit 強相關的 wrapper 或 variant 擴充；換 kit 時只替換此目錄與 theme 檔，**不改** `app/components/ui/*`。

依賴：`theme/*` 僅能依賴 `ui/*` 與 shared utils；routes/features 預設使用 `ui/*`，必要時再用 `theme/*`。詳見 `app/components/theme/README.md`、`app/styles/themes/README.md`。

---

## 半自動化策略（漸進）

1. **現況**：DESIGN_SYSTEM.md 記載 tokens、core 元件、使用準則；[coding-conventions](../conventions/coding-conventions.md) 規定元件檔名 PascalCase、資料夾小寫；程式內使用 `variant` 與 token class，避免內聯魔術數字。
2. **規範先行**：新 UI 優先使用 `app/components/ui/*` 與既有語義元件；大區塊用 Card、行動用 Button、提示用 Alert。
3. **未來可選**：元件目錄（Storybook 或自建 catalog）、ESLint 規則提醒使用 design system 元件、設計稿與 token 同步流程。Figma 端 design pattern / UI kit 選型見 [design-pattern-ui-kit](design-pattern-ui-kit.md)。

---

## 與乾淨架構的關係

- **UI 層** 屬乾淨架構最外層；Design System 元件不包含業務邏輯，只負責呈現與可存取性。
- **業務規格（docs/product）** 可描述「畫面上需要什麼區塊與行為」，實作時由 routes/components 選用 design system 元件組裝，不背離規格。

---

## 相關

- [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)：Design tokens、Core components、Usage guidelines、LUI copy style、Token Source of Truth
- [design-system-references](design-system-references.md)：Reference-based 設計系統、外部 UI kit 對照與單一實作層
- [design-pattern-ui-kit](design-pattern-ui-kit.md)：Figma UI kit 選型評估、候選對照、導入前驗證
- [figma-mcp](figma-mcp.md)：Figma MCP 架構、設計稿與 token 同步、導入順序
- [coding-conventions](../conventions/coding-conventions.md)：元件與資料夾命名、lint:filenames
- [overview](../product/overview.md)：功能一覽（含 UI 技術棧）
- [clean-architecture](clean-architecture.md)：UI 在架構中的位置
