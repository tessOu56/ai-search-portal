# References 設計系統

**類型**：reference | **權重**：2

本專案採用 **reference-based 設計系統**：不直接將外部 UI kit 的程式碼或 token 當作唯一來源，而是**在 repo 內維護單一實作層**（tokens、primitives、patterns），同時在文件中明確標註參考來源，方便日後更換或擴充工具庫。

設計系統整體說明見：

- [design-system](design-system.md) — Design System 與半自動化 UI、骨架 vs 視覺／UI kit
- [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) — Design tokens、Core components、Usage guidelines、Token Source of Truth

---

## 一、Reference-based 設計系統的前提

- **單一實作層**：不論參考多少外部 UI kit，**程式碼實作一律以本 repo 為準**。
  - Tokens：實作於 `app/tailwind.css` 與預留的 `app/styles/themes/*`。
  - Primitives：實作於 `app/components/ui/*`。
  - Patterns：實作於 `app/components/shared/*`（例如 chat、lui 等）。
- **外部 kit 僅作「參考」**：Figma 檔、UI kit 文件、樣式範例只作為設計／產品參考；不得直接變成第二套 primitives 或獨立 token source。
- **Token canonical 在 repo**：token 與變數的 canonical 位置在 repo（見 [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) 的「Token Source of Truth」），Figma 僅提供 context。Figma MCP 僅讀取設計稿與 variables，不直接修改 layout 或新增 primitives，詳見 [figma-mcp](figma-mcp.md)。

---

## 二、三個主要參考來源與對應

本專案目前的 reference 設計系統由三個維度組成：**Tokens、Primitives、Patterns**。

### 1. Tokens 參考：Untitled UI（style foundation）

- **角色**：提供色彩系統、灰階階層、spacing、radius 等「風格基礎」參考。
- **實作位置**：
  - `app/tailwind.css`：目前預設 theme（`:root` / `.dark`）的 CSS 變數與 Tailwind 設定。
  - `app/styles/themes/*`：預留多 theme／多 kit 視覺，例如 `untitled.css`。
- **原則**：
  - 僅將 Untitled UI 的 tokens 作為「設計參考」，轉寫為本 repo 的 CSS 變數與 Tailwind config。
  - 不直接複製 Untitled 的 token 命名；需經過 **Token Transformation Layer** 與命名策略整理（見 [figma-mcp](figma-mcp.md)）。
  - 新增或調整 token 時，需更新 DESIGN_SYSTEM.md 與相關 theme 檔，並可搭配 lint 或 CI 檢查。

### 2. Primitives 參考：shadcn/ui（code components）

- **角色**：作為 React + Tailwind 的 **唯一 primitive 元件來源**，提供 Button、Card、Input、Alert 等 UI primitives。
- **實作位置**：
  - `app/components/ui/*`：所有 primitives 均在此維護。
- **原則**：
  - 嚴格遵守 [coding-conventions](../conventions/coding-conventions.md) 與 [design-system](design-system.md) 中的「骨架」定義：`ui/*` 為骨架層，**不隨 UI kit 或 theme 更換而改動**。
  - 外部 UI kit 不得在 `ui/*` 下新增第二套 Button / Card 等 primitives，避免分裂與治理困難。
  - 若某 kit 需要特殊外觀，優先透過 theme（tokens）或 `app/components/theme/*` 的 wrapper 實現。

### 3. Pattern 參考：Nocra / AI UI kit（layout、UX）

- **角色**：提供 AI Chat / Agent UI、SaaS dashboard、空狀態與 onboarding 等「畫面模式」與 UX 範本。
- **實作位置**：
  - `app/components/shared/chat/*`、`app/components/shared/lui/*` 等，依實際 domain 分類。
- **原則**：
  - Patterns 僅由 primitives 和 shared 元件組合而成，不直接引入外部 kit 的程式碼。
  - Pattern 層專注於「結構與互動」，視覺風格則交由 tokens 與 theme 控制。
  - AI Chat / Agent UI pattern 的專屬規則可集中在對應的 shared 目錄與 docs/product 中說明。

---

## 三、未來擴充其他 UI kit 的方式

當需要導入新的 UI kit（例如 Flowbite、其他 SaaS kit）時，流程建議如下：

1. **文件先行**：在本檔或新節點中加入該 kit 的 reference 條目，說明其擅長面向（如表格、表單、導航）。
2. **Tokens 對應**：
   - 盤點該 kit 的 color / spacing / radius / shadow tokens。
   - 透過 Token Transformation Layer（可配合 Figma MCP 或手動 mapping）將其轉為本 repo 的 CSS 變數與 Tailwind 設定。
   - 在 `app/styles/themes/` 中新增對應 theme 檔（例如 `flowbite.css`），以 `[data-theme="flowbite"]` 包裹覆寫。
3. **Patterns 對應**：
   - 從該 kit 的 Figma / 文件中抽取常見畫面（列表、表單 wizard、統計總覽等）。
   - 使用既有 `ui/*` primitives 與 shared 元件組裝出相近 layout，不新增第二套 primitives。
4. **實作與驗證**：
   - 在 docs 中記錄 token 對應表與 pattern 對照。
   - 新增最小 demo route 或 component 展示該 kit 視覺下的代表頁（類似 Hybrid Workspace demo 的 SaaS 視圖）。

---

## 四、元件與檔案命名原則（與 references 對齊）

- **資料夾**：`app/` 下（除 `app/routes`）一律小寫、無連字號與底線（例如 `ui`、`shared`、`workspace`、`theme`）。
- **元件檔**：`*.tsx` 使用 PascalCase，例如 `WorkspaceViewSwitcher.tsx`、`ChatInterface.tsx`，與本 repo coding conventions 一致。
- **分層放置**：
  - primitives → `app/components/ui/*`
  - kit surface / wrapper → `app/components/theme/*`
  - semantics / patterns → `app/components/shared/*`
  - app-level 組合（例如 hybrid workspace 容器）→ `app/components/app/*`

詳見：

- [coding-conventions](../conventions/coding-conventions.md)
- [repo-layers](repo-layers.md)

---

## 五、與 Hybrid Workspace Demo 的關係

Hybrid Workspace 首頁 demo 是此 reference-based 設計系統的一個 **示範場景**：

- 同一組 primitives（`app/components/ui/*`）、同一組 shared 元件（例如 ChatInterface），
- 透過 **不同 theme**（default vs Untitled 風格）與 layout pattern，呈現：
  - **AI Chat 為主** 的 LUI 視圖。
  - **SaaS Untitled UI 風格為主** 的 dashboard 視圖。

二者共用相同骨架，僅在 tokens 與 layout pattern 上有所差異，有助於驗證「UI kit 可換、骨架不換」的架構與治理策略。
