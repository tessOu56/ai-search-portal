import { PassThrough } from "node:stream";

import { createReadableStreamFromReadable } from "@react-router/node";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";

import { initSentryServer } from "~/lib/monitoring/sentry.server";

const ABORT_DELAY_MS = 5_000;
const Sentry = initSentryServer();

function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext
) {
  const waitForAll = isbot(request.headers.get("user-agent") ?? "");
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let status = responseStatusCode;

    const onReady = () => {
      shellRendered = true;
      const body = new PassThrough();
      const stream = createReadableStreamFromReadable(body);
      responseHeaders.set("Content-Type", "text/html");
      resolve(
        new Response(stream, {
          headers: responseHeaders,
          status,
        })
      );
      pipe(body);
    };

    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        onAllReady: waitForAll ? onReady : undefined,
        onShellReady: waitForAll ? undefined : onReady,
        onShellError(error: unknown) {
          reject(error instanceof Error ? error : new Error(String(error)));
        },
        onError(error: unknown) {
          status = 500;
          if (shellRendered) {
            console.error(error);
          }
        },
      }
    );
    setTimeout(abort, ABORT_DELAY_MS);
  });
}

export default Sentry
  ? Sentry.wrapSentryHandleRequest(handleRequest)
  : handleRequest;
