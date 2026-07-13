/**
 * Stateless MCP gateway spike contracts (2026-style _meta per request).
 * 階段二收尾（2026-07-13）：arguments 由寬鬆 z.record 收緊為 per-tool schema
 * （envelope 不變、對外非破壞）；discover 附風險註記。規格：specs/schemas/tool-contract.md。
 */

import { z } from "zod";

import {
  accessPurposeSchema,
  userRoleSchema,
} from "./access-request.contract.js";
import {
  type ToolMetadataContract,
  toolMetadataSchema,
  toolRiskLevelSchema,
} from "./tool.contract.js";

export const MCP_TOOL_NAMES = [
  "metadata.search",
  "metadata.get",
  "metadata.lineage",
  "policy.evaluate",
] as const;

export type McpToolName = (typeof MCP_TOOL_NAMES)[number];

export const MCP_TOOL_NAME_SEARCH = MCP_TOOL_NAMES[0];
export const MCP_TOOL_NAME_GET = MCP_TOOL_NAMES[1];
export const MCP_TOOL_NAME_LINEAGE = MCP_TOOL_NAMES[2];
export const MCP_TOOL_NAME_POLICY = MCP_TOOL_NAMES[3];

export const mcpClientMetaSchema = z.object({
  protocolVersion: z.string(),
  clientInfo: z.object({
    name: z.string(),
    version: z.string(),
  }),
  capabilities: z.record(z.string(), z.unknown()).optional(),
});

export const mcpToolNameSchema = z.enum(MCP_TOOL_NAMES);

export const mcpToolsCallRequestSchema = z.object({
  method: z.literal("tools/call"),
  params: z.object({
    name: mcpToolNameSchema,
    arguments: z.record(z.string(), z.unknown()),
  }),
  _meta: mcpClientMetaSchema,
});

export const mcpToolsCallResponseSchema = z.object({
  result: z.unknown().optional(),
  taskId: z.string().optional(),
  error: z.string().optional(),
});

export const mcpDiscoverSchema = z.object({
  protocolVersion: z.string(),
  serverInfo: z.object({
    name: z.string(),
    version: z.string(),
  }),
  tools: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      // 風險註記（optional → 對既有 client 非破壞）
      riskLevel: toolRiskLevelSchema.optional(),
      requiresHitl: z.boolean().optional(),
    })
  ),
  ttlMs: z.number().int().positive(),
});

// ---- Per-tool arguments schemas（取代 gateway 端 `as` 斷言）----

export const mcpMetadataSearchArgsSchema = z.object({
  q: z.string().optional(),
  type: z.string().optional(),
  page: z.number().int().positive().optional(),
});

export const mcpMetadataGetArgsSchema = z.object({
  assetId: z.string().min(1),
});

export const mcpMetadataLineageArgsSchema = z.object({
  assetId: z.string().min(1),
});

export const mcpPolicyEvaluateArgsSchema = z.object({
  assetId: z.string().min(1),
  purpose: accessPurposeSchema,
  role: userRoleSchema.optional(),
});

export const MCP_TOOL_ARG_SCHEMAS: Record<McpToolName, z.ZodTypeAny> = {
  [MCP_TOOL_NAME_SEARCH]: mcpMetadataSearchArgsSchema,
  [MCP_TOOL_NAME_GET]: mcpMetadataGetArgsSchema,
  [MCP_TOOL_NAME_LINEAGE]: mcpMetadataLineageArgsSchema,
  [MCP_TOOL_NAME_POLICY]: mcpPolicyEvaluateArgsSchema,
};

export type McpArgsParseResult<T = unknown> =
  { ok: true; data: T } | { ok: false; error: string };

function schemaForMcpTool(name: McpToolName): z.ZodTypeAny {
  switch (name) {
    case MCP_TOOL_NAME_SEARCH:
      return mcpMetadataSearchArgsSchema;
    case MCP_TOOL_NAME_GET:
      return mcpMetadataGetArgsSchema;
    case MCP_TOOL_NAME_LINEAGE:
      return mcpMetadataLineageArgsSchema;
    case MCP_TOOL_NAME_POLICY:
      return mcpPolicyEvaluateArgsSchema;
  }
}

/** Gateway 用：依 tool 名驗證 arguments；失敗回穩定錯誤訊息（不洩內部）。 */
export function parseMcpToolArguments(
  name: McpToolName,
  args: unknown
): McpArgsParseResult {
  const parsed = schemaForMcpTool(name).safeParse(args);
  if (parsed.success) return { ok: true, data: parsed.data };
  const path = parsed.error.issues[0]?.path.join(".") ?? "arguments";
  return { ok: false, error: `Invalid arguments: ${path}` };
}

/** MCP tools 風險註記（皆唯讀 → low；write 類走 agent governed tools，見 tool.contract）。 */
export const MCP_TOOL_METADATA: Record<McpToolName, ToolMetadataContract> = {
  [MCP_TOOL_NAME_SEARCH]: toolMetadataSchema.parse({
    name: MCP_TOOL_NAME_SEARCH,
    description: "Search metadata catalog assets",
    riskLevel: "low",
    requiresHitl: false,
    forceAudit: false,
    timeoutMs: 3000,
  }),
  [MCP_TOOL_NAME_GET]: toolMetadataSchema.parse({
    name: MCP_TOOL_NAME_GET,
    description: "Get metadata asset by id",
    riskLevel: "low",
    requiresHitl: false,
    forceAudit: false,
    timeoutMs: 3000,
  }),
  [MCP_TOOL_NAME_LINEAGE]: toolMetadataSchema.parse({
    name: MCP_TOOL_NAME_LINEAGE,
    description: "Resolve asset lineage graph",
    riskLevel: "low",
    requiresHitl: false,
    forceAudit: false,
    timeoutMs: 3000,
  }),
  [MCP_TOOL_NAME_POLICY]: toolMetadataSchema.parse({
    name: MCP_TOOL_NAME_POLICY,
    description: "Evaluate access policy for an asset",
    riskLevel: "low",
    requiresHitl: false,
    forceAudit: false,
    timeoutMs: 3000,
  }),
};

export const mcpTaskEventSchema = z.object({
  taskId: z.string(),
  status: z.enum(["pending", "running", "completed", "failed"]),
  progress: z.number().min(0).max(100).optional(),
  result: z.unknown().optional(),
});
