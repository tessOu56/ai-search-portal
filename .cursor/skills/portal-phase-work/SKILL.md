---
name: portal-phase-work
description: >-
  Use in ai-search-portal when the user asks about project phases, phase exit
  criteria, what to do next, or finishing Phase 0–5 / lab on-device-media.
  Read PROJECT-PLAN before scoping work.
---

# Portal phase work

## When to use

- 「做到 Phase N」「階段收尾」「能不能進下一階段」
- Sprint / ticket 對照產品階段（T-2026-001、T-2026-004）
- 判斷某功能屬於 Phase 2（觀測）還是 Phase 4（UI 殼）還是 Lab 平行軌

## Read first

1. [docs/PROJECT-PLAN.md](../../docs/PROJECT-PLAN.md) — 出口條件 SSOT
2. [docs/platform-inbox/CURRENT.md](../../docs/platform-inbox/CURRENT.md)
3. [docs/agent-collaboration.md](../../docs/agent-collaboration.md) — commands §4

## Workflow

1. 從 PROJECT-PLAN §2 確認**當前 Phase**（現況表）。
2. 列出該 Phase **出口條件**；未完成項 = 本次 scope。
3. **禁止**在未滿足出口條件時擴 scope 到下一 Phase（Lab 平行軌除外，且須標註 `portal-lab-boundary`）。
4. 結束前建議跑 **pr-gate**：`pnpm run build && pnpm run test && pnpm run lint:ci`；Phase 2+ 加 `pnpm run test:labs`。

## Phase 速查

| Phase   | 焦點                                      |
| ------- | ----------------------------------------- |
| 0       | CI、Vercel、registry、agent 協作檔就緒    |
| 1       | 契約／SSE（維持不回歸）                   |
| 2       | Langfuse trace、eval-runner、items.lookup |
| 3       | RAG Retriever、tool 錯誤契約              |
| 4       | catalog-search / api-detail / my-apis GAP |
| 5       | routing、quota、DLQ spike（文件為主）     |
| Lab ODM | `labs/on-device-media` only               |

## Forbidden

- 在 platform-command 寫 portal 產品碼
- 複製內部參考 catalog 的全量主線進 `app/`
