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

/**
 * T-2026-069: the "no sources" regression guard.
 *
 * A grounded answer must cite at least one source, and a `expectRag` case must
 * actually retrieve context (not silently fall through to zero hits). Without
 * this check, a bug that returns `sources: []` from `internal.final`, or a RAG
 * pipeline that stops retrieving anything, would still pass the golden set as
 * long as keyword/event-count checks happened to match.
 */
function checkSources(
  testCase: GoldenCase,
  events: SseEventPart[],
  reasons: string[]
): void {
  const finalEvent = [...events]
    .reverse()
    .find((e) => e.event === "internal.final");

  if (!finalEvent) {
    reasons.push("missing internal.final (cannot verify sources)");
    return;
  }

  let sources: unknown;
  try {
    const parsed = JSON.parse(finalEvent.data) as { sources?: unknown };
    sources = parsed.sources;
  } catch {
    reasons.push("internal.final payload is not valid JSON");
    return;
  }

  if (!Array.isArray(sources) || sources.length === 0) {
    reasons.push("no sources returned in internal.final (empty sources[])");
  }

  if (testCase.expectRag) {
    const noContext = events.some((e) => {
      if (e.event !== "internal.rag_step") return false;
      try {
        const step = JSON.parse(e.data) as { step?: string; detail?: string };
        return step.step === "compose" && step.detail === "no context";
      } catch {
        return false;
      }
    });
    if (noContext) {
      reasons.push("RAG retrieval returned no hits (compose step: no context)");
    }
  }
}

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

  checkSources(testCase, events, reasons);

  return {
    id: testCase.id,
    pass: reasons.length === 0,
    reasons,
    eventCount: events.length,
  };
}
