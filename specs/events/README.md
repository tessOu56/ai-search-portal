# Events / Stream 規格索引

**類型**：entry | **權重**：2

## 目的

- **對外穩定**：瀏覽器可依賴的 `GET /api/chat` SSE 事件 — 見 [stable-chat-contract.md](../../docs/architecture/ai-product/stable-chat-contract.md)。
- **內部執行**：Agent／RAG／tool 管道使用 **`internal.*`** 事件，**不得**直接暴露給前端；由 Gateway 映射。

## 文件

| 文件                             | 說明                                      |
| -------------------------------- | ----------------------------------------- |
| [chat-stream.md](chat-stream.md) | `internal.*` 與穩定事件對照、payload 欄位 |

Zod 定義 — `packages/shared-contracts/src/chat.contract.ts`。
