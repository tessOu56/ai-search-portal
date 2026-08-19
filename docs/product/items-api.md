# Items API

**類型**：reference | **權重**：2

本文件描述「通用 CRUD 範例」Items API 的現況規格：用途、資料模型、端點行為。

---

## 用途

- 示範 Remix Resource Route 的 GET 列表／詳情。
- 訪客平台不開放建立／更新／刪除；寫入回 405。
- 非領域核心；領域模型以 [domain-food-recipe](domain-food-recipe.md) 為準。

---

## 資料模型：MockItem

| 欄位        | 型別           | 說明                     |
| ----------- | -------------- | ------------------------ |
| id          | string         | 由 server 產生，遞增數字 |
| name        | string         | 必填                     |
| description | string \| null | 選填                     |
| createdAt   | string         | ISO 8601                 |
| updatedAt   | string         | ISO 8601                 |

- 型別與 CRUD 實作：`app/services/mock-items.server.ts`
- 儲存：**in-memory 陣列**，重啟清空；預設種子兩筆（alpha, beta）。

---

## 端點行為

| 方法        | 路徑               | 說明                                |
| ----------- | ------------------ | ----------------------------------- |
| GET         | /api/items         | 回傳 `{ data: MockItem[] }`         |
| POST        | /api/items         | **405**（訪客不可寫）               |
| GET         | /api/items/:itemId | 回傳 `{ data: MockItem }`；無則 404 |
| PUT / PATCH | /api/items/:itemId | **405**                             |
| DELETE      | /api/items/:itemId | **405**                             |

- 錯誤：400（缺參/格式）、404（Item not found）、405（Method not allowed），body 為 `{ error: string }`。

---

## 對應頁面（v1）

- `/items`：唯讀列表
- `/items/:itemId`：唯讀詳情（無表單）

頁面 route：`app/routes/items.tsx`、`app/routes/items._index.tsx`、`app/routes/items.$itemId.tsx`。`/items/new` 已刪，須 404。

---

## 檔案對應

- 路由：`app/routes/api.items.ts`（list GET）、`app/routes/api.items.$itemId.ts`（get GET；寫入 405）
- 頁面：`app/routes/items.tsx`、`app/routes/items._index.tsx`、`app/routes/items.$itemId.tsx`
- 服務：`app/services/mock-items.server.ts`（listMockItems, getMockItem, createMockItem, updateMockItem, deleteMockItem）
