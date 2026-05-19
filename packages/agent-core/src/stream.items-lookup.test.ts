import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { streamChatInternalEvents } from "./stream.js";

describe("streamChatInternalEvents items.lookup", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    process.env.AGENT_EXECUTE_TOOLS = "1";
    const iso = "2026-01-01T00:00:00.000Z";
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [
                {
                  id: "1",
                  name: "Mock item alpha",
                  description: "test item",
                  createdAt: iso,
                  updatedAt: iso,
                },
              ],
            }),
        } as Response)
      )
    );
  });

  afterEach(() => {
    process.env = { ...envBackup };
    vi.unstubAllGlobals();
  });

  it("emits items.lookup tool_status when execution enabled", async () => {
    const events: string[] = [];
    for await (const part of streamChatInternalEvents({
      query: "mock alpha",
      executeItemsLookup: true,
      emitMockToolStatus: false,
      includeRagSteps: false,
    })) {
      events.push(part.event);
    }
    expect(events).toContain("internal.tool_status");
    const toolEvents = events.filter((e) => e === "internal.tool_status");
    expect(toolEvents.length).toBeGreaterThanOrEqual(2);
  });
});
