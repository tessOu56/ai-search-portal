---
name: portal-phase-work
description: >-
  Use in ai-search-portal when the user asks about project phases, what to do
  next, or finishing work. This public repo does not own phase SSOT.
---

# Portal phase work

## When to use

- 「做到 Phase N」「階段收尾」「能不能進下一階段」
- 判斷某功能屬於觀測、UI 殼、還是 Lab 平行軌

## Read first

1. [docs/RESUME-DEMO.md](../../docs/RESUME-DEMO.md) — protect Journey C
2. [docs/PROJECT-PLAN.md](../../docs/PROJECT-PLAN.md) — how-to only
3. [docs/platform-inbox/CURRENT.md](../../docs/platform-inbox/CURRENT.md) — local-only if present
4. [docs/agent-collaboration.md](../../docs/agent-collaboration.md)

## Workflow

1. **Do not** treat this repo's PROJECT-PLAN as a roadmap. Stages live in the private orchestration workspace.
2. Scope to live-demo bugfixes or an explicit ticket in local inbox. Do not add `/developers`, real auth, or other unlisted screens.
3. **結束前必跑 pr-gate（硬性，push 前）**：`pnpm run pr-gate`。觀測／eval 工作另加 `pnpm run test:labs`。

## Surface reminder

| Surface   | 保護                                               |
| --------- | -------------------------------------------------- |
| Journey C | `/catalog-search` → metadata → review → `/my-apis` |
| Chat      | `/` golden fixture                                 |
| Labs      | stay in `labs/` until promote                      |

## Forbidden

- 在 platform-command 寫 portal 產品碼
- 複製內部參考 catalog 的全量主線進 `app/`
- 把歷史 Phase 0–5 表寫回公開 PROJECT-PLAN
