import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  beginChatTrace,
  isLangfuseEnabled,
  resetLangfuseClientForTests,
} from "./langfuse.js";

const flushAsync = vi.fn().mockResolvedValue(undefined);
const traceUpdate = vi.fn();
const traceGeneration = vi.fn();
const traceSpan = vi.fn(() => ({
  id: "span-1",
  span: vi.fn(() => ({ id: "span-nested" })),
}));

vi.mock("langfuse", () => ({
  Langfuse: vi.fn(() => ({
    trace: vi.fn(() => ({
      id: "trace-1",
      span: traceSpan,
      generation: traceGeneration,
      update: traceUpdate,
    })),
    flushAsync,
  })),
}));

describe("langfuse observability", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    resetLangfuseClientForTests();
    vi.clearAllMocks();
    process.env.LANGFUSE_HOST = "http://localhost:3001";
    process.env.LANGFUSE_PUBLIC_KEY = "pk-test";
    process.env.LANGFUSE_SECRET_KEY = "sk-test";
  });

  afterEach(() => {
    process.env = { ...envBackup };
    resetLangfuseClientForTests();
  });

  it("isLangfuseEnabled is false when keys are missing", () => {
    delete process.env.LANGFUSE_SECRET_KEY;
    expect(isLangfuseEnabled()).toBe(false);
  });

  it("beginChatTrace returns null when disabled", () => {
    delete process.env.LANGFUSE_HOST;
    expect(beginChatTrace({ query: "hi" })).toBeNull();
  });

  it("records RAG steps and completes with generation + flush", () => {
    const session = beginChatTrace({ traceId: "t-1", query: "orders api" });
    expect(session?.traceId).toBe("t-1");

    session?.recordRagStep({ step: "retrieve", detail: "mock retrieve" });
    session?.complete({
      summary: "ok",
      confidence: 0.8,
      sourceCount: 2,
      answerPreview: "answer snippet",
    });

    expect(traceSpan).toHaveBeenCalled();
    expect(traceGeneration).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "lui-mock",
        model: "mock-lui-v1",
      })
    );
    expect(traceUpdate).toHaveBeenCalled();
    expect(flushAsync).toHaveBeenCalled();
  });

  it("marks trace as error on guardrail fail", () => {
    const session = beginChatTrace({ traceId: "t-2", query: "x" });
    session?.fail({ code: "QUERY_TOO_LONG", message: "too long" });

    expect(traceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { status: "guardrail_blocked", severity: "error" },
      })
    );
    expect(flushAsync).toHaveBeenCalled();
  });
});
