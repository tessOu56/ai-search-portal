/**
 * API 契約匯出：Zod schema 與型別。
 * 新增 API 時於此 package 新增 <feature>.contract.ts 並在此 re-export。
 * OpenAPI 產物見 `./generated/openapi-types.js`（由 `pnpm run codegen:openapi` 更新）。
 */

export type {
  AccessPurpose,
  PolicyDecisionContract,
  UserRole,
} from "./access-request.contract.js";
export {
  accessPurposeSchema,
  evaluateAccessResponseSchema,
  metadataAccessEvaluateRequestSchema,
  metadataAccessRequestSchema,
  policyDecisionSchema,
  submitAccessResponseSchema,
  userRoleSchema,
} from "./access-request.contract.js";
export type {
  AnalyticsEventContract,
  AnalyticsEventName,
} from "./analytics.contract.js";
export {
  accessRequestSubmittedEventSchema,
  aiFallbackTakenEventSchema,
  analyticsEventNameSchema,
  analyticsEventSchema,
  analyticsSurfaceSchema,
  hitlIntervenedEventSchema,
  taskCompletedEventSchema,
} from "./analytics.contract.js";
export type { AuditEventContract } from "./audit.contract.js";
export {
  auditActionSchema,
  auditEventSchema,
  auditOutcomeSchema,
  listAuditEventsResponseSchema,
} from "./audit.contract.js";
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
  ContextGlossaryTermContract,
  ContextMetricContract,
  ContextPackManifestContract,
  ContextRecentChangeContract,
  DomainBindingContract,
} from "./context.contract.js";
export {
  contextGlossaryTermSchema,
  contextMetricSchema,
  contextPackManifestSchema,
  contextRecentChangeSchema,
  DEFAULT_CONTEXT_PACK_ID,
  domainBindingSchema,
  domainBindingsFileSchema,
  getContextBindingsResponseSchema,
  getContextMetricResponseSchema,
  listContextPacksResponseSchema,
  resolvedDomainBindingSchema,
} from "./context.contract.js";
export type {
  components,
  operations,
  paths,
} from "./generated/openapi-types.js";
export type { GenUiDocumentContract, GenUiNodeType } from "./genui.contract.js";
export {
  genUiDocumentSchema,
  genUiNodeSchema,
  genUiNodeTypeSchema,
  lineageGraphPropsSchema,
  metadataColumnsTablePropsSchema,
  metadataSummaryCardPropsSchema,
} from "./genui.contract.js";
export type { MockItemContract } from "./items.contract.js";
export {
  createItemRequestSchema,
  errorResponseSchema,
  getItemResponseSchema,
  listItemsResponseSchema,
  mockItemSchema,
  updateItemRequestSchema,
} from "./items.contract.js";
export type { McpArgsParseResult, McpToolName } from "./mcp.contract.js";
export {
  MCP_TOOL_ARG_SCHEMAS,
  MCP_TOOL_METADATA,
  MCP_TOOL_NAME_GET,
  MCP_TOOL_NAME_LINEAGE,
  MCP_TOOL_NAME_POLICY,
  MCP_TOOL_NAME_SEARCH,
  MCP_TOOL_NAMES,
  mcpClientMetaSchema,
  mcpDiscoverSchema,
  mcpMetadataGetArgsSchema,
  mcpMetadataLineageArgsSchema,
  mcpMetadataSearchArgsSchema,
  mcpPolicyEvaluateArgsSchema,
  mcpTaskEventSchema,
  mcpToolNameSchema,
  mcpToolsCallRequestSchema,
  mcpToolsCallResponseSchema,
  parseMcpToolArguments,
} from "./mcp.contract.js";
export type {
  MetadataAssetDetailContract,
  MetadataAssetSummaryContract,
  MetadataAssetType,
  MetadataColumnContract,
} from "./metadata.contract.js";
export {
  getMetadataAssetResponseSchema,
  listMetadataResponseSchema,
  metadataAssetDetailSchema,
  metadataAssetSummarySchema,
  metadataAssetTypeSchema,
  metadataColumnSchema,
  metadataLineageResponseSchema,
  metadataPaginationSchema,
} from "./metadata.contract.js";
export type {
  AgentGovernedToolName,
  AgentToolName,
  ToolContractDefinition,
  ToolMetadataContract,
  ToolRiskLevel,
} from "./tool.contract.js";
export {
  AGENT_GOVERNED_TOOL_METADATA,
  agentGovernedToolNameSchema,
  toolAccessRequestDraftInputSchema,
  toolAccessRequestDraftOutputSchema,
  toolAccessRequestSubmitInputSchema,
  toolAccessRequestSubmitOutputSchema,
} from "./tool.contract.js";
export {
  AGENT_TOOL_METADATA,
  agentToolNameSchema,
  defineToolContract,
  toolContextBindingsInputSchema,
  toolContextBindingsOutputSchema,
  toolContextResolveMetricInputSchema,
  toolContextResolveMetricOutputSchema,
  toolItemsLookupInputSchema,
  toolItemsLookupOutputSchema,
  toolMetadataLookupInputSchema,
  toolMetadataLookupOutputSchema,
  toolMetadataSchema,
  toolRagSearchInputSchema,
  toolRagSearchOutputSchema,
  toolRiskLevelSchema,
} from "./tool.contract.js";
