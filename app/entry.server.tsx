import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";
import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";

import { readServerSentryDsn } from "~/lib/monitoring/env";

const ABORT_DELAY_MS = 5_000;

async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext
): Promise<Response> {
  let shellRendered = false;
  let status = responseStatusCode;
  const userAgent = request.headers.get("user-agent");

  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      signal: AbortSignal.timeout(ABORT_DELAY_MS),
      onError(error: unknown) {
        status = 500;
        if (shellRendered) {
          console.error(error);
        }
      },
    }
  );
  shellRendered = true;

  if ((userAgent && isbot(userAgent)) || routerContext.isSpaMode) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, {
    headers: responseHeaders,
    status,
  });
}

type HandleRequest = typeof handleRequest;

let sentryWrapped: HandleRequest | undefined;

async function resolveHandler(): Promise<HandleRequest> {
  if (sentryWrapped) return sentryWrapped;
  const { initSentryServer } = await import("~/lib/monitoring/sentry.server");
  const Sentry = initSentryServer();
  sentryWrapped = Sentry
    ? (Sentry.wrapSentryHandleRequest(handleRequest) as HandleRequest)
    : handleRequest;
  return sentryWrapped;
}

export default async function defaultHandler(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext: AppLoadContext
) {
  if (!readServerSentryDsn()) {
    return handleRequest(
      request,
      responseStatusCode,
      responseHeaders,
      routerContext,
      loadContext
    );
  }
  const handler = await resolveHandler();
  return handler(
    request,
    responseStatusCode,
    responseHeaders,
    routerContext,
    loadContext
  );
}
