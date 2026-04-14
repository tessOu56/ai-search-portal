# AGENTS.md — Coding Agent 入口

本檔為 **coding agent / AI 輔助工具** 的專案導覽與注意事項（canonical source）。`.cursor/rules`、`.claude/` 與此同步；細部以 **docs/**、**specs/** 為準。

---

## Purpose

- **Branch-synced**：agent 讀取的是目前分支內的 docs/specs，不依賴外部 wiki。
- **入口成本最低**：先看本檔與 [docs/README.md](docs/README.md)，再依需要進 architecture、conventions、product、specs。

---

## End-to-End Workflow

1. **Setup**：`pnpm install` → `pnpm run dev`（建議 `corepack enable` 對齊 `packageManager`）
2. **Code**：修改 app/features、app/components、app/services、app/shared 等
3. **Before PR**：`pnpm run build`、`pnpm run test`、`pnpm run lint:ci`
4. **Commit**：Conventional Commits（feat / fix / docs / chore / refactor / test）
5. **Delete files**：用 `git rm <path>` 以保留操作紀錄；空資料夾 Git 不追蹤，可手動刪除。見 [docs/conventions/git-version-control.md](docs/conventions/git-version-control.md)

---

## Git

- **Commit**：Conventional Commits（commitlint 強制）。見 [CONTRIBUTING.md](CONTRIBUTING.md)。
- **刪除檔案**：使用 `git rm <path>`，不要只從檔案系統刪除。空資料夾可手動移除，無需 `git rm`。詳見 [docs/conventions/git-version-control.md](docs/conventions/git-version-control.md)。

---

## Quality & CI

- **Commands**：`lint:filenames`、`lint`（或 `lint:ci`）、`typecheck`、`test`
- **CI**：`.github/workflows/ci.yml`（build、test、lint 皆通過才放行；失敗時產出說明報告，見 [docs/runbooks/local-dev.md](docs/runbooks/local-dev.md)）
- **User-facing changes**：`pnpm run changeset`

---

## Architecture（架構規格）

- **五層**：app (shell) | features | components | services | infra（可選）。目錄對應與依賴方向：[docs/architecture/repo-layers.md](docs/architecture/repo-layers.md)。
- **總覽**（Tech stack、Data Flow）：[docs/architecture/system-overview.md](docs/architecture/system-overview.md)。
- **Design System**：[docs/architecture/design-system.md](docs/architecture/design-system.md)、[docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)。**Figma MCP**（選用）：[docs/architecture/figma-mcp.md](docs/architecture/figma-mcp.md)、`tools/figma-mcp/`；需在 Cursor 設定 `FIGMA_ACCESS_TOKEN`，見 [figma-to-deploy-workflow](docs/runbooks/figma-to-deploy-workflow.md)。

---

## Product / Domain（產品規格）

- 業務與領域以 **docs/product/** 為準。功能一覽：[docs/product/overview.md](docs/product/overview.md)。
- 領域模型、LUI、Items API、Release Notes、Mock 策略：見 [docs/README.md](docs/README.md) 的 Product 一覽。

---

## Data & API（Contract layer）

- **Spec → Contract → Mock → Test → UI**。禁止在 component 內直接 `fetch(url)`；使用 useFetcher 或 `app/shared/api` 打契約路徑。
- **契約（Zod SoT）**：`@ai-search-portal/contracts`（[`packages/shared-contracts`](packages/shared-contracts/)）；Remix 端經 [`app/shared/contracts/index.ts`](app/shared/contracts/index.ts) re-export，**勿**在 `app/**` 新增 `*.contract.ts`。
- **治理與過渡期 SoT**：[specs/README.md](specs/README.md)、[docs/adr/spec-driven-contracts-and-sot.md](docs/adr/spec-driven-contracts-and-sot.md)。OpenAPI 見 [specs/openapi/openapi.yaml](specs/openapi/openapi.yaml)；產物 `pnpm run codegen:openapi`。
- **細部**：[specs/api/contract-schema.md](specs/api/contract-schema.md)、[specs/api/handler-mapping.md](specs/api/handler-mapping.md)。
- **制度**：[docs/conventions/data-test-driven.md](docs/conventions/data-test-driven.md)。

---

## Conventions

- **資料夾**（app/ 下，除 routes）：小寫、無連字號/底線。**元件檔**（app/components/\*_/_.tsx）：PascalCase。`pnpm run lint:filenames` 檢查。
- 詳見 [docs/conventions/coding-conventions.md](docs/conventions/coding-conventions.md)。

---

## Code Review（階段後規格對齊）

- 每階段工作完成後或 PR 前，依 [docs/code-review-spec.md](docs/code-review-spec.md) 審查，確保規格與專案現況一致（分層、契約、路徑、命名、文件連結）。供開發者與 AI（Coding / Review Agent）共用。
- **當期報告與議題**：根目錄 [code-review/](code-review/README.md)（REPORT.md、issues.md）。待辦以 CR-001 等 ID 登錄於 issues.md；程式內僅使用 `// TODO(CR-xxx): description`。執行 `pnpm run code-review:list` 可列出 CR TODO 與 missing/orphan 一致性檢查。

---

## 能力邊界與工具適配

能力邊界與 agent class 見 [AGENT_CAPABILITIES.md](AGENT_CAPABILITIES.md)。Canonical 與 tool adapter 分層、以及「何者可修改／不可越權」亦見該檔。

- **Tool adapters**（如 `.cursor/rules/*.mdc`、`.claude/`）：僅指向本檔與 AGENT_CAPABILITIES.md，並補充該工具之格式或限制；不另定義架構／產品 truth，細部見 docs/、specs/。
