import { chatQueryParamsSchema } from "@ai-search-portal/contracts";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { eventStream } from "remix-utils/sse/server";

import {
  getTraceIdFromRequest,
  pipeAgentHttpToStableSse,
  pipeLocalAgentCoreToStableSse,
  resolveAgentRuntimeUrl,
} from "~/services/chat-gateway.server";
import { parsePackIdFromRequest } from "~/services/context-pack.server";

/** Lightweight in-memory abuse guard for the public showcase API (not a WAF). */
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 40;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("cf-connecting-ip") ||
    "anonymous"
  );
}

function allowRequest(request: Request): boolean {
  const key = clientKey(request);
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_MAX) return false;
  bucket.count += 1;
  return true;
}

const STABLE_FAILURE = {
  message: "Chat temporarily unavailable. Please try again.",
  code: "chat_gateway_error",
} as const;

export function loader({ request }: LoaderFunctionArgs) {
  if (!allowRequest(request)) {
    return new Response(
      JSON.stringify({
        message: "Too many requests. Please slow down.",
        code: "rate_limited",
      }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const url = new URL(request.url);
  const parsed = chatQueryParamsSchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    sessionId: url.searchParams.get("sessionId") ?? undefined,
  });

  if (!parsed.success) {
    return new Response("Missing or invalid query", { status: 400 });
  }

  const traceId = getTraceIdFromRequest(request);
  const agentBaseUrl = resolveAgentRuntimeUrl();
  const packId = parsePackIdFromRequest(request);

  return eventStream(request.signal, (send, close) => {
    void (async () => {
      try {
        const stableSend = (args: { event: string; data: string }) => {
          send({ event: args.event, data: args.data });
        };

        if (agentBaseUrl) {
          await pipeAgentHttpToStableSse({
            agentBaseUrl,
            query: parsed.data.q,
            sessionId: parsed.data.sessionId,
            traceId,
            traceparent: request.headers.get("traceparent") ?? undefined,
            signal: request.signal,
            send: stableSend,
          });
        } else {
          await pipeLocalAgentCoreToStableSse({
            query: parsed.data.q,
            sessionId: parsed.data.sessionId,
            traceId,
            packId,
            send: stableSend,
          });
        }
      } catch {
        send({
          event: "failure",
          data: JSON.stringify(STABLE_FAILURE),
        });
      } finally {
        close();
      }
    })();

    return () => {};
  });
}
