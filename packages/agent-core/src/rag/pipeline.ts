import type { InternalRagStepPayload } from "@ai-search-portal/contracts";
import { toolRagSearchOutputSchema } from "@ai-search-portal/contracts";

import {
  type LocalDoc,
  retrieveLocal,
  type RetrieveLocalOptions,
} from "./local-store.js";

const isLocalRagEnabled = (): boolean =>
  process.env.AGENT_RAG_MODE === "local" || process.env.AGENT_RAG_MODE === "1";

export type RagPipelineResult = {
  hits: LocalDoc[];
  packId?: string;
  output: ReturnType<typeof toolRagSearchOutputSchema.parse>;
};

export function runLocalRag(
  query: string,
  options: RetrieveLocalOptions = {}
): RagPipelineResult {
  const hits = isLocalRagEnabled() ? retrieveLocal(query, options) : [];
  const packId =
    options.packId ??
    process.env.AGENT_RAG_PACK ??
    process.env.CONTEXT_PACK ??
    undefined;

  const output = toolRagSearchOutputSchema.parse({
    hits: hits.map((h) => ({
      id: h.id,
      kind: h.kind ?? "doc",
      title: h.title ?? h.id,
      text: h.text,
      refs: h.refs ?? [],
    })),
    total: hits.length,
    packId,
  });

  return { hits, packId, output };
}

/**
 * RAG 內部事件鏈：stub 或 local in-memory retrieve（`AGENT_RAG_MODE=local`）。
 * Pack-aware via AGENT_RAG_PACK / CONTEXT_PACK / options.packId.
 */
export async function* runRagPipelineEvents(
  query: string,
  options: RetrieveLocalOptions = {}
): AsyncGenerator<{ event: "internal.rag_step"; data: string }> {
  if (isLocalRagEnabled()) {
    const { hits } = runLocalRag(query, options);
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
