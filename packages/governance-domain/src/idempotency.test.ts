import { describe, expect, it } from "vitest";

import { createIdempotencyIndex } from "./idempotency.js";

describe("createIdempotencyIndex", () => {
  it("remembers and resolves keys, then clears", () => {
    const index = createIdempotencyIndex();
    expect(index.resolve("k1")).toBeNull();

    index.remember("k1", "req-1");
    expect(index.resolve("k1")).toBe("req-1");
    expect(index.size()).toBe(1);

    index.remember("k1", "req-2");
    expect(index.resolve("k1")).toBe("req-2");

    index.clear();
    expect(index.resolve("k1")).toBeNull();
    expect(index.size()).toBe(0);
  });
});
