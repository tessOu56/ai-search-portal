/**
 * Chat 契約單元測試 — mapInternalSseToStable 與穩定層 schema。
 */

import {
  mapInternalSseToStable,
  stableChatMetaSchema,
} from "@ai-search-portal/contracts";
import { describe, expect, it } from "vitest";

function expectMapped(
  result: ReturnType<typeof mapInternalSseToStable>
): asserts result is {
  kind: "mapped";
  stableEvent: string;
  stableData: string;
} {
  expect(result.kind).toBe("mapped");
}

describe("stableChatMetaSchema", () => {
  it("accepts meta with optional traceId", () => {
    const parsed = stableChatMetaSchema.parse({
      query: "hi",
      summary: "s",
      confidence: 0.5,
      traceId: "abc",
    });
    expect(parsed.traceId).toBe("abc");
  });
});

describe("mapInternalSseToStable", () => {
  it("maps internal.meta to meta JSON", () => {
    const data = JSON.stringify({
      query: "q",
      summary: "s",
      confidence: 0.2,
    });
    const mapped = mapInternalSseToStable({
      eventName: "internal.meta",
      data,
    });
    expectMapped(mapped);
    expect(mapped.stableEvent).toBe("meta");
    expect(JSON.parse(mapped.stableData)).toMatchObject({
      query: "q",
      summary: "s",
      confidence: 0.2,
    });
  });

  it("maps internal.chunk to token text", () => {
    const mapped = mapInternalSseToStable({
      eventName: "internal.chunk",
      data: JSON.stringify({ text: "hello" }),
    });
    expectMapped(mapped);
    expect(mapped.stableEvent).toBe("token");
    expect(mapped.stableData).toBe("hello");
  });

  it("maps internal.error to failure", () => {
    const mapped = mapInternalSseToStable({
      eventName: "internal.error",
      data: JSON.stringify({ message: "x", code: "y" }),
    });
    expectMapped(mapped);
    expect(mapped.stableEvent).toBe("failure");
  });

  it("skips internal.rag_step", () => {
    const mapped = mapInternalSseToStable({
      eventName: "internal.rag_step",
      data: JSON.stringify({ step: "retrieve", detail: "d" }),
    });
    expect(mapped.kind).toBe("skip_internal_only");
  });
});
