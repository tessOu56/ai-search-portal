/**
 * Agent tool contracts（agentic 階段二地基）。
 * 每個 tool 的 metadata（風險層級/HITL/audit/timeout）與 I/O schema 皆為契約，
 * registry 無 schema 不得註冊（型別層擋）。規格：specs/schemas/tool-contract.md。
 */

import { z } from "zod";

import { userRoleSchema } from "./access-request.contract.js";

export const toolRiskLevelSchema = z.enum(["low", "medium", "high"]);

export type ToolRiskLevel = z.infer<typeof toolRiskLevelSchema>;

/** 點分小寫命名，對齊既有 allowlist / MCP tool 慣例。 */
export const toolNamePatternSchema = z
  .string()
  .regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/, "expect dot.separated name");

export const toolMetadataSchema = z
  .object({
    name: toolNamePatternSchema,
    description: z.string().min(1),
    riskLevel: toolRiskLevelSchema,
    /** true = 執行前必須停下等人工確認（伺服器端強制，非 UI 擋）。 */
    requiresHitl: z.boolean(),
    /** true = 執行必須寫入 audit log。 */
    forceAudit: z.boolean(),
    requiredRoles: z.array(userRoleSchema).optional(),
    timeoutMs: z.number().int().positive(),
  })
  .superRefine((meta, ctx) => {
    // 治理不變式：high-risk tool 一律 HITL；違反即無法通過契約 parse。
    if (meta.riskLevel === "high" && !meta.requiresHitl) {
      ctx.addIssue({
        code: "custom",
        path: ["requiresHitl"],
        message: "high-risk tools must require HITL",
      });
    }
  });

export type ToolMetadataContract = z.infer<typeof toolMetadataSchema>;

/** 現役 agent tools（與 agent-core DEFAULT_ALLOWED_TOOLS 對齊；registry.test 交叉驗證）。 */
export const agentToolNameSchema = z.enum([
  "items.lookup",
  "metadata.lookup",
  "context.resolve_metric",
  "context.bindings",
  "rag.search",
]);

export type AgentToolName = z.infer<typeof agentToolNameSchema>;

// ---- Per-tool I/O schemas（對齊 packages/agent-core/src/tools/execute.ts 實際形狀）----

export const toolItemsLookupInputSchema = z.object({
  query: z.string().min(1),
});

export const toolItemsLookupOutputSchema = z.object({
  matches: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().nullable(),
    })
  ),
  total: z.number().int().nonnegative(),
});

export const toolMetadataLookupInputSchema = z.object({
  query: z.string().min(1),
});

export const toolMetadataLookupOutputSchema = z.object({
  matches: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      assetType: z.string(),
    })
  ),
  total: z.number().int().nonnegative(),
});

export const toolContextResolveMetricInputSchema = z.object({
  metricId: z.string().min(1),
  packId: z.string().min(1).optional(),
});

export const toolContextResolveMetricOutputSchema = z.object({
  metric: z.object({
    id: z.string(),
    definition: z.string(),
    owner: z.string(),
  }),
});

export const toolContextBindingsInputSchema = z.object({
  contextRef: z.string().min(1).optional(),
  packId: z.string().min(1).optional(),
});

export const toolContextBindingsOutputSchema = z.object({
  bindings: z.array(
    z.object({
      contextRef: z.string(),
      module: z.string(),
      entityId: z.string(),
      relation: z.string(),
      resolved: z.boolean(),
      entityName: z.string().optional(),
    })
  ),
});

export const toolRagSearchInputSchema = z.object({
  query: z.string().min(1),
});

/** RAG 管線輸出於 Phase 3 真實化時收斂為嚴格 schema；先以 unknown 佔位（仍是必填 schema）。 */
export const toolRagSearchOutputSchema = z.unknown();

// ---- Metadata registry（serializable；供 registry 與未來 MCP discover 使用）----

const DEFAULT_TOOL_TIMEOUT_MS = 3000; // 對齊 execute.ts 各 *_TIMEOUT_MS 預設

export const AGENT_TOOL_METADATA: Record<AgentToolName, ToolMetadataContract> =
  {
    "items.lookup": toolMetadataSchema.parse({
      name: "items.lookup",
      description: "Keyword lookup over Items API (read-only).",
      riskLevel: "low",
      requiresHitl: false,
      forceAudit: false,
      timeoutMs: DEFAULT_TOOL_TIMEOUT_MS,
    }),
    "metadata.lookup": toolMetadataSchema.parse({
      name: "metadata.lookup",
      description: "Keyword lookup over Metadata API (read-only).",
      riskLevel: "low",
      requiresHitl: false,
      forceAudit: false,
      timeoutMs: DEFAULT_TOOL_TIMEOUT_MS,
    }),
    "context.resolve_metric": toolMetadataSchema.parse({
      name: "context.resolve_metric",
      description: "Resolve metric definition from active context pack.",
      riskLevel: "low",
      requiresHitl: false,
      forceAudit: false,
      timeoutMs: DEFAULT_TOOL_TIMEOUT_MS,
    }),
    "context.bindings": toolMetadataSchema.parse({
      name: "context.bindings",
      description: "Resolve domain bindings for a context ref.",
      riskLevel: "low",
      requiresHitl: false,
      forceAudit: false,
      timeoutMs: DEFAULT_TOOL_TIMEOUT_MS,
    }),
    "rag.search": toolMetadataSchema.parse({
      name: "rag.search",
      description: "Local RAG search over portal knowledge (read-only).",
      riskLevel: "low",
      requiresHitl: false,
      forceAudit: false,
      timeoutMs: DEFAULT_TOOL_TIMEOUT_MS,
    }),
  };

// ---- Tool contract（metadata + I/O schema 綁定；無 schema 無法建構）----

export type ToolContractDefinition<
  TInput extends z.ZodTypeAny = z.ZodTypeAny,
  TOutput extends z.ZodTypeAny = z.ZodTypeAny,
> = {
  metadata: ToolMetadataContract;
  input: TInput;
  output: TOutput;
};

/** 建構時即 parse metadata（fail fast）；input/output 為必填 schema。 */
export function defineToolContract<
  TInput extends z.ZodTypeAny,
  TOutput extends z.ZodTypeAny,
>(
  metadata: ToolMetadataContract,
  io: { input: TInput; output: TOutput }
): ToolContractDefinition<TInput, TOutput> {
  return Object.freeze({
    metadata: toolMetadataSchema.parse(metadata),
    input: io.input,
    output: io.output,
  });
}
