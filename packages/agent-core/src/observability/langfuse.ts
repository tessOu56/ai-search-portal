/**
 * Langfuse tracing for catalog chat (Sprint 3 / productization).
 * No-op unless LANGFUSE_HOST + LANGFUSE_PUBLIC_KEY + LANGFUSE_SECRET_KEY are set.
 */

import type { InternalRagStepPayload } from "@ai-search-portal/contracts";
import { Langfuse, type LangfuseTraceClient } from "langfuse";

export function isLangfuseEnabled(): boolean {
  return Boolean(
    process.env.LANGFUSE_HOST?.trim() &&
    process.env.LANGFUSE_PUBLIC_KEY?.trim() &&
    process.env.LANGFUSE_SECRET_KEY?.trim()
  );
}

let langfuseClient: Langfuse | null = null;

function getLangfuseClient(): Langfuse | null {
  if (!isLangfuseEnabled()) {
    return null;
  }
  if (!langfuseClient) {
    langfuseClient = new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_HOST?.replace(/\/$/, ""),
    });
  }
  return langfuseClient;
}

/** Test-only: reset singleton between cases. */
export function resetLangfuseClientForTests(): void {
  langfuseClient = null;
}

export type ChatTraceSession = {
  traceId: string;
  recordRagStep: (step: InternalRagStepPayload) => void;
  complete: (args: {
    summary: string;
    confidence: number;
    sourceCount: number;
    answerPreview: string;
  }) => void;
  fail: (args: { code: string; message: string }) => void;
};

function scheduleFlush(client: Langfuse): void {
  void client.flushAsync().catch((err: unknown) => {
    if (
      process.env.NODE_ENV !== "production" &&
      typeof console !== "undefined"
    ) {
      console.warn("[langfuse] flush failed", err);
    }
  });
}

function createSession(
  trace: LangfuseTraceClient,
  traceId: string,
  query: string
): ChatTraceSession {
  let ragPipelineSpan: ReturnType<LangfuseTraceClient["span"]> | undefined;

  return {
    traceId,
    recordRagStep(step) {
      if (!ragPipelineSpan) {
        ragPipelineSpan = trace.span({
          name: "rag.pipeline",
          input: { steps: [] },
        });
      }
      ragPipelineSpan.span({
        name: `rag.${step.step}`,
        input: { detail: step.detail },
      });
    },
    complete({ summary, confidence, sourceCount, answerPreview }) {
      trace.generation({
        name: "lui-mock",
        model: "mock-lui-v1",
        input: { query },
        output: { summary, answerPreview, confidence, sourceCount },
      });
      trace.update({
        output: { summary, confidence, sourceCount },
        metadata: { status: "ok" },
      });
      const client = getLangfuseClient();
      if (client) scheduleFlush(client);
    },
    fail({ code, message }) {
      trace.update({
        output: { error: { code, message } },
        metadata: { status: "guardrail_blocked", severity: "error" },
      });
      const client = getLangfuseClient();
      if (client) scheduleFlush(client);
    },
  };
}

/** Opens a Langfuse trace for one chat stream; returns null when env is unset. */
export function beginChatTrace(args: {
  traceId?: string;
  query: string;
}): ChatTraceSession | null {
  const client = getLangfuseClient();
  if (!client) {
    return null;
  }

  const traceId = args.traceId?.trim()
    ? args.traceId.trim()
    : crypto.randomUUID();
  const trace = client.trace({
    id: traceId,
    name: "chat-stream",
    input: { query: args.query },
    metadata: { component: "agent-core" },
  });

  return createSession(trace, traceId, args.query);
}
