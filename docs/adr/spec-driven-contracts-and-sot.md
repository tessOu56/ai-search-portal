# ADR：Spec-driven 契約與單一來源（SoT）

**狀態**：Accepted（演進中）  
**日期**：2026-04-09

## 背景

前後端分屬不同 deployable，但採 **monorepo** 以降低 spec／契約同步成本。先前 `backend` 曾手抄 Zod，違反單一真實來源。

## 決策

1. **契約程式**集中在 **`packages/shared-contracts`**（npm：`@ai-search-portal/contracts`），Remix `app/shared/contracts/index.ts` **僅 re-export**，不得新增 `*.contract.ts`。
2. **Import 邊界**：`app/**` 與 `backend/**` **不得**互相 import；API 形狀僅能經 `@ai-search-portal/contracts`。
3. **過渡期（階段一～二）**：Zod 為程式層 SoT；**`specs/openapi/`** 與 Zod **雙軌對齊**，OpenAPI 暫非唯一強制來源；變更順序為 **先 Zod，後 OpenAPI + codegen**。
4. **切換後（另開 ADR 宣告）**：HTTP SoT 改為 OpenAPI；`shared-contracts` 以 **generated** 為主。
5. **下一決策點**：OpenAPI 完全取代 Zod 作為來源 **vs** Zod 為 runtime 來源並由工具產出 OpenAPI——待切換前決定。

## 後果

- 需維護 `pnpm run codegen:openapi` 與 CI diff，避免 spec 與產物漂移。
- Remix／Vite 與 backend 建置前須 **`build:contracts`**（含 codegen）。
