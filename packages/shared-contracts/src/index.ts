/**
 * API 契約匯出：Zod schema 與型別。
 * 新增 API 時於此 package 新增 <feature>.contract.ts 並在此 re-export。
 * OpenAPI 產物見 `./generated/openapi-types.js`（由 `pnpm run codegen:openapi` 更新）。
 */

export type {
  ChatQueryParams,
  InternalRagStepPayload,
} from "./chat.contract.js";
export {
  chatQueryParamsSchema,
  internalChunkPayloadSchema,
  internalRagStepPayloadSchema,
  internalToolStatusPayloadSchema,
  luiSourceSchema,
  mapInternalSseToStable,
  stableChatErrorSchema,
  stableChatFinalSchema,
  stableChatMetaSchema,
  stableToolStatusSchema,
} from "./chat.contract.js";
export type {
  components,
  operations,
  paths,
} from "./generated/openapi-types.js";
export type { MockItemContract } from "./items.contract.js";
export {
  createItemRequestSchema,
  errorResponseSchema,
  getItemResponseSchema,
  listItemsResponseSchema,
  mockItemSchema,
  updateItemRequestSchema,
} from "./items.contract.js";
