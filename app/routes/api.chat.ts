import { chatQueryParamsSchema } from "@ai-search-portal/contracts";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { eventStream } from "remix-utils/sse/server";

import {
  getTraceIdFromRequest,
  pipeAgentHttpToStableSse,
  pipeLocalAgentCoreToStableSse,
  resolveAgentRuntimeUrl,
} from "~/services/chat-gateway.server";

export function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const parsed = chatQueryParamsSchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    sessionId: url.searchParams.get("sessionId") ?? undefined,
  });

  if (!parsed.success) {
    return new Response("Missing query", { status: 400 });
  }

  const traceId = getTraceIdFromRequest(request);
  const agentBaseUrl = resolveAgentRuntimeUrl();

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
            send: stableSend,
          });
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown chat error";
        send({
          event: "failure",
          data: JSON.stringify({ message, code: "chat_gateway_error" }),
        });
      } finally {
        close();
      }
    })();

    return () => {};
  });
}
