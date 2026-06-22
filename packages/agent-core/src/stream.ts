import {
  internalRagStepPayloadSchema,
  stableChatFinalSchema,
  stableChatMetaSchema,
} from "@ai-search-portal/contracts";

import { buildLuiResponse, splitToTokens } from "./lui-mock.js";
import { beginChatTrace } from "./observability/langfuse.js";
import { runRagPipelineEvents } from "./rag/pipeline.js";
import type { SseEventPart } from "./sse-types.js";
import {
  executeItemsLookup,
  executeMetadataLookup,
  isItemsLookupEnabled,
  isMetadataLookupEnabled,
} from "./tools/execute.js";
import { assertQueryableText, GuardrailViolation } from "./tools/guardrails.js";
import { isAllowedTool } from "./tools/registry.js";

export type { SseEventPart } from "./sse-types.js";

function toolStatusPart(tool: string, status: string): SseEventPart | null {
  if (!isAllowedTool(tool)) {
    return null;
  }
  return {
    event: "internal.tool_status",
    data: JSON.stringify({ tool, status }),
  };
}

async function* emitItemsLookupEvents(
  query: string
): AsyncGenerator<SseEventPart> {
  const started = toolStatusPart("items.lookup", "started");
  if (started) {
    yield started;
  }
  const result = await executeItemsLookup(query);
  const done = toolStatusPart(
    "items.lookup",
    result.ok ? "completed" : "failed"
  );
  if (done) {
    yield done;
  }
}

async function* emitMetadataLookupEvents(
  query: string
): AsyncGenerator<SseEventPart> {
  const started = toolStatusPart("metadata.lookup", "started");
  if (started) {
    yield started;
  }
  const result = await executeMetadataLookup(query);
  const done = toolStatusPart(
    "metadata.lookup",
    result.ok ? "completed" : "failed"
  );
  if (done) {
    yield done;
  }
}

/**
 * 產生 **內部** SSE 事件流（Gateway 再以 mapInternalSseToStable 轉成對外穩定事件）。
 */
export async function* streamChatInternalEvents(args: {
  query: string;
  traceId?: string;
  /** Phase 3：是否發出 rag.search tool_status */
  emitMockToolStatus?: boolean;
  /** Phase 3：是否跑 RAG internal 步驟事件 */
  includeRagSteps?: boolean;
  /** Phase 3：是否執行 items.lookup（預設：env 啟用時 true） */
  executeItemsLookup?: boolean;
  /** Metadata catalog lookup */
  executeMetadataLookup?: boolean;
}): AsyncGenerator<SseEventPart> {
  const {
    query,
    traceId,
    emitMockToolStatus = true,
    includeRagSteps = true,
    executeItemsLookup: runItemsLookup = isItemsLookupEnabled(),
    executeMetadataLookup: runMetadataLookup = isMetadataLookupEnabled(),
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

  if (runItemsLookup) {
    yield* emitItemsLookupEvents(query);
  }

  if (runMetadataLookup) {
    yield* emitMetadataLookupEvents(query);
  }

  if (emitMockToolStatus) {
    const ragStarted = toolStatusPart("rag.search", "started");
    if (ragStarted) {
      yield ragStarted;
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
    const ragDone = toolStatusPart("rag.search", "completed");
    if (ragDone) {
      yield ragDone;
    }
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
