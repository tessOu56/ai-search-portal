/**
 * Tool registry（agentic 階段二）：allowlist 升級為契約驅動 registry。
 * 每個 tool 綁 metadata（風險層級/HITL/audit/timeout）+ I/O schema，
 * 無 schema 無法註冊（defineToolContract 型別層強制）。
 * 對外行為不變：DEFAULT_ALLOWED_TOOLS / isAllowedTool 語意同前。
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

export const DEFAULT_ALLOWED_TOOLS = [
  "items.lookup",
  "metadata.lookup",
  "context.resolve_metric",
  "context.bindings",
  "rag.search",
] as const;

export type AllowedToolName = (typeof DEFAULT_ALLOWED_TOOLS)[number];

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
};

export function isAllowedTool(name: string): name is AllowedToolName {
  return (DEFAULT_ALLOWED_TOOLS as readonly string[]).includes(name);
}

export function getToolContract(name: AllowedToolName): ToolContractDefinition {
  // name is a closed AllowedToolName union, not arbitrary user input.
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

/**
 * Governed tools（write 類）：契約已註冊、**不在 DEFAULT_ALLOWED_TOOLS**。
 * 進 allowlist 前置條件 = 階段三 HITL 伺服器端強制落地（見 specs/schemas/tool-contract.md）。
 */
export const GOVERNED_TOOL_REGISTRY: Record<
  AgentGovernedToolName,
  ToolContractDefinition
> = {
  "access_request.draft": defineToolContract(
    AGENT_GOVERNED_TOOL_METADATA["access_request.draft"],
    {
      input: toolAccessRequestDraftInputSchema,
      output: toolAccessRequestDraftOutputSchema,
    }
  ),
  "access_request.submit": defineToolContract(
    AGENT_GOVERNED_TOOL_METADATA["access_request.submit"],
    {
      input: toolAccessRequestSubmitInputSchema,
      output: toolAccessRequestSubmitOutputSchema,
    }
  ),
};

export function isGovernedTool(name: string): name is AgentGovernedToolName {
  return name in GOVERNED_TOOL_REGISTRY;
}
