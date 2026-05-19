import { describe, expect, it } from "vitest";

import { runRagPipelineEvents } from "./pipeline.js";

describe("runRagPipelineEvents local mode", () => {
  it("retrieves matching docs when AGENT_RAG_MODE=local", async () => {
    const prev = process.env.AGENT_RAG_MODE;
    process.env.AGENT_RAG_MODE = "local";
    const details: string[] = [];
    for await (const ev of runRagPipelineEvents("authentication OAuth")) {
      if (ev.event === "internal.rag_step") {
        const p = JSON.parse(ev.data) as { detail?: string };
        details.push(p.detail ?? "");
      }
    }
    process.env.AGENT_RAG_MODE = prev;
    expect(details.some((d) => d.includes("auth-1"))).toBe(true);
  });
});
