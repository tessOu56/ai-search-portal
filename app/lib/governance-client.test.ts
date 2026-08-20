import { describe, expect, it } from "vitest";

import { evaluateAccess, submitAccess } from "~/lib/governance-client";
import {
  evaluateAccessResponseSchema,
  submitAccessResponseSchema,
} from "~/shared/contracts";

describe("governance-client BFF JSON (T-2026-247)", () => {
  it("evaluateAccess posts to the Remix BFF evaluate route", async () => {
    const res = await evaluateAccess({
      assetId: "tbl-customers",
      purpose: "analytics",
      role: "analyst",
    });
    expect(res.ok).toBe(true);
    const parsed = evaluateAccessResponseSchema.parse(await res.json());
    expect(parsed.data.need_approval).toBe(true);
    expect(parsed.data.mask_fields).toContain("email");
  });

  it("submitAccess without approval returns HITL 422", async () => {
    const res = await submitAccess({
      assetId: "tbl-customers",
      purpose: "analytics",
      role: "analyst",
    });
    expect(res.status).toBe(422);
    const parsed = submitAccessResponseSchema.safeParse(await res.json());
    expect(parsed.success).toBe(false);
  });
});
