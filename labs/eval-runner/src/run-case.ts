import { streamChatInternalEvents } from "@ai-search-portal/agent-core";

import type { GoldenCase } from "./score.js";
import { scoreCase } from "./score.js";

export async function runGoldenCase(testCase: GoldenCase) {
  const events = [];
  const textParts: string[] = [];

  for await (const part of streamChatInternalEvents({
    query: testCase.query,
    traceId: `eval-${testCase.id}`,
    emitMockToolStatus: true,
    includeRagSteps: testCase.expectRag ?? true,
  })) {
    events.push(part);
    textParts.push(part.data);
  }

  return scoreCase(testCase, events, textParts.join(" "));
}
