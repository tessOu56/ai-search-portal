# Contract 與 Schema 規範

**類型**：spec | **權重**：1

本專案以 **runtime 可驗證的契約** 為準，不只依賴 TypeScript 型別。Mock 與 production 共用同一份 schema，避免漂移。

---

## 工具與位置

- **Zod**：契約定義與 parse/safeParse（**[`packages/shared-contracts`](../../packages/shared-contracts/)**，npm：`@ai-search-portal/contracts`）。
- **型別**：由 Zod schema 推導（`z.infer<typeof xxxSchema>`），可與既有 `*.types.ts` 對齊或逐步取代對外型別。
- **OpenAPI**：[`specs/openapi/openapi.yaml`](../openapi/openapi.yaml)；型別產物 `packages/shared-contracts/src/generated/openapi-types.ts`（**僅** `pnpm run codegen:openapi` 更新）。SoT 演進見 [specs/README.md](../README.md)。

---

## 契約檔案約定

| 項目         | 說明                                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| **定義處**   | `packages/shared-contracts/src/*.contract.ts`；每支 API 或 feature 一檔（如 `items.contract.ts`）。                             |
| **App 入口** | `app/shared/contracts/index.ts` **僅** re-export `@ai-search-portal/contracts`，禁止新增 `app/shared/contracts/*.contract.ts`。 |
| **內容**     | Request schema（body/query）、Response schema（成功與錯誤形狀）、實體 schema（如 mockItemSchema）。                             |
| **命名**     | `*Schema` 為 Zod schema；`*Contract` 為 `z.infer<>` 型別。                                                                      |
| **匯出**     | 由 `packages/shared-contracts/src/index.ts` 統一 re-export；App 端 barrel 再轉載。                                              |

---

## 使用處

1. **MSW handler**：回傳前以對應 response schema `parse()`，fixture 以實體 schema parse，確保 mock 符合契約。
2. **Route handler（可選）**：回傳前對 response 做 `schema.parse()` 或 `schema.safeParse()`，錯誤時回 500 或 400。
3. **Loader / API client**：收到 response 後以 response schema `safeParse()`，失敗則視為契約違反或網路錯誤。

---

## Template：新增 API 契約

```ts
// packages/shared-contracts/src/<feature>.contract.ts
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

- **現況（過渡期）**：Zod（package）為程式層 SoT；OpenAPI 與之對齊，並以 `openapi-typescript` 產生 `openapi-types.ts`；CI 以 Spectral + `verify:openapi-codegen` 防漂移。詳見 [specs/README.md](../README.md)。
- **切換後（另開 ADR）**：可改為 OpenAPI 為 HTTP 唯一 SoT，或保留 Zod 為 runtime 來源並由工具產 OpenAPI——見 [docs/adr/spec-driven-contracts-and-sot.md](../../docs/adr/spec-driven-contracts-and-sot.md)。
