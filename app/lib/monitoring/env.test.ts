import { describe, expect, it } from "vitest";

import { readClientSentryDsn, readTracesSampleRate } from "./env";

describe("monitoring env", () => {
  it("treats a blank DSN as absent", () => {
    expect(readClientSentryDsn()).toBeUndefined();
  });

  it("clamps traces sample rate to [0, 1] with a 0.1 default", () => {
    expect(readTracesSampleRate(undefined)).toBe(0.1);
    expect(readTracesSampleRate("0.25")).toBe(0.25);
    expect(readTracesSampleRate("2")).toBe(1);
    expect(readTracesSampleRate("nope")).toBe(0.1);
  });
});
