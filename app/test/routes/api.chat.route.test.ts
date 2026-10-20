import type { LoaderFunctionArgs } from "react-router";
import { describe, expect, it } from "vitest";

import { loader } from "~/routes/api.chat";
import { authHeaders, TEST_REQUESTER_TOKEN } from "~/test/auth-fixtures";

function call(url: string, headers?: HeadersInit) {
  return loader({
    request: new Request(url, { headers }),
    params: {},
    context: {},
  } as LoaderFunctionArgs);
}

describe("api.chat loader — query contract", () => {
  it("returns 401 when unauthenticated", () => {
    const response = call("http://localhost/api/chat?q=orders");
    expect(response.status).toBe(401);
  });

  it("returns 400 when q is missing", () => {
    const response = call(
      "http://localhost/api/chat",
      authHeaders(TEST_REQUESTER_TOKEN)
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 when q is blank", () => {
    const response = call(
      "http://localhost/api/chat?q=%20%20",
      authHeaders(TEST_REQUESTER_TOKEN)
    );
    expect(response.status).toBe(400);
  });

  it("accepts valid q and returns an SSE response", () => {
    const response = call(
      "http://localhost/api/chat?q=orders",
      authHeaders(TEST_REQUESTER_TOKEN)
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");
  });
});
