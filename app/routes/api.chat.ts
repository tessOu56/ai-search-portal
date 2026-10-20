import { chatQueryParamsSchema } from "@ai-search-portal/contracts";
import type { LoaderFunctionArgs } from "react-router";
import { eventStream } from "remix-utils/sse/server";

import {
  getTraceIdFromRequest,
  pipeAgentHttpToStableSse,
  pipeLocalAgentCoreToStableSse,
  resolveAgentRuntimeUrl,
} from "~/services/chat-gateway.server";
import { parsePackIdFromRequest } from "~/services/context-pack.server";
import {
  rejectIfRateLimited,
  requirePrincipal,
} from "~/services/route-guard.server";

const STABLE_FAILURE = {
  message: "Chat temporarily unavailable. Please try again.",
  code: "chat_gateway_error",
} as const;

export function loader({ request }: LoaderFunctionArgs) {
  const limited = rejectIfRateLimited(request, "chat");
  if (limited) return limited;

  const auth = requirePrincipal(request);
  if ("response" in auth) return auth.response;

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
