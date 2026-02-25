## Architecture Overview

這份文件聚焦於「大型協作」所需的結構與流程。

專案朝向 **兩個方向** 對齊：

1. **乾淨架構（業務規格做專案中樞）**  
   以 `.cursor/wiki/` 內 **RA-\*** 為業務規格中樞；功能與資料流可追溯到規格，依賴由外而內。  
   見 **.cursor/wiki/Ref-乾淨架構與業務規格中樞.md**。

2. **半自動化 UI / Design System**  
   逐漸建立 design system（tokens、core 元件、使用規範），以單一來源與半自動化維持 UI 一致性。  
   見 **.cursor/wiki/Ref-Design-System-與半自動化-UI.md**、**docs/DESIGN_SYSTEM.md**。

## Tech Stack

- Remix v2 + React 18
- TypeScript
- Vite
- Tailwind CSS
- Node.js >= 20

套件與 React 支援度對照見 **.cursor/wiki/Ref-套件與-React-支援度.md**；新增或升級依賴時請維護該表並確認 React 相容性。

## Directory Structure

- `app/features/*`
  - `*.hooks.ts`: 前端 hook
  - `*.server.ts`: server-side 資料處理
  - `*.types.ts`: 模組型別定義
- `app/shared/*`
  - `services`: 跨模組共用 service
  - `types`: 共用型別
  - `utils`: 共用工具
- `app/services/*`: 應用層整合與計算邏輯
- `app/routes/*`: Remix route handlers

## Data Flow

- UI 呼叫 `app/features/*/*.hooks.ts`
- hooks 透過 Remix route / loader / action 互動
- server-side logic 位於 `app/features/*/*.server.ts`
- 跨模組協作由 `app/shared/services` 串接
- LUI 串流由 `app/routes/api.chat.ts` (SSE Resource Route) 提供

## Quality Gates

- ESLint: 嚴格型別檢查 + import sorting + unused imports
- Prettier: 統一格式
- TypeScript: typecheck
- Knip: unused code 掃描
- Husky + lint-staged: 預提交自動修正

## CI/CD

- GitHub Actions
  - PR: lint:strict + typecheck + knip
  - Deploy: main 分支自動部署

## Collaboration Conventions

- PR 必附測試或說明
- 以小步、可回滾的改動為主
- 建議使用 Conventional Commits 以便未來版本管理
