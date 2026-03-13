# API 與 Handler 對照

**類型**：spec | **權重**：1

本文件列出專案內「API 路徑 ↔ schema / 型別 ↔ MSW handler」對照，新增 API 時請同步更新此表與 `app/test/handlers.ts`。

---

## 對照表

| API 路徑             | 方法      | Schema / 型別                                         | Handler 位置                    | 備註 |
| -------------------- | --------- | ----------------------------------------------------- | ------------------------------- | ---- |
| `/api/items`         | GET       | `{ data: MockItem[] }`                                | `handlers.ts` → `itemsHandlers` | 列表 |
| `/api/items`         | POST      | body: `{ name, description? }` → `{ data: MockItem }` | `handlers.ts` → `itemsHandlers` | 建立 |
| `/api/items/:itemId` | GET       | `{ data: MockItem }` 或 404                           | `handlers.ts` → `itemsHandlers` | 單筆 |
| `/api/items/:itemId` | PUT/PATCH | body 部分欄位 → `{ data: MockItem }`                  | `handlers.ts` → `itemsHandlers` | 更新 |
| `/api/items/:itemId` | DELETE    | `{ data: MockItem }` 或 404                           | `handlers.ts` → `itemsHandlers` | 刪除 |
| `/api/dishes`        | GET       | `{ dishes: Dish[] }`                                  | 待補（routes 尚未實作）         | 領域 |
| `/api/ingredients`   | GET       | `{ ingredients: Ingredient[] }`                       | 待補                            | 領域 |
| `/api/recipes`       | GET       | `{ recipes: Recipe[] }`                               | 待補                            | 領域 |
| `/api/vendors`       | GET       | `{ vendors: Vendor[] }`                               | 待補                            | 領域 |
| `/api/chat`          | GET (SSE) | query `q` → SSE stream                                | 可選                            | LUI  |
| `/api/release-notes` | GET       | ReleaseNote[]                                         | 可選                            | 版號 |

---

## 維護

- 新增或變更 API 時：1) 更新上表 2) 在 `app/test/handlers.ts` 新增或修改對應 handler，使所有 API 呼叫都經過 handler。
