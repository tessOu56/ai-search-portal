/**
 * Tool registry（agentic 階段二）：allowlist 升級為契約驅動 registry。
 * 每個 tool 綁 metadata（風險層級/HITL/audit/timeout）+ I/O schema，
 * 無 schema 無法註冊（defineToolContract 型別層強制）。
 * 對外行為不變：DEFAULT_ALLOWED_TOOLS / isAllowedTool 語意同前。
 */

import {
  AGENT_TOOL_METADATA,
  defineToolContract,
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
  return TOOL_REGISTRY[name];
}

/** Serializable tool 清單（未來 MCP discover / guardrails 面板用）。 */
export function listToolMetadata(): ToolMetadataContract[] {
  return DEFAULT_ALLOWED_TOOLS.map((name) => TOOL_REGISTRY[name].metadata);
}
