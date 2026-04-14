import {
  stableChatFinalSchema,
  stableChatMetaSchema,
} from "@ai-search-portal/contracts";

import { buildLuiResponse, splitToTokens } from "./lui-mock.js";
import { runRagPipelineEvents } from "./rag/pipeline.js";
import { assertQueryableText } from "./tools/guardrails.js";
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

  assertQueryableText(query);

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
  yield { event: "internal.done", data: "{}" };
}
