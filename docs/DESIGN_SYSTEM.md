# Design System

**類型**：reference | **權重**：2

這份設計系統文件用來維持 UI 一致性與可維護性；專案朝向 **半自動化 UI** 逐漸建立 design system（見 [docs/architecture/design-system.md](architecture/design-system.md)）。
本專案採用 shadcn/ui 作為元件基礎，確保可維護且可客製。

## Token Source of Truth

- **S1 起（2026-07-08）：token canonical 在 [explore-design-sdk](https://github.com/tessOu56/explore-design-sdk)**（`@explore-design/tokens`，application map `portal`），不在本 repo、不在 Figma。
- 消費鏈：SDK `pnpm tokens:css` 產出 `[data-app="portal"]` CSS vars → 同步至本 repo `app/styles/tokens.portal.css`（vendored generated，待套件發布後改 import）→ `app/tailwind.css` 只做「shadcn 變數 ← SDK semantic 變數」橋接 → `tailwind.config.ts` 以 `var(--x)` 完整色值消費。
- **改色請改 SDK 的 `portal.map.json`**，不要動 portal 內任何 CSS 值；`data-app="portal"` 掛在 `app/root.tsx` 的 `<html>`。
- Dark theme 暫由 portal 自持（`app/tailwind.css` `.dark` 段），SDK dark map 為 S2 範圍。
- 理由：CI 可驗證（SDK `tokens:validate`）、version control、跨專案一致（portal / nx / vue 同一 SDK）。
- 設計稿與 token 同步流程見 [docs/architecture/figma-mcp.md](architecture/figma-mcp.md)。

## Design Tokens

- Semantic（SDK）：`surface.canvas/elevated/muted`、`text.primary/secondary/inverse`、`accent.brand`、`border.primary`、`status.danger(-contrast)`、`radius.base`、`motion.*`
- Tailwind 消費：`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `border-input`
- Brand scale：`brand-50` ~ `brand-900` = SDK primitives `colors.ai`（藍/Japan Blue scale；config 內為 synced 硬編碼，發布後改產出）

## 色盤 — 多主題系統（2026-07-08，SSOT：SDK docs/PALETTE.md）

三套可切換主題，全部由 explore-design-sdk theme maps 供應（每套 light+dark）：

| 主題                  | data-theme    | 種子                                                   |
| --------------------- | ------------- | ------------------------------------------------------ |
| 蜜蝋 Mitsurou（預設） | （無屬性）    | 蜂蜜黃 `#FFDA76` × 蜜蠟白底 `#FAF8F5` × 焦糖 `#DAA277` |
| 山吹 Yamabuki         | `yamabuki`    | 金 `#F8B500` × 中性灰底 × 橙紐 `#C9703D`               |
| 抹茶と藤 Matcha-Fuji  | `matcha-fuji` | 抹茶 `#CBD892` × 亞麻底 × 薰衣草 `#E1C2FF`             |

切換：`<html>` 的 `data-theme` + `.dark` class（ThemeSwitcher 元件，localStorage 記憶，root.tsx init script 防 FOUC）。**portal 不自持任何色值**——bridge 只做 shadcn 變數 ← SDK semantic 變數的參照，主題與 dark 全由 `app/styles/tokens.portal.css`（generated）承接。新增 semantic：`surface.highlight`（chips/badge）、`accent.strong`（連結/小字級 accent）。改色一律改 SDK 對應 theme map。紙質感 noise（opacity 0.04）沿用。

## 元件 Canonical（S2 起）

基礎元件 canonical 在 **explore-design-sdk `packages/components`**（`@explore-design/components`）；本 repo `app/components/ui/*` 為 vendored 副本（見該目錄 README），發布 npm 後改 import。

## Core Components

- `Button` (`default` | `secondary` | `outline` | `ghost` | `lui`)
- `Input` / `Textarea`
- `Card` + `CardHeader` + `CardContent`
- `Badge`
- `Alert`
- `ScrollArea`
- `Container`

## Component Layers

- `app/components/ui/*`: 最小顆粒的設計系統元件（以 cva 定義 variants）
- `app/components/shared/lui/*`: LUI 專用語義元件（例如 `ChatBubble`）
- `app/components/shared/chat/*`: 複合元件（組合 UI + LUI 元件）
- `app/components/app/*`: 應用基礎元件（例如 ErrorBoundary）

## Usage Guidelines

- 所有頁面以 `Container` 作為最大寬度約束。
- 大區塊使用 `Card` 以統一陰影與邊界。
- 強調行動使用 `Button`，避免自建按鈕樣式。
- 輕量提示使用 `Alert`，不要直接用裸 `div`。
- 避免在頁面內直接改 class，改用 `variant` API。

## UI Review Checklist（2026-07-08 起）

所有 UI PR 依 [docs/product/ui-review-checklist.md](product/ui-review-checklist.md) 自查（surface 分區 + 通用/加驗段）。評估與取捨脈絡見 [docs/product/visual-quality-plan.md](product/visual-quality-plan.md)。

## Typography / Spacing Tokens（S2.6，2026-07-08）

- Semantic 新增：`font.{display,body,mono}`、`type.{display,title,body,label}.{size,tracking,leading}`、`weight.{heading,body}`、`space.{gutter,section,stack,inline,control-x,control-y}`——SSOT 同色彩，在 SDK maps。
- 風格：portal＝**和紙編輯風**（Petrona/Shippori Mincho display、寬字距、body 行高 1.75）；後台＝Untitled UI 標準（`portal-untitled` map，Inter、tight、8pt）。此為明文品牌決策（反模板審查的「有意圖」證據）。
- Tailwind 消費：`font-display`、`tracking-title`、`leading-body`、`p-gutter`、`gap-stack` 等（tailwind.config 映射）。

## LUI Copy Style

- 先結論、再依據、最後下一步
- 避免過度自信措辭，使用「依目前資訊」「可先嘗試」
