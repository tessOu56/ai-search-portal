import { afterEach, describe, expect, it } from "vitest";

import {
  getTraceIdFromRequest,
  pipeLocalAgentCoreToStableSse,
  resolveAgentRuntimeUrl,
} from "./chat-gateway.server";

describe("getTraceIdFromRequest", () => {
  it("prefers the W3C traceparent span id", () => {
    const request = new Request("http://localhost/api/chat?q=hi", {
      headers: {
        traceparent: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
        "x-trace-id": "ignored",
      },
    });
    expect(getTraceIdFromRequest(request)).toBe(
      "4bf92f3577b34da6a3ce929d0e0e4736"
    );
  });

  it("falls back to x-trace-id", () => {
    const request = new Request("http://localhost/api/chat?q=hi", {
      headers: { "x-trace-id": "trace-from-header" },
    });
    expect(getTraceIdFromRequest(request)).toBe("trace-from-header");
  });
});

describe("resolveAgentRuntimeUrl", () => {
  const previous = process.env.AGENT_RUNTIME_URL;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.AGENT_RUNTIME_URL;
    } else {
      process.env.AGENT_RUNTIME_URL = previous;
    }
  });

  it("returns undefined when unset and strips a trailing slash when set", () => {
    delete process.env.AGENT_RUNTIME_URL;
    expect(resolveAgentRuntimeUrl()).toBeUndefined();

    process.env.AGENT_RUNTIME_URL = "http://127.0.0.1:3002/";
    expect(resolveAgentRuntimeUrl()).toBe("http://127.0.0.1:3002");
  });
});

describe("pipeLocalAgentCoreToStableSse", () => {
  it("maps the offline fixture into stable meta/token/final/done events", async () => {
    const events: Array<{ event: string; data: string }> = [];
    await pipeLocalAgentCoreToStableSse({
      query: "Which datasets contain PII and what access do I need?",
      send: (part) => events.push(part),
    });

    const names = events.map((part) => part.event);
    expect(names).toContain("meta");
    expect(names).toContain("token");
    expect(names).toContain("final");
    expect(names.at(-1)).toBe("done");

    const meta = JSON.parse(
      events.find((part) => part.event === "meta")?.data ?? "{}"
    ) as { agentMode?: string; summary?: string };
    expect(meta.agentMode).toBe("offline_fixture");
    expect(meta.summary?.length).toBeGreaterThan(0);

    const fin = JSON.parse(
      events.find((part) => part.event === "final")?.data ?? "{}"
    ) as {
      nextActions?: Array<{ href: string }>;
    };
    expect(
      fin.nextActions?.some((action) =>
        action.href.includes("/metadata/tbl-customers")
      )
    ).toBe(true);
  });
});
