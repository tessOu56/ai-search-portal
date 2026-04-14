# Schemas

**類型**：entry | **權重**：2

Runtime 可驗證的契約（Zod）之**程式單一來源**為 **`@ai-search-portal/contracts`**（[`packages/shared-contracts`](../../packages/shared-contracts/)）。Remix 透過 [`app/shared/contracts/index.ts`](../../app/shared/contracts/index.ts) 轉載，不得於 `app/shared/contracts/` 新增 `*.contract.ts`。

- OpenAPI（與 Zod 對齊、過渡期雙軌）：[`specs/openapi/openapi.yaml`](../openapi/openapi.yaml)
- 治理說明：[`specs/README.md`](../README.md)
- 對照與使用約定：[specs/api/contract-schema.md](../api/contract-schema.md)
- API 路徑與 handler 對照：[specs/api/handler-mapping.md](../api/handler-mapping.md)
