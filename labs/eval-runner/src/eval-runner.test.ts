import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { runGoldenCase } from "./run-case.js";
import type { GoldenCase } from "./score.js";

const fixturePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
  "golden.jsonl"
);

async function loadCases(): Promise<GoldenCase[]> {
  const raw = await readFile(fixturePath, "utf8");
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as GoldenCase);
}

describe("offline eval golden set", () => {
  it("passes all fixture cases", async () => {
    const cases = await loadCases();
    expect(cases.length).toBeGreaterThan(0);
    for (const c of cases) {
      const result = await runGoldenCase(c);
      expect(result.pass, result.reasons.join("; ")).toBe(true);
    }
  });
});
