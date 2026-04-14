import { describe, expect, it } from "vitest";

import { app } from "./app.js";

describe("agent-runtime /v1/chat/stream", () => {
  it("returns 400 when q is missing", async () => {
    const res = await app.request("http://localhost/v1/chat/stream");
    expect(res.status).toBe(400);
  });

  it("returns SSE when q is valid", async () => {
    const res = await app.request("http://localhost/v1/chat/stream?q=hello");
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("internal.meta");
    expect(text).toContain("internal.chunk");
  });
});
