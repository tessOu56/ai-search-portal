import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { SseEventPart } from "@ai-search-portal/agent-core";
import { describe, expect, it } from "vitest";

import type { GoldenCase } from "./score.js";
import { scoreCase } from "./score.js";

const fixturePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
  "regression-no-sources.json"
);

const FINAL_ANSWER = "銀戒";

type RegressionFixture = {
  description: string;
  case: GoldenCase;
  syntheticEventsNoContext: SseEventPart[];
  syntheticEventsEmptySources: SseEventPart[];
};

async function loadFixture(): Promise<RegressionFixture> {
  const raw = await readFile(fixturePath, "utf8");
  return JSON.parse(raw) as RegressionFixture;
}

describe("T-2026-069 no-sources regression guard", () => {
  it("fails a RAG case when retrieval finds no context (compose: no context)", async () => {
    const fixture = await loadFixture();
    const result = scoreCase(
      fixture.case,
      fixture.syntheticEventsNoContext,
      FINAL_ANSWER
    );
    expect(result.pass).toBe(false);
    expect(result.reasons.some((r) => r.includes("no hits"))).toBe(true);
  });

  it("fails any case when internal.final returns an empty sources[]", async () => {
    const fixture = await loadFixture();
    const result = scoreCase(
      fixture.case,
      fixture.syntheticEventsEmptySources,
      FINAL_ANSWER
    );
    expect(result.pass).toBe(false);
    expect(result.reasons.some((r) => r.includes("no sources returned"))).toBe(
      true
    );
  });

  it("still passes a well-formed grounded response (sanity baseline)", async () => {
    const fixture = await loadFixture();
    const RAG_STEP = "internal.rag_step";
    const groundedEvents: SseEventPart[] = [
      { event: "internal.meta", data: "{}" },
      {
        event: RAG_STEP,
        data: JSON.stringify({
          step: "retrieve",
          detail: "local retrieve: ring-1",
        }),
      },
      {
        event: RAG_STEP,
        data: JSON.stringify({ step: "rerank", detail: "rerank top 1" }),
      },
      {
        event: RAG_STEP,
        data: JSON.stringify({ step: "compose", detail: "銀戒鍛造入門體驗" }),
      },
      { event: "internal.chunk", data: JSON.stringify({ text: "銀戒" }) },
      {
        event: "internal.final",
        data: JSON.stringify({
          sources: [
            { title: "銀戒鍛造入門體驗", url: "https://example.local/ring" },
          ],
          nextSteps: [],
        }),
      },
      { event: "internal.done", data: "{}" },
    ];
    const result = scoreCase(fixture.case, groundedEvents, FINAL_ANSWER);
    expect(result.pass, result.reasons.join("; ")).toBe(true);
  });
});
