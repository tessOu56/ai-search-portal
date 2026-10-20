import { describe, expect, it } from "vitest";

import { evaluateAccessPolicy } from "./policy.js";

const emailField = { name: "email", sensitive: true };

describe("evaluateAccessPolicy", () => {
  it("allows data_admin on PII", () => {
    const result = evaluateAccessPolicy({
      user: { role: "data_admin" },
      purpose: "analytics",
      dataset: { classification: "PII", fields: [emailField] },
    });
    expect(result.allow).toBe(true);
    expect(result.need_approval).toBe(false);
    expect(result.mask_fields).toEqual(["email"]);
  });

  it("requires approval for analyst on PII", () => {
    const result = evaluateAccessPolicy({
      user: { role: "analyst" },
      purpose: "analytics",
      dataset: { classification: "PII", fields: [emailField] },
    });
    expect(result.allow).toBe(false);
    expect(result.need_approval).toBe(true);
    expect(
      result.reasons.some((reason) => /analyst requires approval/i.test(reason))
    ).toBe(true);
  });

  it("requires approval for marketing purpose on PII even for engineers", () => {
    const result = evaluateAccessPolicy({
      user: { role: "engineer" },
      purpose: "marketing",
      dataset: { classification: "PII", fields: [emailField] },
    });
    expect(result.need_approval).toBe(true);
    expect(
      result.reasons.some((reason) => /marketing purpose on PII/i.test(reason))
    ).toBe(true);
  });

  it("allows engineer on internal data", () => {
    const result = evaluateAccessPolicy({
      user: { role: "engineer" },
      purpose: "analytics",
      dataset: { classification: "internal", fields: [] },
    });
    expect(result.allow).toBe(true);
    expect(result.need_approval).toBe(false);
  });

  it("requires audit for confidential classification", () => {
    const result = evaluateAccessPolicy({
      user: { role: "data_admin" },
      purpose: "analytics",
      dataset: { classification: "confidential", fields: [] },
    });
    expect(result.require_audit).toBe(true);
    expect(result.allow).toBe(true);
  });

  it("default-denies unmatched roles", () => {
    const result = evaluateAccessPolicy({
      user: { role: "guest" },
      purpose: "analytics",
      dataset: { classification: "internal", fields: [] },
    });
    expect(result.allow).toBe(false);
    expect(result.need_approval).toBe(false);
    expect(result.reasons).toContain("policy: default deny");
  });
});
