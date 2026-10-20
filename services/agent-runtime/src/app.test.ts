import { afterEach, describe, expect, it } from "vitest";

import { app } from "./app.js";

const STREAM_HELLO = "http://localhost/v1/chat/stream?q=hello";

describe("agent-runtime /v1/chat/stream", () => {
  afterEach(() => {
    delete process.env.AGENT_RUNTIME_TOKEN;
    delete process.env.NODE_ENV;
  });

  it("returns 400 when q is missing", async () => {
    const res = await app.request("http://localhost/v1/chat/stream");
    expect(res.status).toBe(400);
  });

  it("returns SSE when q is valid", async () => {
    const res = await app.request(STREAM_HELLO);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("internal.meta");
    expect(text).toContain("internal.chunk");
  });

  it("requires AGENT_RUNTIME_TOKEN when configured", async () => {
    process.env.AGENT_RUNTIME_TOKEN = "runtime-secret";
    const anon = await app.request(STREAM_HELLO);
    expect(anon.status).toBe(401);
    const ok = await app.request(STREAM_HELLO, {
      headers: { Authorization: "Bearer runtime-secret" },
    });
    expect(ok.status).toBe(200);
  });
});
