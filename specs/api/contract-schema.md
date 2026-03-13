# Contract 與 Schema 規範

**類型**：spec | **權重**：1

本專案以 **runtime 可驗證的契約** 為準，不只依賴 TypeScript 型別。Mock 與 production 共用同一份 schema，避免漂移。

---

## 工具與位置

- **Zod**：契約定義與 parse/safeParse（`app/shared/contracts/*.contract.ts`）。
- **型別**：由 Zod schema 推導（`z.infer<typeof xxxSchema>`），可與既有 `*.types.ts` 對齊或逐步取代對外型別。

---

## 契約檔案約定

| 項目     | 說明                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------- |
| **目錄** | `app/shared/contracts/`；每支 API 或 feature 一檔，如 `items.contract.ts`。                         |
| **內容** | Request schema（body/query）、Response schema（成功與錯誤形狀）、實體 schema（如 mockItemSchema）。 |
| **命名** | `*Schema` 為 Zod schema；`*Contract` 為 `z.infer<>` 型別。                                          |
| **匯出** | 由 `app/shared/contracts/index.ts` 統一 re-export。                                                 |

---

## 使用處

1. **MSW handler**：回傳前以對應 response schema `parse()`，fixture 以實體 schema parse，確保 mock 符合契約。
2. **Route handler（可選）**：回傳前對 response 做 `schema.parse()` 或 `schema.safeParse()`，錯誤時回 500 或 400。
3. **Loader / API client**：收到 response 後以 response schema `safeParse()`，失敗則視為契約違反或網路錯誤。

---

## Template：新增 API 契約

```ts
// app/shared/contracts/<feature>.contract.ts
import { z } from "zod";

export const entitySchema = z.object({
  id: z.string(),
  // ...
});

export const listResponseSchema = z.object({
  data: z.array(entitySchema),
});

export const getResponseSchema = z.object({
  data: entitySchema,
});

export const createRequestSchema = z.object({
  name: z.string().min(1),
  // ...
});
```

---

## 與 OpenAPI 的關係

- 若未來導入 OpenAPI：可從 Zod 產出 JSON Schema / OpenAPI snippet，或由 OpenAPI 產 Zod（如 openapi-zod-client），以單一來源減少漂移。
- 現階段：契約以 Zod 為單一來源，handler 與 route 皆依此驗證。
