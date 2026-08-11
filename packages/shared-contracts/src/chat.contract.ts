/**
 * Chat API（LUI）契約：穩定對外 SSE + Agent 內部事件映射。
 * 見 docs/architecture/ai-product/stable-chat-contract.md、specs/events/chat-stream.md
 */

import { z } from "zod";

/** GET /api/chat、GET /v1/chat/stream 共用 query */
export const chatQueryParamsSchema = z.object({
  q: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1)),
  sessionId: z.string().min(1).optional(),
});

export type ChatQueryParams = z.infer<typeof chatQueryParamsSchema>;

/** 穩定層：meta */
export const stableChatMetaSchema = z.object({
  query: z.string(),
  summary: z.string(),
  confidence: z.number(),
  traceId: z.string().optional(),
});

/** 穩定層：final */
export const luiSourceSchema = z.object({
  title: z.string(),
  url: z.string(),
  /** Origin citation for grounded hits, e.g. glossary terms (T-2026-071). */
  source: z.string().optional(),
});

export const stableChatFinalSchema = z.object({
  sources: z.array(luiSourceSchema),
  nextSteps: z.array(z.string()),
});

/** 穩定層：error 事件 */
export const stableChatErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
});

/** 穩定層：tool_status（Phase 3+） */
export const stableToolStatusSchema = z.object({
  tool: z.string(),
  status: z.string(),
});

/** 內部：chunk */
export const internalChunkPayloadSchema = z.object({
  text: z.string(),
});

/** 內部：tool_status */
export const internalToolStatusPayloadSchema = stableToolStatusSchema;

/** 內部：rag 步驟（不轉發前端） */
export const internalRagStepPayloadSchema = z.object({
  step: z.enum(["retrieve", "rerank", "compose"]),
  detail: z.string().optional(),
});

export type InternalRagStepPayload = z.infer<
  typeof internalRagStepPayloadSchema
>;

/**
 * 將 Agent 內部 SSE 事件映射為對前端穩定事件。
 * `internal.rag_step` 預設略過（不轉發）。
 */
export function mapInternalSseToStable(args: {
  eventName: string;
  data: string;
}):
  | { kind: "mapped"; stableEvent: string; stableData: string }
  | { kind: "skip" }
  | { kind: "skip_internal_only" } {
  const { eventName, data } = args;

  switch (eventName) {
    case "internal.meta": {
      const parsed = JSON.parse(data) as unknown;
      const meta = stableChatMetaSchema.parse(parsed);
      return {
        kind: "mapped",
        stableEvent: "meta",
        stableData: JSON.stringify(meta),
      };
    }
    case "internal.chunk": {
      const parsed = JSON.parse(data) as unknown;
      const chunk = internalChunkPayloadSchema.parse(parsed);
      return { kind: "mapped", stableEvent: "token", stableData: chunk.text };
    }
    case "internal.tool_status": {
      const parsed = JSON.parse(data) as unknown;
      const ts = internalToolStatusPayloadSchema.parse(parsed);
      return {
        kind: "mapped",
        stableEvent: "tool_status",
        stableData: JSON.stringify(ts),
      };
    }
    case "internal.final": {
      const parsed = JSON.parse(data) as unknown;
      const fin = stableChatFinalSchema.parse(parsed);
      return {
        kind: "mapped",
        stableEvent: "final",
        stableData: JSON.stringify(fin),
      };
    }
    case "internal.done":
      return { kind: "mapped", stableEvent: "done", stableData: "done" };
    case "internal.error": {
      const parsed = JSON.parse(data) as unknown;
      const err = stableChatErrorSchema.parse(parsed);
      return {
        kind: "mapped",
        /** 使用 `failure` 避免與 EventSource 內建 `error` 混淆 */
        stableEvent: "failure",
        stableData: JSON.stringify(err),
      };
    }
    case "internal.rag_step":
      return { kind: "skip_internal_only" };
    default:
      return { kind: "skip" };
  }
}
