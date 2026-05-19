import {
  internalRagStepPayloadSchema,
  stableChatFinalSchema,
  stableChatMetaSchema,
} from "@ai-search-portal/contracts";

import { buildLuiResponse, splitToTokens } from "./lui-mock.js";
import { beginChatTrace } from "./observability/langfuse.js";
import { runRagPipelineEvents } from "./rag/pipeline.js";
import { assertQueryableText, GuardrailViolation } from "./tools/guardrails.js";
import { isAllowedTool } from "./tools/registry.js";

export type SseEventPart = {
  event: string;
  data: string;
};

/**
 * 產生 **內部** SSE 事件流（Gateway 再以 mapInternalSseToStable 轉成對外穩定事件）。
 */
export async function* streamChatInternalEvents(args: {
  query: string;
  traceId?: string;
  /** Phase 3：是否發出 tool_status（mock） */
  emitMockToolStatus?: boolean;
  /** Phase 3：是否跑 RAG internal 步驟事件 */
  includeRagSteps?: boolean;
}): AsyncGenerator<SseEventPart> {
  const {
    query,
    traceId,
    emitMockToolStatus = true,
    includeRagSteps = true,
  } = args;

  const traceSession = beginChatTrace({ traceId, query });

  try {
    assertQueryableText(query);
  } catch (e) {
    if (e instanceof GuardrailViolation) {
      traceSession?.fail({ code: e.code, message: e.message });
      yield {
        event: "internal.error",
        data: JSON.stringify({ code: e.code, message: e.message }),
      };
      yield { event: "internal.done", data: "{}" };
      return;
    }
    throw e;
  }

  const response = buildLuiResponse(query);
  const metaPayload = stableChatMetaSchema.parse({
    query,
    summary: response.summary,
    confidence: response.confidence,
    traceId,
  });

  yield {
    event: "internal.meta",
    data: JSON.stringify(metaPayload),
  };

  if (emitMockToolStatus) {
    const toolName = "rag.search";
    if (isAllowedTool(toolName)) {
      yield {
        event: "internal.tool_status",
        data: JSON.stringify({ tool: toolName, status: "started" }),
      };
    }
  }

  if (includeRagSteps) {
    for await (const ev of runRagPipelineEvents(query)) {
      if (traceSession && ev.event === "internal.rag_step") {
        const parsed = internalRagStepPayloadSchema.safeParse(
          JSON.parse(ev.data)
        );
        if (parsed.success) {
          traceSession.recordRagStep(parsed.data);
        }
      }
      yield ev;
    }
  }

  if (emitMockToolStatus) {
    yield {
      event: "internal.tool_status",
      data: JSON.stringify({ tool: "rag.search", status: "completed" }),
    };
  }

  const tokens = splitToTokens(response.answer);
  for (const text of tokens) {
    yield { event: "internal.chunk", data: JSON.stringify({ text }) };
  }

  const finalPayload = stableChatFinalSchema.parse({
    sources: response.sources,
    nextSteps: response.nextSteps,
  });
  yield { event: "internal.final", data: JSON.stringify(finalPayload) };
  traceSession?.complete({
    summary: response.summary,
    confidence: response.confidence,
    sourceCount: response.sources.length,
    answerPreview: response.answer.slice(0, 200),
  });
  yield { event: "internal.done", data: "{}" };
}
