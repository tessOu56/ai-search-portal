/**
 * 對外 API 契約唯一入口：re-export `@ai-search-portal/contracts`。
 */

export type {
  ContextGlossaryTermContract,
  ContextMetricContract,
  ContextPackManifestContract,
  DomainBindingContract,
  GenUiDocumentContract,
  MetadataAssetDetailContract,
  MetadataAssetSummaryContract,
  MetadataColumnContract,
  PolicyDecisionContract,
} from "@ai-search-portal/contracts";
export type { MockItemContract } from "@ai-search-portal/contracts";
export type { AuditEventContract } from "@ai-search-portal/contracts";
export type {
  KnowledgeChunkContract,
  KnowledgeChunkKind,
  KnowledgeSearchResponse,
} from "@ai-search-portal/contracts";
export type {
  AccessApplicationContract,
  GovernanceSessionRole,
} from "@ai-search-portal/contracts";
export {
  contextMetricSchema,
  contextPackManifestSchema,
  DEFAULT_CONTEXT_PACK_ID,
  evaluateAccessResponseSchema,
  genUiDocumentSchema,
  getContextBindingsResponseSchema,
  getContextMetricResponseSchema,
  getMetadataAssetResponseSchema,
  lineageGraphPropsSchema,
  listAccessApplicationsResponseSchema,
  listContextPacksResponseSchema,
  listMetadataResponseSchema,
  mcpDiscoverSchema,
  mcpTaskEventSchema,
  mcpToolsCallRequestSchema,
  mcpToolsCallResponseSchema,
  metadataAccessEvaluateRequestSchema,
  metadataAccessRequestSchema,
  metadataAssetDetailSchema,
  metadataColumnsTablePropsSchema,
  metadataLineageResponseSchema,
  metadataSummaryCardPropsSchema,
  policyDecisionSchema,
  reviewAccessRequestSchema,
  reviewAccessResponseSchema,
  submitAccessResponseSchema,
} from "@ai-search-portal/contracts";
export {
  accessApplicationSchema,
  governanceSessionRoleSchema,
} from "@ai-search-portal/contracts";
export {
  chatQueryParamsSchema,
  createItemRequestSchema,
  errorResponseSchema,
  getItemResponseSchema,
  inferIndustryFacetsFromText,
  knowledgeChunkKindSchema,
  knowledgeChunkSchema,
  knowledgeClassificationSchema,
  knowledgeIndustryStandardCodeSchema,
  knowledgeMaterialSchema,
  knowledgeProductTypeSchema,
  knowledgeSearchQuerySchema,
  knowledgeSearchResponseSchema,
  knowledgeTechniqueSchema,
  listItemsResponseSchema,
  mockItemSchema,
  normalizeIndustryStandard,
  stableChatErrorSchema,
  stableChatFinalSchema,
  stableChatMetaSchema,
  stableToolStatusSchema,
  standardsMatch,
  updateItemRequestSchema,
} from "@ai-search-portal/contracts";
export {
  agentToolNameSchema,
  auditEventSchema,
  listAuditEventsResponseSchema,
  toolMetadataSchema,
  toolRiskLevelSchema,
} from "@ai-search-portal/contracts";
