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

## UI 產出規則（Design Read + Review Checklist，2026-07-08 起）

產生或修改 UI 前：

1. **標注 surface tag**：marketing / product / data / developer（分區定義見 [docs/product/visual-quality-plan.md](docs/product/visual-quality-plan.md) §1）。所有 surface 必標。
2. **Design Read（marketing / developer surface 必填）**：動手前輸出一行宣告——「Reading this as: <頁面類型> for <受眾>, <風格語言>, 依 <token/主題依據>」。模糊時只問一個釐清問題，能推斷就不問。
3. **出貨前自查** [docs/product/ui-review-checklist.md](docs/product/ui-review-checklist.md)（通用段全查；命中加驗段的 surface 再查）。任一項不過即未完成。
4. **視覺值一律走 token**（SDK semantic vars／Tailwind 語意 utility）；改風格改 SDK map，不在 portal 寫死值。data surface 用 `section-dense`／`stack-dense` 密度檔。

## Agent 協作（skills / hooks / commands）

- **Playbook**：[docs/agent-collaboration.md](docs/agent-collaboration.md) — session 進入順序、儀式指令、prompt 範本
- **階段 SSOT**：[docs/PROJECT-PLAN.md](docs/PROJECT-PLAN.md) — Phase 0–5 出口條件（無日曆）
- **Skills**：`.cursor/skills/portal-phase-work`、`portal-contract-change`、`portal-lab-boundary`
- **Hooks**：`.cursor/hooks.json`（session 指向 PROJECT-PLAN；git 守門）
- **生態**： [platform-command/docs/agent-collaboration.md](https://github.com/tessOu56/platform-command/blob/main/docs/agent-collaboration.md)

## Labs（實驗；promote 前勿破壞 v1 契約）

- 目錄：[labs/README.md](labs/README.md)（pnpm workspace + turbo）
- **eval-runner**：`pnpm run test:labs` / `pnpm run eval:offline` — 離線 golden 評測 agent-core stream
- **design-vibe**：`pnpm run design:prompt` — Downloads explorer → Figma MCP 工作流
- **deck-studio**（已 promote）：獨立 repo [tessOu56/deck-studio](https://github.com/tessOu56/deck-studio)，不再位於 `labs/`
- 個人生態 SSOT：[develop-md/vision/platform-2026.md](https://github.com/tessOu56/develop-md/blob/main/vision/platform-2026.md)
- **免費雲端部署**：[develop-md/vision/platform-2026-cloud-deploy.md](https://github.com/tessOu56/develop-md/blob/main/vision/platform-2026-cloud-deploy.md)（本產品 → Vercel）
- **規劃收件**：`docs/platform-inbox/CURRENT.md`（由 [platform-command](https://github.com/tessOu56/platform-command) 派送 tickets）

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
- 文件與 TODO 治理總表： [docs/conventions/doc-todo-governance.md](docs/conventions/doc-todo-governance.md)。

---

## Code Review（階段後規格對齊）

- **開發前**：feature／ticket 開工前依 [docs/spec-review.md](docs/spec-review.md) 做 spec review（drift 檢查、影響面、implementation plan），報告存 [code-review/spec-reviews/](code-review/spec-reviews/)。
- 每階段工作完成後或 PR 前，依 [docs/code-review-spec.md](docs/code-review-spec.md) 審查，確保規格與專案現況一致（分層、契約、路徑、命名、文件連結）。供開發者與 AI（Coding / Review Agent）共用。
- **當期報告與議題**：根目錄 [code-review/](code-review/README.md)（REPORT.md、issues.md）。待辦以 CR-001 等 ID 登錄於 issues.md；程式內僅使用 `// TODO(CR-xxx): description`。執行 `pnpm run code-review:list` 可列出 CR TODO 與 missing/orphan 一致性檢查。

---

## 能力邊界與工具適配

能力邊界與 agent class 見 [AGENT_CAPABILITIES.md](AGENT_CAPABILITIES.md)。Canonical 與 tool adapter 分層、以及「何者可修改／不可越權」亦見該檔。

- **Tool adapters**（如 `.cursor/rules/*.mdc`、`.claude/`）：僅指向本檔與 AGENT_CAPABILITIES.md，並補充該工具之格式或限制；不另定義架構／產品 truth，細部見 docs/、specs/。

---

## 開發環境（2026-07 統一）

- Node 22（`.nvmrc`，CI 對齊；注意 Dockerfile 仍為 node:20 → 收斂 ticket 見 platform-command）· pnpm 10.34.3（`packageManager`）
- 生態矩陣：`platform-command/docs/dev-environment.md` · Cowork sandbox 限制：`platform-command/docs/cowork-sandbox.md`
