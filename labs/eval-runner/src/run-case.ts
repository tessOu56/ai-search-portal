import { streamChatInternalEvents } from "@ai-search-portal/agent-core";

import type { GoldenCase } from "./score.js";
import { scoreCase } from "./score.js";

export async function runGoldenCase(testCase: GoldenCase) {
  const events = [];
  const textParts: string[] = [];
  const prevRagMode = process.env.AGENT_RAG_MODE;
  const prevPack = process.env.AGENT_RAG_PACK;
  if (testCase.expectRag) {
    process.env.AGENT_RAG_MODE = "local";
  }
  const metalcraftCase = testCase.id.startsWith("metalcraft-");
  if (metalcraftCase) {
    process.env.AGENT_RAG_PACK = "metalcraft-studio";
  }

  try {
    for await (const part of streamChatInternalEvents({
      query: testCase.query,
      traceId: `eval-${testCase.id}`,
      packId: metalcraftCase ? "metalcraft-studio" : undefined,
      emitMockToolStatus: true,
      includeRagSteps: testCase.expectRag ?? true,
      executeItemsLookup: false,
    })) {
      events.push(part);
      textParts.push(part.data);
    }

    return scoreCase(testCase, events, textParts.join(" "));
  } finally {
    if (testCase.expectRag) {
      if (prevRagMode === undefined) {
        delete process.env.AGENT_RAG_MODE;
      } else {
        process.env.AGENT_RAG_MODE = prevRagMode;
      }
    }
    if (metalcraftCase) {
      if (prevPack === undefined) {
        delete process.env.AGENT_RAG_PACK;
      } else {
        process.env.AGENT_RAG_PACK = prevPack;
      }
    }
  }
}
