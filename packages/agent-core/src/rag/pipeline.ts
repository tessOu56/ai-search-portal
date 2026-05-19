import type { InternalRagStepPayload } from "@ai-search-portal/contracts";

import { retrieveLocal } from "./local-store.js";

const isLocalRagEnabled = (): boolean =>
  process.env.AGENT_RAG_MODE === "local" || process.env.AGENT_RAG_MODE === "1";

/**
 * RAG 內部事件鏈：stub 或 local in-memory retrieve（`AGENT_RAG_MODE=local`）。
 */
export async function* runRagPipelineEvents(
  query: string
): AsyncGenerator<{ event: "internal.rag_step"; data: string }> {
  if (isLocalRagEnabled()) {
    const hits = retrieveLocal(query);
    const retrieveDetail =
      hits.length > 0
        ? `local retrieve: ${hits.map((h) => h.id).join(", ")}`
        : `local retrieve: no hits for "${query.slice(0, 32)}"`;
    const steps: InternalRagStepPayload[] = [
      { step: "retrieve", detail: retrieveDetail },
      { step: "rerank", detail: `rerank top ${Math.min(hits.length, 3)}` },
      {
        step: "compose",
        detail: hits[0]?.text.slice(0, 80) ?? "no context",
      },
    ];
    for (const step of steps) {
      yield { event: "internal.rag_step", data: JSON.stringify(step) };
      await Promise.resolve();
    }
    return;
  }

  const steps: InternalRagStepPayload[] = [
    { step: "retrieve", detail: `mock retrieve: ${query.slice(0, 32)}` },
    { step: "rerank", detail: "mock rerank" },
    { step: "compose", detail: "mock compose" },
  ];
  for (const step of steps) {
    yield {
      event: "internal.rag_step",
      data: JSON.stringify(step),
    };
    await Promise.resolve();
  }
}
