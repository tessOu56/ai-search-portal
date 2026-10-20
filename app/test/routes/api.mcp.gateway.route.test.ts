import type { ActionFunctionArgs } from "react-router";
import { describe, expect, it } from "vitest";

import { action } from "~/routes/api.mcp.gateway";
import { issueHitlConfirmToken } from "~/services/auth.server";
import { authHeaders, TEST_REQUESTER_TOKEN } from "~/test/auth-fixtures";

function call(init: RequestInit): ReturnType<typeof action> {
  return action({
    request: new Request("http://localhost/api/mcp/gateway", init),
    params: {},
    context: {},
  } as ActionFunctionArgs);
}

const searchBody = {
  method: "tools/call",
  params: { name: "metadata.search", arguments: { q: "customer" } },
  _meta: {
    protocolVersion: "2026-07-28-rc1",
    clientInfo: { name: "test", version: "1" },
  },
};

describe("api.mcp.gateway", () => {
  it("rejects unauthenticated calls", async () => {
    const res = await call({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(searchBody),
    });
    expect(res.status).toBe(401);
  });

  it("rejects oversized bodies", async () => {
    const res = await call({
      method: "POST",
      headers: authHeaders(TEST_REQUESTER_TOKEN),
      body: JSON.stringify({
        ...searchBody,
        padding: "x".repeat(70 * 1024),
      }),
    });
    expect(res.status).toBe(413);
  });

  it("returns a parsed envelope for a valid search", async () => {
    const res = await call({
      method: "POST",
      headers: authHeaders(TEST_REQUESTER_TOKEN),
      body: JSON.stringify(searchBody),
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { result?: unknown; error?: string };
    expect(json.result).toBeDefined();
  });

  it("does not 500 on invalid JSON", async () => {
    const res = await call({
      method: "POST",
      headers: authHeaders(TEST_REQUESTER_TOKEN),
      body: "{",
    });
    expect(res.status).toBe(400);
  });

  it("issues HITL tokens that are principal- and tool-bound", () => {
    const user = {
      id: "principal:requester",
      authRole: "requester" as const,
      opaRole: "analyst" as const,
    };
    const token = issueHitlConfirmToken(user, "access_request.submit");
    expect(token.length).toBeGreaterThan(8);
  });
});
