/**
 * Agent tool contracts（agentic 階段二地基）。
 * 每個 tool 的 metadata（風險層級/HITL/audit/timeout）與 I/O schema 皆為契約，
 * registry 無 schema 不得註冊（型別層擋）。規格：specs/schemas/tool-contract.md。
 */

import { z } from "zod";

import {
  accessRequestLifecycleStatusSchema,
  metadataAccessEvaluateRequestSchema,
  metadataAccessRequestSchema,
  policyDecisionSchema,
  userRoleSchema,
} from "./access-request.contract.js";

export const toolRiskLevelSchema = z.enum(["low", "medium", "high"]);

export type ToolRiskLevel = z.infer<typeof toolRiskLevelSchema>;

/** 點分小寫命名，對齊既有 allowlist / MCP tool 慣例。 */
export const toolNamePatternSchema = z
  .string()
  // Bounded dotted identifiers (a.b); not user-controlled free text.
  // eslint-disable-next-line security/detect-unsafe-regex -- closed identifier pattern
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

/** Read-only agent tools（不含 governed write）. */
const TOOL_ITEMS = "items.lookup";
const TOOL_METADATA = "metadata.lookup";
const TOOL_METRIC = "context.resolve_metric";
const TOOL_BINDINGS = "context.bindings";
const TOOL_RAG = "rag.search";
const TOOL_DRAFT = "access_request.draft";
const TOOL_SUBMIT = "access_request.submit";

export const agentReadToolNameSchema = z.enum([
  TOOL_ITEMS,
  TOOL_METADATA,
  TOOL_METRIC,
  TOOL_BINDINGS,
  TOOL_RAG,
]);

export type AgentReadToolName = z.infer<typeof agentReadToolNameSchema>;

/** 現役 agent tools（與 agent-core DEFAULT_ALLOWED_TOOLS 對齊；含 T-068 governed）。 */
export const agentToolNameSchema = z.enum([
  TOOL_ITEMS,
  TOOL_METADATA,
  TOOL_METRIC,
  TOOL_BINDINGS,
  TOOL_RAG,
  TOOL_DRAFT,
  TOOL_SUBMIT,
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
  packId: z.string().min(1).optional(),
});

export const toolRagSearchHitSchema = z.object({
  id: z.string(),
  kind: z.enum(["glossary", "narrative", "ops", "doc"]),
  title: z.string(),
  text: z.string(),
  score: z.number().nonnegative().optional(),
  refs: z.array(z.string()).default([]),
});

export const toolRagSearchOutputSchema = z.object({
  hits: z.array(toolRagSearchHitSchema),
  total: z.number().int().nonnegative(),
  packId: z.string().optional(),
});

// ---- Metadata registry（serializable；供 registry 與未來 MCP discover 使用）----

const DEFAULT_TOOL_TIMEOUT_MS = 3000; // 對齊 execute.ts 各 *_TIMEOUT_MS 預設

export const AGENT_TOOL_METADATA: Record<
  AgentReadToolName,
  ToolMetadataContract
> = {
  [TOOL_ITEMS]: toolMetadataSchema.parse({
    name: TOOL_ITEMS,
    description: "Keyword lookup over Items API (read-only).",
    riskLevel: "low",
    requiresHitl: false,
    forceAudit: false,
    timeoutMs: DEFAULT_TOOL_TIMEOUT_MS,
  }),
  [TOOL_METADATA]: toolMetadataSchema.parse({
    name: TOOL_METADATA,
    description: "Keyword lookup over Metadata API (read-only).",
    riskLevel: "low",
    requiresHitl: false,
    forceAudit: false,
    timeoutMs: DEFAULT_TOOL_TIMEOUT_MS,
  }),
  [TOOL_METRIC]: toolMetadataSchema.parse({
    name: TOOL_METRIC,
    description: "Resolve metric definition from active context pack.",
    riskLevel: "low",
    requiresHitl: false,
    forceAudit: false,
    timeoutMs: DEFAULT_TOOL_TIMEOUT_MS,
  }),
  [TOOL_BINDINGS]: toolMetadataSchema.parse({
    name: TOOL_BINDINGS,
    description: "Resolve domain bindings for a context ref.",
    riskLevel: "low",
    requiresHitl: false,
    forceAudit: false,
    timeoutMs: DEFAULT_TOOL_TIMEOUT_MS,
  }),
  [TOOL_RAG]: toolMetadataSchema.parse({
    name: TOOL_RAG,
    description: "Local RAG search over portal knowledge (read-only).",
    riskLevel: "low",
    requiresHitl: false,
    forceAudit: false,
    timeoutMs: DEFAULT_TOOL_TIMEOUT_MS,
  }),
};

// ---- Governed tools（write 類；T-068 HITL 伺服器端強制後可進 allowlist）----

export const agentGovernedToolNameSchema = z.enum([TOOL_DRAFT, TOOL_SUBMIT]);

export type AgentGovernedToolName = z.infer<typeof agentGovernedToolNameSchema>;

/** draft = 政策預審 + 申請草稿（無副作用）；I/O 直接複用 access-request 契約，零漂移。 */
export const toolAccessRequestDraftInputSchema =
  metadataAccessEvaluateRequestSchema;

export const toolAccessRequestDraftOutputSchema = z.object({
  decision: policyDecisionSchema,
  draft: metadataAccessRequestSchema,
});

/** submit = 正式送出（副作用 + 稽核）；high risk ⇒ HITL 必停（metadata 不變式驗證）。 */
export const toolAccessRequestSubmitInputSchema = metadataAccessRequestSchema;

export const toolAccessRequestSubmitOutputSchema = z.object({
  requestId: z.string(),
  status: accessRequestLifecycleStatusSchema,
  decision: policyDecisionSchema,
  auditLogged: z.boolean(),
});

export const AGENT_GOVERNED_TOOL_METADATA: Record<
  AgentGovernedToolName,
  ToolMetadataContract
> = {
  [TOOL_DRAFT]: toolMetadataSchema.parse({
    name: TOOL_DRAFT,
    description:
      "Evaluate policy and prepare an access request draft (no side effects).",
    riskLevel: "medium",
    requiresHitl: false,
    forceAudit: false,
    timeoutMs: DEFAULT_TOOL_TIMEOUT_MS,
  }),
  [TOOL_SUBMIT]: toolMetadataSchema.parse({
    name: TOOL_SUBMIT,
    description:
      "Submit a metadata access request (side effects; audit required).",
    riskLevel: "high",
    requiresHitl: true, // 不變式：high ⇒ HITL；伺服器端強制屬階段三
    forceAudit: true,
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
