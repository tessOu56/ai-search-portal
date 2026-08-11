# Agent 協作 — ai-search-portal

> 生態 SSOT：[platform-command/docs/agent-collaboration.md](https://github.com/tessOu56/platform-command/blob/main/docs/agent-collaboration.md)  
> 產品階段：[PROJECT-PLAN.md](./PROJECT-PLAN.md)  
> 能力邊界：[AGENT_CAPABILITIES.md](../AGENT_CAPABILITIES.md)

---

## 1. 進入順序（每次 session）

1. [AGENTS.md](../AGENTS.md)
2. [PROJECT-PLAN.md](./PROJECT-PLAN.md) — **確認當前 Phase 與出口條件**
3. [platform-inbox/CURRENT.md](./platform-inbox/CURRENT.md) — P0／P1 ticket
4. 任務相關：`specs/`、`docs/architecture/ai-product/`
5. 載入 skill（見 §2）— 僅在任務匹配時

---

## 2. Skills（`.cursor/skills/`）

| Skill                      | 觸發情境                                         | 作用                                        |
| -------------------------- | ------------------------------------------------ | ------------------------------------------- |
| **portal-phase-work**      | 「做到 Phase N」「階段收尾」「能不能進下一階段」 | 對照 PROJECT-PLAN 出口條件列 checklist      |
| **portal-contract-change** | 改 API、SSE、chat、MSW、OpenAPI                  | 契約先於實作：specs → shared-contracts → UI |
| **portal-lab-boundary**    | 新功能在 labs、WebGPU、本機 LLM、promote         | 禁止破壞 v1 契約；promote 條件              |

**使用方式**：對話中 `@portal-phase-work` 或明確說「依 portal-phase-work skill」。

---

## 3. Hooks（`.cursor/hooks.json`）

| 事件                   | 腳本                                      | 行為                                         |
| ---------------------- | ----------------------------------------- | -------------------------------------------- |
| `sessionStart`         | `.cursor/hooks/session-context.ps1`       | 注入當前 repo、PROJECT-PLAN 連結、Phase 焦點 |
| `beforeShellExecution` | `.cursor/hooks/guard-destructive-git.ps1` | 阻擋 `git push --force`、`git reset --hard`  |

驗證：新開 agent chat，確認 context 提及 `docs/PROJECT-PLAN.md`；嘗試 `git reset --hard` 應被擋（測試後勿真的執行破壞指令）。

---

## 4. Commands（儀式）

### 4.1 Shell（package.json / scripts）

| 指令名          | 命令                                                  | Phase | 用途                         |
| --------------- | ----------------------------------------------------- | ----- | ---------------------------- |
| `dev`           | `pnpm run dev`                                        | 0+    | 本機                         |
| `pr-gate`       | `pnpm run build && pnpm run test && pnpm run lint:ci` | 0+    | PR 前必跑                    |
| `labs-test`     | `pnpm run test:labs`                                  | 2+    | eval-runner                  |
| `eval-offline`  | `pnpm run eval:offline`                               | 2+    | golden 離線                  |
| `obs-up`        | `pnpm run observability:up`                           | 2+    | Langfuse compose             |
| `obs-smoke`     | `pnpm run observability:smoke`                        | 2+    | trace smoke                  |
| `design-prompt` | `pnpm run design:prompt`                              | 4     | Figma MCP 工作流（STOP-003） |

> **T-2026-069 eval gate**：`eval:offline`（含 golden 集 + 「no sources」regression guard，見 `labs/eval-runner/src/score.ts`）是 CI `ci` job 的必要步驟（`.github/workflows/ci.yml`，非 `continue-on-error`）；golden 集任一 case 失敗會讓 CI 失敗並擋 PR 合併。

### 4.2 Agent prompts（複製貼上）

**Phase 0 收尾**

```text
依 docs/PROJECT-PLAN.md Phase 0。完成 T-2026-001 檢查清單（Vercel URL → platform-command registry），跑 pr-gate，不新增範圍。
```

**Phase 2 Langfuse 閉環**

```text
依 Phase 2 出口條件：obs-up → 一筆 chat → obs-smoke → 在 docs/runbooks/langfuse-local.md 補一節「UI 驗證步驟」。不改 chat 契約。
```

**Phase 4 catalog-search GAP**

```text
依 T-2026-004 與 labs/design-vibe/GAP-REPORT.md catalog-search 列。只改 CatalogSearchPanel 與相關 mock；契約不變。跑 pr-gate + test:labs。
```

**Lab on-device-media 開工**

```text
載入 portal-lab-boundary。在 labs/on-device-media 新建 ODM-1：WebCodecs Worker demo，不 import 進 app/routes。README 寫驗收與記憶體注意。
```

**契約變更**

```text
載入 portal-contract-change。列出將改的 specs 與 shared-contracts 檔案，再動 app/。附 eval-offline 或相關測試計畫。
```

---

## 5. Cursor Rules（既有，勿重複）

| 規則檔                           | 重點                          |
| -------------------------------- | ----------------------------- |
| `project-standards.mdc`          | 分層、命名、lint              |
| `spec-driven-workflow.mdc`       | spec → contract → mock → test |
| `data-test-driven.mdc`           | MSW、測試隔離                 |
| `collaboration-architecture.mdc` | feature 邊界                  |

Rules = always-on；Skills = 任務型。衝突時 **AGENTS.md > AGENT_CAPABILITIES.md > rules**。

---

## 6. 與其他 repo 協作

| 情境              | 做法                                                                      |
| ----------------- | ------------------------------------------------------------------------- |
| 收中央 ticket     | 讀 `docs/platform-inbox/tickets/T-*.md`，完成後 `status: done`            |
| 需要 Catalog 行為 | 唯讀參考內部 catalog 鏡像（platform-command registry 記載），不 copy 全量 |
| 更新中央 registry | 在 **platform-command** 開 session，跑 `ecosystem-inbox`                  |
| 長文規格          | 寫 **develop-md**，本 repo 只連結                                         |

---

## 7. Agent 協作實作階段（本 repo）

| 階段 | 內容                                       | 出口條件                                        |
| ---- | ------------------------------------------ | ----------------------------------------------- |
| AC-0 | 本檔 + 三 skills + hooks                   | ✅ 檔案就緒                                     |
| AC-1 | 手動驗證一輪 sessionStart + pr-gate prompt | 新 session 看見 PROJECT-PLAN 指標；跑過 pr-gate |
| AC-2 | 契約變更慣例寫入 CONTRIBUTING 或 PR 範本   | AGENTS 已連結本檔；PR 描述可貼 §4 prompt        |

---

## 8. 禁止（agent）

- 在 `app/` 直接引入 WebGPU／本機 LLM（未過 lab + promote）
- 在 component 內 `fetch` 非契約 URL
- 覆寫 `packages/shared-contracts` 語意而不更新 `specs/`
- 在 platform-command 實作 portal 產品碼
