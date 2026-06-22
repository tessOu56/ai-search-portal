# API 與 Handler 對照

**類型**：spec | **權重**：1

本文件列出專案內「API 路徑 ↔ schema / 型別 ↔ MSW handler」對照，新增 API 時請同步更新此表與 `app/test/handlers.ts`。

---

## 對照表

| API 路徑                                 | 方法      | Schema / 型別                                                                                              | Handler 位置                         | 備註                                             |
| ---------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------ |
| `/api/items`                             | GET       | `{ data: MockItem[] }`                                                                                     | `handlers.ts` → `itemsHandlers`      | 列表                                             |
| `/api/items`                             | POST      | body: `{ name, description? }` → `{ data: MockItem }`                                                      | `handlers.ts` → `itemsHandlers`      | 建立                                             |
| `/api/items/:itemId`                     | GET       | `{ data: MockItem }` 或 404                                                                                | `handlers.ts` → `itemsHandlers`      | 單筆                                             |
| `/api/items/:itemId`                     | PUT/PATCH | body 部分欄位 → `{ data: MockItem }`                                                                       | `handlers.ts` → `itemsHandlers`      | 更新                                             |
| `/api/items/:itemId`                     | DELETE    | `{ data: MockItem }` 或 404                                                                                | `handlers.ts` → `itemsHandlers`      | 刪除                                             |
| `/api/metadata`                          | GET       | `{ data: MetadataAssetSummary[], pagination }`                                                             | `metadata-handlers.ts`               | 列表；query `q`, `type`, `page`, `pack`          |
| `/api/metadata/:assetId`                 | GET       | `{ data: MetadataAssetDetail }` 或 404                                                                     | `metadata-handlers.ts`               | 單筆；query `pack`                               |
| `/api/context/packs`                     | GET       | `{ data: ContextPackManifest[] }`                                                                          | `context-handlers.ts`                | Context pack 列表                                |
| `/api/context/metrics/:metricId`         | GET       | `{ data: ContextMetric }`                                                                                  | `context-handlers.ts`                | query `pack`                                     |
| `/api/context/bindings`                  | GET       | `{ data: ResolvedDomainBinding[] }`                                                                        | `context-handlers.ts`                | query `pack`, `ref`                              |
| `/api/context/pack-select`               | POST      | 303 + Set-Cookie                                                                                           | `context-handlers.ts`                | Pack 切換（mock redirect）                       |
| `/api/metadata/access-requests/evaluate` | POST      | body → `{ data: PolicyDecision }`                                                                          | `metadata-handlers.ts`               | OPA 政策評估                                     |
| `/api/metadata/access-requests`          | POST      | body + optional `approved` → 202 / 422                                                                     | `metadata-handlers.ts`               | 資料申請                                         |
| `/api/mcp/gateway`                       | POST      | MCP `tools/call` + `_meta`                                                                                 | `metadata-handlers.ts`               | Stateless MCP spike                              |
| `/api/mcp/tasks/:taskId`                 | GET (SSE) | task events                                                                                                | `metadata-handlers.ts`               | Tasks stub（mock 404）                           |
| `/.well-known/mcp.json`                  | GET       | discover document                                                                                          | `metadata-handlers.ts`               | MCP discover                                     |
| `/api/dishes`                            | GET       | `{ dishes: Dish[] }`                                                                                       | 待補（routes 尚未實作）              | 領域                                             |
| `/api/ingredients`                       | GET       | `{ ingredients: Ingredient[] }`                                                                            | 待補                                 | 領域                                             |
| `/api/recipes`                           | GET       | `{ recipes: Recipe[] }`                                                                                    | 待補                                 | 領域                                             |
| `/api/vendors`                           | GET       | `{ vendors: Vendor[] }`                                                                                    | 待補                                 | 領域                                             |
| `/api/chat`                              | GET (SSE) | query `q`（必填）、`sessionId`（選填）；SSE：`meta`→`token*`→`final`→`done`，可選 `tool_status`、`failure` | 可選（`/api/chat` 已列入 lint 例外） | LUI + `@ai-search-portal/contracts` chat schemas |
| `/api/release-notes`                     | GET       | ReleaseNote[]                                                                                              | 可選                                 | 版號                                             |

---

## 維護

- 新增或變更 API 時：1) 更新上表 2) 在 `app/test/handlers.ts` 新增或修改對應 handler，使所有 API 呼叫都經過 handler。
