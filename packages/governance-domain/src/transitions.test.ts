import { describe, expect, it } from "vitest";

import {
  canTransition,
  nextStatus,
  reviewActionForDecision,
} from "./transitions.js";

describe("access transition table", () => {
  it("allows draft → submit → pending_approval", () => {
    expect(canTransition("draft", "submit")).toBe(true);
    expect(nextStatus("draft", "submit")).toBe("pending_approval");
  });

  it("allows pending edit without leaving pending_approval", () => {
    expect(canTransition("pending_approval", "edit")).toBe(true);
    expect(nextStatus("pending_approval", "edit")).toBe("pending_approval");
  });

  it("rejects cancel from approved", () => {
    expect(canTransition("approved", "cancel")).toBe(false);
    expect(nextStatus("approved", "cancel")).toBeNull();
  });

  it("allows pending approve/deny/cancel/expire and maps review decisions", () => {
    expect(canTransition("pending_approval", "approve")).toBe(true);
    expect(nextStatus("pending_approval", "approve")).toBe("approved");
    expect(canTransition("pending_approval", "deny")).toBe(true);
    expect(nextStatus("pending_approval", "deny")).toBe("denied");
    expect(canTransition("pending_approval", "cancel")).toBe(true);
    expect(nextStatus("draft", "cancel")).toBe("cancelled");
    expect(canTransition("draft", "expire")).toBe(true);
    expect(nextStatus("draft", "expire")).toBe("expired");
    expect(reviewActionForDecision("approved")).toBe("approve");
    expect(reviewActionForDecision("denied")).toBe("deny");
  });

  it("treats terminal statuses as closed", () => {
    for (const status of [
      "approved",
      "denied",
      "expired",
      "cancelled",
    ] as const) {
      expect(canTransition(status, "submit")).toBe(false);
      expect(canTransition(status, "approve")).toBe(false);
      expect(nextStatus(status, "edit")).toBeNull();
    }
  });
});
