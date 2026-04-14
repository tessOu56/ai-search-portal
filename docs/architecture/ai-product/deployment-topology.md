# Deployment Topology（AI 服務）

**類型**：reference | **權重**：2

## 預設（本 repo）

| 元件                         | 角色                                                           | 預設埠／備註                                                      |
| ---------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------- |
| Remix app                    | Frontend + `app/routes/api.chat`（API boundary、SSE 對外映射） | `pnpm dev` 由 Vite/Remix 決定（常見 5173）                        |
| `backend`（`ai-search-api`） | 獨立 HTTP，`/api/items` 等                                     | `PORT=3001`（見 [backend/README.md](../../../backend/README.md)） |
| `services/agent-runtime`     | Agent orchestration HTTP                                       | `AGENT_PORT=3002`（見該套件 README）                              |

## Phase 1 決策

- **Agent** 以 **獨立 Node process** 執行（與 Remix 分離），透過環境變數 `AGENT_RUNTIME_URL`（例：`http://127.0.0.1:3002`）讓 Gateway 連線。
- **未設定** `AGENT_RUNTIME_URL` 時：Gateway 於 **同 process** 載入 `@ai-search-portal/agent-core` 產生內部事件流（開發預設、CI 單測友好），**不經 HTTP**。
- **Health**：agent-runtime 提供 `GET /health`；詳見服務內實作。

## 升級觸發（獨立 deploy / scale）

- 需 **獨立擴展 Agent**、與 Portal 不同 release cycle、或故障隔離時：維持 HTTP，僅調整部署拓樸與 `AGENT_RUNTIME_URL`。
- 需 **事件驅動內部 pipeline**（RAG 非同步、重試／DLQ）時：在 Agent 內部引入 broker，**不改**對前端的穩定 SSE 契約。
