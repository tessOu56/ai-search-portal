import type { LoaderFunctionArgs } from "@remix-run/node";
import { eventStream } from "remix-utils/sse/server";

import { buildLuiResponse, splitToTokens } from "~/services/lui.server";

export function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim();

  if (!query) {
    return new Response("Missing query", { status: 400 });
  }

  const response = buildLuiResponse(query);
  const tokens = splitToTokens(response.answer);

  return eventStream(request.signal, (send) => {
    send({
      event: "meta",
      data: JSON.stringify({
        query,
        summary: response.summary,
        confidence: response.confidence,
      }),
    });

    let index = 0;
    const interval = setInterval(() => {
      const token = tokens.at(index);
      if (!token) {
        send({
          event: "final",
          data: JSON.stringify({
            sources: response.sources,
            nextSteps: response.nextSteps,
          }),
        });
        send({ event: "done", data: "done" });
        clearInterval(interval);
        return;
      }

      send({
        event: "token",
        data: token,
      });
      index += 1;
    }, 120);

    return () => {
      clearInterval(interval);
    };
  });
}
