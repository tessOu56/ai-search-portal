import { describe, expect, it } from "vitest";

import { canTransition, nextStatus } from "./transitions.js";

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
});
