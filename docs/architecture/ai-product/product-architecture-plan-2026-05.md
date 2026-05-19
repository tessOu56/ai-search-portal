# 產品技術架構與功能規劃（2026-05）

**類型**：reference | **權重**：3

本文件是 **ai-search-portal** 的架構 SSOT 與功能分期；與 [productization-sprint-2026-05](./productization-sprint-2026-05.md)（當期衝刺）及 [productization-roadmap](./productization-roadmap.md)（Phase 5 長期）並存。

---

## 1. 系統邊界（現況）

```mermaid
flowchart TB
  subgraph client [Browser]
    UI[Remix app / LUI chat / Items CRUD]
  end
  subgraph portal [ai-search-portal]
    Routes[app/routes]
    GW[chat-gateway.server]
    Contracts[@ai-search-portal/contracts]
  end
  subgraph agent [Agent layer]
    Core[agent-core in-process]
    RT[agent-runtime HTTP optional]
  end
  subgraph data [Data v1]
  MSW[MSW + mock servers]
  Hono[backend Hono Items API]
  end
  subgraph obs [Observability]
  LF[Langfuse optional]
  Eval[labs/eval-runner]
  end
  UI --> Routes
  Routes --> GW
  GW --> Core
  GW --> RT
  RT --> Core
  GW --> Contracts
  Core --> Contracts
  Routes --> Hono
  Routes --> MSW
  Core --> LF
  Eval --> Core
```

| 邊界          | 職責                                      | SSOT                                  |
| ------------- | ----------------------------------------- | ------------------------------------- |
| **對外契約**  | 穩定 SSE、Items REST                      | `packages/shared-contracts`           |
| **Gateway**   | trace、in-process vs HTTP 路由、事件映射  | `app/services/chat-gateway.server.ts` |
| **Agent**     | guardrails、RAG、mock LUI、tool allowlist | `packages/agent-core`                 |
| **Portal v1** | Food domain、LUI、release notes           | `app/features/*`、`docs/product/`     |
| **Labs**      | eval、Langfuse compose、design-vibe GAP   | `labs/*`                              |

**原則**：契約與 Gateway 不隨 Phase 5 改變；新能力走 agent-core 內部或新增 optional 欄位。

---

## 2. 功能分期

### Phase 1 — 契約與管線（✅ 完成）

- 穩定 chat SSE、`mapInternalSseToStable`
- agent-runtime `/v1/chat/stream`
- Guardrails v2（長度、空查詢、注入 heuristics）
- Tool allowlist（mock `tool_status`）

### Phase 2 — 可觀測與評測（🔄 進行中）

| 功能                       | 狀態   | 下一步                                                   |
| -------------------------- | ------ | -------------------------------------------------------- |
| Langfuse trace + RAG spans | ✅ SDK | 本地 compose 驗證一筆 chat                               |
| Offline eval golden        | ✅ MVP | CI artifact、`expectRag` + `AGENT_RAG_MODE=local` 文件化 |
| 分數回歸門檻               | ⏳     | `eval-runner` 失敗即擋 PR（可選）                        |

### Phase 3 — RAG 與 Tool 真實化（📋 規劃）

| 功能               | 設計要點                                         | 目錄                           |
| ------------------ | ------------------------------------------------ | ------------------------------ |
| Local RAG 強化     | 擴充 `local-store` 文件、eval 覆蓋               | `packages/agent-core/src/rag/` |
| Vector RAG（可選） | 抽象 `Retriever`；環境切換 stub / local / http   | 新增 `rag/retriever.ts`        |
| Tool 執行          | `items.lookup` 打 backend Hono；逾時 + allowlist | `tools/execute.ts` ✅          |
| 錯誤契約           | tool 失敗 → 穩定 SSE error，不洩內部 stack       | `stable-chat-contract.md`      |

### Phase 4 — 產品 UI（design-vibe 對齊）

**策略**：ai-search-portal 作 **契約與 agent 實驗場**；完整 Catalog UX 以 **able_portal** 為準，portal 內只做 **可演示的最小殼**，避免雙邊 SSOT 分裂。

| Flow           | Portal 目標                                            | 優先 | 依賴                                 |
| -------------- | ------------------------------------------------------ | ---- | ------------------------------------ |
| catalog-search | `app/features/catalogsearch` + route `/catalog-search` | P0   | Figma MCP 或從 able 抽離型別         |
| api-detail     | 三欄 layout 占位                                       | P0   | `ThreeColumnExplorerLayout` 模式文件 |
| my-apis        | `/my-apis` 卡片列表                                    | P1   | Items/contract 擴充                  |
| requests       | 規格 only                                              | P2   | —                                    |

對照：`labs/design-vibe/GAP-REPORT.md`。

### Phase 5 — 產品化運維（長期）

見 [productization-roadmap](./productization-roadmap.md)：model routing、quota、cache、DLQ、idempotency、成本 dashboard。

---

## 3. 技術決策（ADR 摘要）

| 決策            | 選擇                                         | 理由                                     |
| --------------- | -------------------------------------------- | ---------------------------------------- |
| Agent 呼叫      | 預設 in-process；`AGENT_RUNTIME_URL` 切 HTTP | 本地簡單、部署可拆                       |
| RAG 預設        | stub pipeline                                | 契約穩定；`AGENT_RAG_MODE=local` 供 eval |
| 觀測            | Langfuse v3 SDK（legacy），env 關閉即 no-op  | 自架 compose 與雲端皆可                  |
| UI 新增 feature | `app/features/<name>` + 薄 route             | 對齊 repo-layers                         |
| Catalog 完整 UX | 不在此 repo 複製 able 全量                   | 降低重複維護                             |

---

## 4. 建議執行順序（4 週）

| 週  | 主題       | 產出                                                       |
| --- | ---------- | ---------------------------------------------------------- |
| W1  | 觀測閉環   | Langfuse 本地可見 trace；eval CI artifact                  |
| W2  | RAG + tool | `items.lookup` 真實呼叫；eval 覆蓋 RAG 路徑                |
| W3  | UI 最小殼  | `/catalog-search` route + panel placeholder + smoke test   |
| W4  | 文件與邊界 | 更新 GAP 表 Figma node；Phase 5 spike 文件（routing 選型） |

---

## 5. 與生態系其他 repo

| Repo                           | 關係                                                            |
| ------------------------------ | --------------------------------------------------------------- |
| **able_portal_release_hotfix** | Catalog UX、路由、E2E 主線；型別/adapter 可參考                 |
| **polyglot-labs**              | 後端模式實驗（Postgres、Redis、metrics）→ 成熟後回灌 `backend/` |
| **develop-md**                 | 願景、整合日誌、專案快照                                        |
| **downloads-api**              | design-vibe fixture 來源（API Explorer flows）                  |

---

## 6. 相關文件

- [productization-sprint-2026-05](./productization-sprint-2026-05.md)
- [observability-model](./observability-model.md)
- [stable-chat-contract](./stable-chat-contract.md)
- [invocation-boundary](./invocation-boundary.md)
