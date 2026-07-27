import { describe, expect, it } from "vitest";

import { loader } from "~/routes/api.chat";

describe("api.chat loader — query contract", () => {
  it("returns 400 when q is missing", () => {
    const response = loader({
      request: new Request("http://localhost/api/chat"),
      params: {},
      context: {},
    });
    expect(response.status).toBe(400);
  });

  it("returns 400 when q is blank", () => {
    const response = loader({
      request: new Request("http://localhost/api/chat?q=%20%20"),
      params: {},
      context: {},
    });
    expect(response.status).toBe(400);
  });

  it("accepts valid q and returns an SSE response", () => {
    const response = loader({
      request: new Request("http://localhost/api/chat?q=orders"),
      params: {},
      context: {},
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");
  });
});
