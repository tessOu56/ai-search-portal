import type { InternalRagStepPayload } from "@ai-search-portal/contracts";

/**
 * RAG 內部事件鏈（stub）：產生 internal.rag_step，不寫業務資料。
 */
export async function* runRagPipelineEvents(
  query: string
): AsyncGenerator<{ event: "internal.rag_step"; data: string }> {
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
