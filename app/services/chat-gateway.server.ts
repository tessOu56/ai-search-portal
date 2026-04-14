import { streamChatInternalEvents } from "@ai-search-portal/agent-core";
import { mapInternalSseToStable } from "@ai-search-portal/contracts";

import { readSseMessages } from "./sse-parse.server";

export type ChatGatewaySend = (args: { event: string; data: string }) => void;

/**
 * 從 Request 取得 trace：優先 W3C traceparent，其次 x-trace-id。
 */
export function getTraceIdFromRequest(request: Request): string | undefined {
  const tp = request.headers.get("traceparent");
  if (tp) {
    const parts = tp.split("-");
    if (parts.length >= 4 && parts[1]) return parts[1];
  }
  return request.headers.get("x-trace-id") ?? undefined;
}

function mapAndSend(send: ChatGatewaySend, eventName: string, data: string) {
  const mapped = mapInternalSseToStable({ eventName, data });
  if (mapped.kind === "skip") return;
  if (mapped.kind === "skip_internal_only") return;
  send({ event: mapped.stableEvent, data: mapped.stableData });
}

/**
 * 將 Agent **內部** SSE 轉成對外穩定 SSE（meta/token/final/done/failure/tool_status）。
 */
export async function pipeAgentHttpToStableSse(args: {
  agentBaseUrl: string;
  query: string;
  sessionId?: string;
  traceparent?: string;
  traceId?: string;
  signal: AbortSignal;
  send: ChatGatewaySend;
}): Promise<void> {
  const url = new URL("/v1/chat/stream", args.agentBaseUrl);
  url.searchParams.set("q", args.query);
  if (args.sessionId) url.searchParams.set("sessionId", args.sessionId);

  const headers = new Headers();
  if (args.traceparent) headers.set("traceparent", args.traceparent);
  if (args.traceId && !args.traceparent)
    headers.set("x-trace-id", args.traceId);

  const res = await fetch(url, { signal: args.signal, headers });
  if (!res.ok) {
    args.send({
      event: "failure",
      data: JSON.stringify({
        message: `Agent runtime error: HTTP ${res.status}`,
        code: "agent_http_error",
      }),
    });
    args.send({ event: "done", data: "done" });
    return;
  }

  for await (const msg of readSseMessages(res.body, args.signal)) {
    mapAndSend(args.send, msg.event, msg.data);
  }
}

/**
 * 同 process：直接跑 agent-core 內部流並映射。
 */
export async function pipeLocalAgentCoreToStableSse(args: {
  query: string;
  sessionId?: string;
  traceId?: string;
  send: ChatGatewaySend;
}): Promise<void> {
  void args.sessionId;
  for await (const part of streamChatInternalEvents({
    query: args.query,
    traceId: args.traceId,
    emitMockToolStatus: true,
    includeRagSteps: true,
  })) {
    mapAndSend(args.send, part.event, part.data);
  }
}

export function resolveAgentRuntimeUrl(): string | undefined {
  const raw = process.env.AGENT_RUNTIME_URL;
  if (!raw || raw.trim() === "") return undefined;
  return raw.replace(/\/$/, "");
}
