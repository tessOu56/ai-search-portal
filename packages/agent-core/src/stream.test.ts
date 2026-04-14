import { describe, expect, it } from "vitest";

import { streamChatInternalEvents } from "./stream.js";

describe("streamChatInternalEvents", () => {
  it("emits internal pipeline in order ending with done", async () => {
    const events: string[] = [];
    for await (const part of streamChatInternalEvents({
      query: "test query",
      traceId: "trace-1",
      emitMockToolStatus: true,
      includeRagSteps: true,
    })) {
      events.push(part.event);
    }
    expect(events[0]).toBe("internal.meta");
    expect(events).toContain("internal.tool_status");
    expect(events).toContain("internal.rag_step");
    expect(events.at(-2)).toBe("internal.final");
    expect(events.at(-1)).toBe("internal.done");
  });
});
