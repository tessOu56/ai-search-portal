import { renderToString } from "react-dom/server";
import type { EntryContext } from "react-router";
import { ServerRouter } from "react-router";
export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext
) {
  const markup = renderToString(
    <ServerRouter context={routerContext} url={request.url} />
  );

  responseHeaders.set("Content-Type", "text/html");

  return new Response(`<!DOCTYPE html>${markup}`, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}
