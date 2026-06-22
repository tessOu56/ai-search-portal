import { describe, expect, it } from "vitest";

import { evaluateAccessInProcess } from "../policies/evaluate-access.js";

describe("evaluateAccessInProcess", () => {
  it("data_admin allows PII", () => {
    const result = evaluateAccessInProcess({
      user: { role: "data_admin" },
      purpose: "analytics",
      dataset: {
        classification: "PII",
        fields: [{ name: "email", sensitive: true }],
      },
    });
    expect(result.allow).toBe(true);
  });

  it("analyst on PII needs approval", () => {
    const result = evaluateAccessInProcess({
      user: { role: "analyst" },
      purpose: "analytics",
      dataset: {
        classification: "PII",
        fields: [{ name: "email", sensitive: true }],
      },
    });
    expect(result.need_approval).toBe(true);
    expect(result.mask_fields).toContain("email");
  });
});
