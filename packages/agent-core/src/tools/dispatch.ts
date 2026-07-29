/**
 * Risk-gated tool dispatcher (T-2026-068).
 * high + requiresHitl ⇒ reject without hitlConfirmed before any side effect.
 */

import {
  type ToolExecutionContext,
  toolExecutionContextSchema,
  type ToolExecutionResult,
  toolExecutionResultSchema,
} from "@ai-search-portal/contracts";

import {
  type AllowedToolName,
  getToolContract,
  GOVERNED_TOOL_REGISTRY,
  isAllowedTool,
  isGovernedTool,
  TOOL_REGISTRY,
} from "./registry.js";

export type ToolExecutor = (
  args: unknown,
  ctx: ToolExecutionContext
) => Promise<unknown>;

function resolveContract(name: string) {
  if (isGovernedTool(name)) {
    // eslint-disable-next-line security/detect-object-injection -- narrowed governed key
    return GOVERNED_TOOL_REGISTRY[name];
  }
  if (isAllowedTool(name)) {
    return getToolContract(name);
  }
  return null;
}

/**
 * Execute a registered tool with risk / HITL enforcement.
 * Provide `executors[name]` for side-effect tools (draft/submit).
 */
export async function executeRegisteredTool(
  name: string,
  args: unknown,
  ctxInput: ToolExecutionContext = {},
  executors: Partial<Record<string, ToolExecutor>> = {}
): Promise<ToolExecutionResult> {
  const ctx = toolExecutionContextSchema.parse(ctxInput);
  const contract = resolveContract(name);
  if (!contract) {
    return toolExecutionResultSchema.parse({
      ok: false,
      error: {
        code: "TOOL_NOT_FOUND",
        message: `Unknown tool: ${name}`,
        tool: name,
      },
    });
  }

  const parsedArgs = contract.input.safeParse(args);
  if (!parsedArgs.success) {
    return toolExecutionResultSchema.parse({
      ok: false,
      error: {
        code: "TOOL_CONTRACT_ERROR",
        message: "Invalid tool arguments",
        tool: name,
        riskLevel: contract.metadata.riskLevel,
      },
    });
  }

  const { metadata } = contract;
  if (metadata.requiresHitl && !ctx.hitlConfirmed) {
    return toolExecutionResultSchema.parse({
      ok: false,
      error: {
        code: "HITL_REQUIRED",
        message: "Human confirmation required before executing this tool",
        tool: name,
        riskLevel: metadata.riskLevel,
      },
    });
  }

  // Medium tools without HITL still run (draft path); high only after confirm.
  // eslint-disable-next-line security/detect-object-injection -- tool name from registry
  const executor = executors[name];
  if (!executor) {
    // Read-only allowlist tools may omit executor when caller handles them elsewhere.
    if (isAllowedTool(name) && !isGovernedTool(name)) {
      return toolExecutionResultSchema.parse({
        ok: true,
        data: { deferred: true, tool: name as AllowedToolName },
      });
    }
    return toolExecutionResultSchema.parse({
      ok: false,
      error: {
        code: "TOOL_EXECUTION_FAILED",
        message: `No executor registered for ${name}`,
        tool: name,
        riskLevel: metadata.riskLevel,
      },
    });
  }

  try {
    const data = await executor(parsedArgs.data, ctx);
    const out = contract.output.safeParse(data);
    if (!out.success) {
      return toolExecutionResultSchema.parse({
        ok: false,
        error: {
          code: "TOOL_CONTRACT_ERROR",
          message: "Tool output failed contract parse",
          tool: name,
          riskLevel: metadata.riskLevel,
        },
      });
    }
    return toolExecutionResultSchema.parse({ ok: true, data: out.data });
  } catch (err) {
    return toolExecutionResultSchema.parse({
      ok: false,
      error: {
        code: "TOOL_EXECUTION_FAILED",
        message: err instanceof Error ? err.message : "Tool execution failed",
        tool: name,
        riskLevel: metadata.riskLevel,
      },
    });
  }
}

/** All contracts the dispatcher can resolve (allowlist ∪ governed). */
export function listDispatchableTools() {
  return {
    ...TOOL_REGISTRY,
    ...GOVERNED_TOOL_REGISTRY,
  };
}
