# ADR：Metadata Catalog POC — GenUI、MCP、Policy-as-Code

**狀態**：Accepted（POC）  
**日期**：2026-06-22

## 背景

需要可演示的 OpenMetadata 風格 catalog，並對齊 2026 Stateless MCP 與 Generative UI 趨勢，同時避免權限規則散落於前後端 `if/else`。

## 決策

1. **獨立 `/metadata` 模組**（不修改 `/catalog-search` T-2026-004）。
2. **Declarative GenUI**：`app/components/shared/genui` + Zod registry；未知 component 拒絕渲染。
3. **Static GenUI**：`metadata.lookup` agent tool → 結構化 catalog 結果。
4. **Stateless MCP spike**：`POST /api/mcp/gateway`、`.well-known/mcp.json`；每次請求帶 `_meta`。
5. **Policy-as-Code**：`specs/policies/access-request.rego` + `opa test`；runtime 預設 in-process fallback，`OPA_URL` 可切換 live OPA。
6. **Data Contract**：`specs/datacontracts/customer-profile.yaml` 對齊 `tbl-customers` fixture。
7. **Context packs**：可插拔領域 fixture 見 [context-pack-domain-binding.md](./context-pack-domain-binding.md)；預設 `enterprise-mau`。

## 分層

| 層            | 位置                                                                                   |
| ------------- | -------------------------------------------------------------------------------------- |
| OpenAPI + Zod | `specs/openapi`、`packages/shared-contracts`                                           |
| Data Contract | `specs/datacontracts/`                                                                 |
| Policy        | `specs/policies/`                                                                      |
| Catalog data  | `content/context-packs/`（預設 `enterprise-mau`）；過渡 `content/metadata-assets.json` |
| Remix UI      | `app/features/metadata`、`app/routes/metadata.*`                                       |
| Backend API   | `backend/src/routes/metadata.ts`                                                       |

## 延後

- MCP Apps sandbox iframe
- Playwright E2E
- AsyncAPI / Pact / Buf
- 完整多級審批工作流

## 相關

- [backend-spec-layer-opa.md](./backend-spec-layer-opa.md)
- [spec-driven-contracts-and-sot.md](./spec-driven-contracts-and-sot.md)
