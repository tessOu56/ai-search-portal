## Design System

這份設計系統文件用來維持 UI 一致性與可維護性。
本專案採用 shadcn/ui 作為元件基礎，確保可維護且可客製。

## Design Tokens

- Brand scale: `brand-50` ~ `brand-900`
- Semantic: `bg-background`, `text-foreground`, `text-muted-foreground`
- Border: `border-border`, `border-input`

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
- `app/components/lui/*`: LUI 專用語義元件（例如 `ChatBubble`）
- `app/components/chat/*`: 複合元件（組合 UI + LUI 元件）

## Usage Guidelines

- 所有頁面以 `Container` 作為最大寬度約束。
- 大區塊使用 `Card` 以統一陰影與邊界。
- 強調行動使用 `Button`，避免自建按鈕樣式。
- 輕量提示使用 `Alert`，不要直接用裸 `div`。
- 避免在頁面內直接改 class，改用 `variant` API。

## LUI Copy Style

- 先結論、再依據、最後下一步
- 避免過度自信措辭，使用「依目前資訊」「可先嘗試」
