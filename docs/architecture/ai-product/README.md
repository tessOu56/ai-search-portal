# AI 產品架構（可執行定稿）

**類型**：reference | **權重**：2

本目錄收錄 **Frontend / Backend API / Agent Runtime** 與 **契約層** 的硬決策，與 [data-test-driven](../../conventions/data-test-driven.md) 的治理流程並存：後者管變更紀律，本目錄管系統邊界與部署。

| 文件                                                                         | 說明                                        |
| ---------------------------------------------------------------------------- | ------------------------------------------- |
| [deployment-topology.md](deployment-topology.md)                             | 程序／埠／同 repo 與 health                 |
| [invocation-boundary.md](invocation-boundary.md)                             | Backend→Agent 預設 HTTP、過渡方案、升級條件 |
| [stable-chat-contract.md](stable-chat-contract.md)                           | 對外穩定 SSE 與錯誤、與內部事件對照         |
| [tool-boundary.md](tool-boundary.md)                                         | Tool allowlist、timeout、審計、禁止直連 DB  |
| [memory-policy.md](memory-policy.md)                                         | Session／摘要／保存（Phase 4 啟用）         |
| [observability-model.md](observability-model.md)                             | Trace 貫穿與日誌關聯鍵                      |
| [productization-roadmap.md](productization-roadmap.md)                       | Phase 5：成本、評測、進階可靠性             |
| [productization-sprint-2026-05.md](productization-sprint-2026-05.md)         | 當期衝刺：Langfuse、eval、design-vibe       |
| [product-architecture-plan-2026-05.md](product-architecture-plan-2026-05.md) | 架構 SSOT、功能分期、四週執行順序           |

事件型錄（機器可讀補充）見 [specs/events/README.md](../../specs/events/README.md)。
