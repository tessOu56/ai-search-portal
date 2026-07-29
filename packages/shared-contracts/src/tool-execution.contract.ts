/**
 * Tool execution envelope — HITL / risk gate results (T-2026-068).
 */

import { z } from "zod";

export const toolExecutionErrorCodeSchema = z.enum([
  "HITL_REQUIRED",
  "TOOL_DENIED",
  "TOOL_CONTRACT_ERROR",
  "TOOL_NOT_FOUND",
  "TOOL_EXECUTION_FAILED",
]);

export type ToolExecutionErrorCode = z.infer<
  typeof toolExecutionErrorCodeSchema
>;

export const toolExecutionErrorSchema = z.object({
  code: toolExecutionErrorCodeSchema,
  message: z.string().min(1),
  tool: z.string().min(1).optional(),
  riskLevel: z.enum(["low", "medium", "high"]).optional(),
});

export type ToolExecutionError = z.infer<typeof toolExecutionErrorSchema>;

export const toolExecutionContextSchema = z.object({
  /** Human confirmed high-risk tool (server-enforced HITL). */
  hitlConfirmed: z.boolean().optional(),
  actorRole: z.enum(["analyst", "data_admin", "engineer"]).optional(),
  confirmationId: z.string().min(1).optional(),
});

export type ToolExecutionContext = z.infer<typeof toolExecutionContextSchema>;

export const toolExecutionResultSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    data: z.unknown(),
  }),
  z.object({
    ok: z.literal(false),
    error: toolExecutionErrorSchema,
  }),
]);

export type ToolExecutionResult = z.infer<typeof toolExecutionResultSchema>;
