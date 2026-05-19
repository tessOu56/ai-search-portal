import type { SseEventPart } from "@ai-search-portal/agent-core";

export type GoldenCase = {
  id: string;
  query: string;
  expectedKeywords: string[];
  minEventCount: number;
  expectRag?: boolean;
};

export type EvalResult = {
  id: string;
  pass: boolean;
  reasons: string[];
  eventCount: number;
};

export function scoreCase(
  testCase: GoldenCase,
  events: SseEventPart[],
  finalAnswer: string
): EvalResult {
  const reasons: string[] = [];
  const eventNames = events.map((e) => e.event);
  const blob =
    `${finalAnswer} ${events.map((e) => e.data).join(" ")}`.toLowerCase();

  if (events.length < testCase.minEventCount) {
    reasons.push(`event count ${events.length} < ${testCase.minEventCount}`);
  }

  for (const kw of testCase.expectedKeywords) {
    if (!blob.includes(kw.toLowerCase())) {
      reasons.push(`missing keyword: ${kw}`);
    }
  }

  if (testCase.expectRag && !eventNames.includes("internal.rag_step")) {
    reasons.push("expected internal.rag_step");
  }

  if (!eventNames.includes("internal.done")) {
    reasons.push("missing internal.done");
  }

  return {
    id: testCase.id,
    pass: reasons.length === 0,
    reasons,
    eventCount: events.length,
  };
}
