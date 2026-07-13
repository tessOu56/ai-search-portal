import { describe, expect, it } from "vitest";

import { topologicalSort } from "./kahn";

describe("topologicalSort", () => {
  it("sorts an acyclic DAG in dependency order", () => {
    const result = topologicalSort(
      ["raw", "model", "dashboard"],
      [
        { source: "raw", target: "model" },
        { source: "model", target: "dashboard" },
      ]
    );

    expect(result).toEqual({
      status: "sorted",
      order: ["raw", "model", "dashboard"],
    });
  });

  it("detects and rejects a cycle", () => {
    const result = topologicalSort(
      ["a", "b", "c"],
      [
        { source: "a", target: "b" },
        { source: "b", target: "c" },
        { source: "c", target: "a" },
      ]
    );

    expect(result.status).toBe("cycle");
    if (result.status === "cycle") {
      expect(result.cyclicNodeIds).toEqual(["a", "b", "c"]);
      expect(result.remainingEdges).toEqual([
        { source: "a", target: "b" },
        { source: "b", target: "c" },
        { source: "c", target: "a" },
      ]);
    }
  });
});
