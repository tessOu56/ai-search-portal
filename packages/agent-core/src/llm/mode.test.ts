import { afterEach, describe, expect, it } from "vitest";

import { buildLuiResponse } from "../lui-mock.js";
import { runLocalRag } from "../rag/pipeline.js";
import { readAgentLlmMode, shouldUseLiveLlm } from "./mode.js";

describe("readAgentLlmMode", () => {
  const prev = process.env.AGENT_LLM_MODE;

  afterEach(() => {
    if (prev === undefined) delete process.env.AGENT_LLM_MODE;
    else process.env.AGENT_LLM_MODE = prev;
  });

  it("defaults to mock", () => {
    delete process.env.AGENT_LLM_MODE;
    expect(readAgentLlmMode()).toBe("mock");
    expect(shouldUseLiveLlm()).toBe(false);
  });

  it("accepts gateway", () => {
    process.env.AGENT_LLM_MODE = "gateway";
    expect(readAgentLlmMode()).toBe("gateway");
    expect(shouldUseLiveLlm()).toBe(true);
  });
});

describe("offline fixture path", () => {
  it("builds fixture without live key", () => {
    const rag = runLocalRag("customers table", {});
    const fixture = buildLuiResponse("customers table", { ragHits: rag.hits });
    expect(fixture.answer.length).toBeGreaterThan(0);
  });
});
