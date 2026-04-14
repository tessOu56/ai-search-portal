import { describe, expect, it } from "vitest";

import { readSseMessages } from "./sse-parse.server";

function streamFromString(text: string): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    },
  });
}

describe("readSseMessages", () => {
  it("parses simple SSE block", async () => {
    const body = streamFromString('event: internal.meta\ndata: {"x":1}\n\n');
    const ac = new AbortController();
    const msgs = [];
    for await (const m of readSseMessages(body, ac.signal)) {
      msgs.push(m);
    }
    expect(msgs).toHaveLength(1);
    expect(msgs[0]).toEqual({
      event: "internal.meta",
      data: '{"x":1}',
    });
  });
});
