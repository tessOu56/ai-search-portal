/**
 * 對外 API 契約唯一入口：re-export `@ai-search-portal/contracts`。
 * 禁止在本目錄新增 `*.contract.ts`（Zod 定義僅能存在於 packages/shared-contracts）。
 */

export type { MockItemContract } from "@ai-search-portal/contracts";
export {
  chatQueryParamsSchema,
  createItemRequestSchema,
  errorResponseSchema,
  getItemResponseSchema,
  listItemsResponseSchema,
  mockItemSchema,
  stableChatErrorSchema,
  stableChatFinalSchema,
  stableChatMetaSchema,
  stableToolStatusSchema,
  updateItemRequestSchema,
} from "@ai-search-portal/contracts";
