# Docs 目錄說明

**類型**：entry | **權重**：1

本目錄為專案 **engineering knowledge layer**：架構、慣例、runbook、產品脈絡，供人與 coding agent 查閱。Contract（API、schema）在 **specs/**；Coding agent 入口為根目錄 **AGENTS.md**。

**類型／權重**：每項後標示【類型／權重】。權重 1＝必讀必遵、2＝常用、3＝按需。定義見 [doc-naming](conventions/doc-naming.md)。

## 目錄結構

| 目錄              | 用途                                                                           |
| ----------------- | ------------------------------------------------------------------------------ |
| **architecture/** | 架構說明、五層分層、資料流、Design System、資料治理                            |
| **conventions/**  | 編碼慣例、資料測試制度、Git 版本控制、套件 React 支援度、Mock dataset 版本化   |
| **runbooks/**     | 本地開發、分支/PR/CI、部署（Vercel）                                           |
| **product/**      | 產品／需求脈絡（功能一覽、領域模型、LUI、Items API、Release Notes、Mock 策略） |
| **adr/**          | 可選，架構決策紀錄、升級與技術選型討論                                         |

## 一覽

### Architecture

- [system-overview](architecture/system-overview.md) — Tech stack、目錄結構、Data Flow、Quality Gates 【reference／1】
- [repo-layers](architecture/repo-layers.md) — 五層分層、依賴方向 【reference／1】
- [clean-architecture](architecture/clean-architecture.md) — 業務規格中樞、Spec→Contract→Mock→Test→UI 【reference／2】
- [design-system](architecture/design-system.md) — Design System 與半自動化 UI 【reference／2】
- [data-flow](architecture/data-flow.md) — 請求與契約資料流 【reference／2】
- [data-governance](architecture/data-governance.md) — 資料治理與前端對等 【reference／2】

### Conventions

- [coding-conventions](conventions/coding-conventions.md) — 檔案與資料夾命名、lint:filenames 【spec／1】
- [data-test-driven](conventions/data-test-driven.md) — Spec→Contract→Mock→Test→UI 制度 【spec／1】
- [doc-naming](conventions/doc-naming.md) — 文件命名與權重定義 【reference／2】
- [git-version-control](conventions/git-version-control.md) — Commit、git rm、空資料夾 【spec／1】
- [packages-react](conventions/packages-react.md) — React 18 基準、套件 peer 對照 【reference／2】
- [mock-dataset-versioning](conventions/mock-dataset-versioning.md) — Mock dataset v1/v2、MIGRATION 【reference／2】
- [error-handling](conventions/error-handling.md) — 錯誤與邊界處理、契約 error schema 【reference／2】
- [eslint-remix-deprecation](conventions/eslint-remix-deprecation.md) — Remix ESLint 棄用說明與遷移建議 【reference／3】
- [package-upgrade-policy](conventions/package-upgrade-policy.md) — 套件升級政策（日常更新 vs 重大升級）、討論入口 【reference／2】

### Runbooks

- [local-dev](runbooks/local-dev.md) — 分支、PR、CI、依賴更新 【runbook／1】
- [deployment](runbooks/deployment.md) — Vercel、Changesets 【runbook／2】

### Product

- [overview](product/overview.md) — 專案定位、功能一覽 【reference／1】
- [domain-food-recipe](product/domain-food-recipe.md) — 食物與食譜領域模型 【reference／2】
- [lui-search](product/lui-search.md) — LUI 搜尋入口、SSE API 【reference／2】
- [items-api](product/items-api.md) — Items API CRUD 【reference／2】
- [release-notes](product/release-notes.md) — 版號與 Release Notes 【reference／2】
- [mock-data](product/mock-data.md) — Mock 策略與最小維護 【reference／2】

### ADR / 討論（架構與套件升級）

- [upgrade-v7-discussion](adr/upgrade-v7-discussion.md) — 是否升級到 React Router v7（討論摘要） 【adr／2】
- 日常與重大升級區分見 [package-upgrade-policy](conventions/package-upgrade-policy.md)

## 根目錄 docs 檔案

- **ARCHITECTURE.md** — 架構入口，指向 architecture/system-overview 與本目錄 【entry／1】
- **CONVENTIONS.md** — 命名規範入口，詳見 conventions/coding-conventions 【entry／1】
- **DEVELOPMENT.md** — 開發流程入口，詳見 runbooks/ 【entry／1】
- **DESIGN_SYSTEM.md** — Design tokens、Core components、Usage guidelines 【reference／2】
- **code-review-spec.md** — Code Review 規範（每階段工作後保持規格與現況一致；供 AI 與開發者） 【spec／1】
- **code-review-report.md** — Code Review 報告範例（Clean Code、註解、規格對齊之審查結果與待辦） 【report／3】
- **當期報告與議題**：根目錄 [code-review/](../code-review/README.md)（REPORT.md、issues.md、`npm run code-review:list`）
- **audit-report.md** — 專案盤查報告（依 code-review-spec 與現況盤查結果與待改進項） 【report／3】
