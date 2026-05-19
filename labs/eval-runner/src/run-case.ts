import { streamChatInternalEvents } from "@ai-search-portal/agent-core";

import type { GoldenCase } from "./score.js";
import { scoreCase } from "./score.js";

export async function runGoldenCase(testCase: GoldenCase) {
  const events = [];
  const textParts: string[] = [];
  const prevRagMode = process.env.AGENT_RAG_MODE;
  if (testCase.expectRag) {
    process.env.AGENT_RAG_MODE = "local";
  }

  try {
    for await (const part of streamChatInternalEvents({
      query: testCase.query,
      traceId: `eval-${testCase.id}`,
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
  }
}
