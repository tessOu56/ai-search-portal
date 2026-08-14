/**
 * Tool registry（agentic 階段二＋T-068）：allowlist 含 governed write tools，
 * 執行時由 dispatch.ts 強制 HITL。
 */

import {
  AGENT_GOVERNED_TOOL_METADATA,
  AGENT_TOOL_METADATA,
  type AgentGovernedToolName,
  defineToolContract,
  toolAccessRequestDraftInputSchema,
  toolAccessRequestDraftOutputSchema,
  toolAccessRequestSubmitInputSchema,
  toolAccessRequestSubmitOutputSchema,
  toolContextBindingsInputSchema,
  toolContextBindingsOutputSchema,
  toolContextResolveMetricInputSchema,
  toolContextResolveMetricOutputSchema,
  type ToolContractDefinition,
  toolItemsLookupInputSchema,
  toolItemsLookupOutputSchema,
  type ToolMetadataContract,
  toolMetadataLookupInputSchema,
  toolMetadataLookupOutputSchema,
  toolRagSearchInputSchema,
  toolRagSearchOutputSchema,
} from "@ai-search-portal/contracts";

const TOOL_DRAFT = "access_request.draft";
const TOOL_SUBMIT = "access_request.submit";

export const DEFAULT_ALLOWED_TOOLS = [
  "items.lookup",
  "metadata.lookup",
  "context.resolve_metric",
  "context.bindings",
  "rag.search",
  TOOL_DRAFT,
  TOOL_SUBMIT,
] as const;

export type AllowedToolName = (typeof DEFAULT_ALLOWED_TOOLS)[number];

export const GOVERNED_TOOL_REGISTRY: Record<
  AgentGovernedToolName,
  ToolContractDefinition
> = {
  // eslint-disable-next-line security/detect-object-injection -- allowlist key
  [TOOL_DRAFT]: defineToolContract(AGENT_GOVERNED_TOOL_METADATA[TOOL_DRAFT], {
    input: toolAccessRequestDraftInputSchema,
    output: toolAccessRequestDraftOutputSchema,
  }),
  // eslint-disable-next-line security/detect-object-injection -- allowlist key
  [TOOL_SUBMIT]: defineToolContract(AGENT_GOVERNED_TOOL_METADATA[TOOL_SUBMIT], {
    input: toolAccessRequestSubmitInputSchema,
    output: toolAccessRequestSubmitOutputSchema,
  }),
};

export const TOOL_REGISTRY: Record<AllowedToolName, ToolContractDefinition> = {
  "items.lookup": defineToolContract(AGENT_TOOL_METADATA["items.lookup"], {
    input: toolItemsLookupInputSchema,
    output: toolItemsLookupOutputSchema,
  }),
  "metadata.lookup": defineToolContract(
    AGENT_TOOL_METADATA["metadata.lookup"],
    {
      input: toolMetadataLookupInputSchema,
      output: toolMetadataLookupOutputSchema,
    }
  ),
  "context.resolve_metric": defineToolContract(
    AGENT_TOOL_METADATA["context.resolve_metric"],
    {
      input: toolContextResolveMetricInputSchema,
      output: toolContextResolveMetricOutputSchema,
    }
  ),
  "context.bindings": defineToolContract(
    AGENT_TOOL_METADATA["context.bindings"],
    {
      input: toolContextBindingsInputSchema,
      output: toolContextBindingsOutputSchema,
    }
  ),
  "rag.search": defineToolContract(AGENT_TOOL_METADATA["rag.search"], {
    input: toolRagSearchInputSchema,
    output: toolRagSearchOutputSchema,
  }),
  // eslint-disable-next-line security/detect-object-injection -- allowlist key
  [TOOL_DRAFT]: GOVERNED_TOOL_REGISTRY[TOOL_DRAFT],
  // eslint-disable-next-line security/detect-object-injection -- allowlist key
  [TOOL_SUBMIT]: GOVERNED_TOOL_REGISTRY[TOOL_SUBMIT],
};

export function isAllowedTool(name: string): name is AllowedToolName {
  return (DEFAULT_ALLOWED_TOOLS as readonly string[]).includes(name);
}

export function getToolContract(name: AllowedToolName): ToolContractDefinition {
  // eslint-disable-next-line security/detect-object-injection -- typed registry key
  return TOOL_REGISTRY[name];
}

/** Serializable tool 清單（未來 MCP discover / guardrails 面板用）。 */
export function listToolMetadata(): ToolMetadataContract[] {
  return DEFAULT_ALLOWED_TOOLS.map((name) => {
    // eslint-disable-next-line security/detect-object-injection -- typed registry key
    return TOOL_REGISTRY[name].metadata;
  });
}

export function isGovernedTool(name: string): name is AgentGovernedToolName {
  return name in GOVERNED_TOOL_REGISTRY;
}
