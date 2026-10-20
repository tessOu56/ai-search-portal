import { describe, expect, it } from "vitest";

import {
  cancelAccess,
  evaluateAccess,
  reviewAccess,
  submitAccess,
  submitDraftAccess,
} from "~/lib/governance-client";
import {
  evaluateAccessResponseSchema,
  submitAccessResponseSchema,
} from "~/shared/contracts";
import {
  bearer,
  TEST_REQUESTER_TOKEN,
  TEST_REVIEWER_TOKEN,
} from "~/test/auth-fixtures";

const CUSTOMERS = "tbl-customers";
const REQUESTER = { authorization: bearer(TEST_REQUESTER_TOKEN) };
const REVIEWER = { authorization: bearer(TEST_REVIEWER_TOKEN) };

describe("governance-client BFF JSON (T-2026-247)", () => {
  it("evaluateAccess posts to the Remix BFF evaluate route", async () => {
    const res = await evaluateAccess(
      {
        assetId: CUSTOMERS,
        purpose: "analytics",
        role: "analyst",
      },
      REQUESTER
    );
    expect(res.ok).toBe(true);
    const parsed = evaluateAccessResponseSchema.parse(await res.json());
    expect(parsed.data.need_approval).toBe(true);
    expect(parsed.data.mask_fields).toContain("email");
  });

  it("submitAccess without approval returns HITL 422", async () => {
    const res = await submitAccess(
      {
        assetId: CUSTOMERS,
        purpose: "analytics",
        role: "analyst",
      },
      REQUESTER
    );
    expect(res.status).toBe(422);
    const parsed = submitAccessResponseSchema.safeParse(await res.json());
    expect(parsed.success).toBe(false);
  });

  it("submits a confirmed request then reviews and cancels through BFF helpers", async () => {
    const submitted = await submitAccess(
      {
        assetId: CUSTOMERS,
        purpose: "marketing",
        role: "analyst",
        approved: true,
      },
      REQUESTER
    );
    expect(submitted.status).toBe(202);
    const body = submitAccessResponseSchema.parse(await submitted.json());

    const reviewed = await reviewAccess(
      body.data.requestId,
      {
        decision: "denied",
      },
      REVIEWER
    );
    expect(reviewed.ok).toBe(true);

    const drafted = await submitAccess(
      {
        assetId: CUSTOMERS,
        purpose: "analytics",
        role: "analyst",
        asDraft: true,
      },
      REQUESTER
    );
    const draftBody = submitAccessResponseSchema.parse(await drafted.json());
    const promoted = await submitDraftAccess(
      draftBody.data.requestId,
      {},
      REQUESTER
    );
    expect(promoted.ok).toBe(true);
    const cancelled = await cancelAccess(
      draftBody.data.requestId,
      {},
      REQUESTER
    );
    expect([200, 409]).toContain(cancelled.status);
  });
});
