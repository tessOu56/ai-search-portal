import { describe, expect, it, vi } from "vitest";

import { clearVitals, recordVital, subscribeVitals } from "./vitals-store";

describe("vitals-store", () => {
  it("does not notify when CLS value and rating are unchanged", () => {
    clearVitals();
    const listener = vi.fn();
    const unsubscribe = subscribeVitals(listener);
    const sample = {
      name: "CLS" as const,
      value: 0.01,
      rating: "good" as const,
      route: "/vitals",
      at: "2026-08-19T00:00:00.000Z",
    };
    recordVital(sample);
    expect(listener).toHaveBeenCalledTimes(1);
    recordVital({ ...sample, at: "2026-08-19T00:00:01.000Z" });
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
