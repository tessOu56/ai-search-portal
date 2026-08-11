/**
 * Governance contract parity — same payloads through Zod + store mutation helpers.
 * T-186 Pillar 3.
 */

import { beforeEach, describe, expect, it } from "vitest";

import {
  cancelAccessApplication,
  createAccessApplication,
  resetAccessApplicationStore,
  reviewAccessApplication,
  submitDraftAccessApplication,
} from "~/services/access-request-store.server";
import {
  governanceDeniedError,
  governanceHitlError,
  governanceInvalidTransitionError,
  governancePolicyErrorSchema,
  metadataAccessRequestSchema,
  policyDecisionSchema,
  submitAccessResponseSchema,
} from "~/shared/contracts";

const ASSET_ID = "tbl-customers";

const decision = policyDecisionSchema.parse({
  allow: false,
  need_approval: true,
  mask_fields: ["email"],
  require_audit: true,
  decision_id: "dec-parity-1",
  reasons: ["policy: marketing purpose on PII requires approval"],
});

describe("governance contract parity", () => {
  beforeEach(() => {
    resetAccessApplicationStore();
  });

  it("parses submit request and typed HITL / deny errors", () => {
    const req = metadataAccessRequestSchema.parse({
      assetId: ASSET_ID,
      purpose: "marketing",
      role: "analyst",
      approved: false,
    });
    expect(req.assetId).toBe("tbl-customers");

    const hitl = governanceHitlError("Human approval required", decision);
    expect(governancePolicyErrorSchema.parse(hitl).code).toBe("HITL_REQUIRED");
    expect(hitl.toolError?.code).toBe("HITL_REQUIRED");

    const denied = governanceDeniedError("Access denied by policy", {
      ...decision,
      need_approval: false,
    });
    expect(denied.code).toBe("ACCESS_DENIED");
  });

  it("draft → submit → review → cancel transitions stay in schema", () => {
    createAccessApplication({
      id: "req-1",
      assetId: ASSET_ID,
      assetName: "Customers",
      purpose: "marketing",
      role: "analyst",
      requesterId: "requester:analyst",
      status: "draft",
      owner: "data-owner",
      decision,
    });

    const submitted = submitDraftAccessApplication("req-1");
    expect(submitted.ok).toBe(true);
    if (!submitted.ok) return;

    const body = submitAccessResponseSchema.parse({
      data: {
        requestId: submitted.data.id,
        status: submitted.data.status,
        decision,
        auditLogged: true,
      },
    });
    expect(body.data.status).toBe("pending_approval");

    const reviewed = reviewAccessApplication({
      id: "req-1",
      decision: "approved",
    });
    expect(reviewed.ok).toBe(true);
    if (!reviewed.ok) return;
    expect(reviewed.data.status).toBe("approved");

    const badCancel = cancelAccessApplication({ id: "req-1" });
    expect(badCancel.ok).toBe(false);
    if (badCancel.ok) return;
    expect(badCancel.reason).toBe("invalid_transition");
    expect(
      governanceInvalidTransitionError("Cannot cancel when approved").code
    ).toBe("INVALID_TRANSITION");
  });

  it("cancel works from pending_approval", () => {
    createAccessApplication({
      id: "req-2",
      assetId: ASSET_ID,
      assetName: "Customers",
      purpose: "marketing",
      role: "analyst",
      requesterId: "requester:analyst",
      status: "pending_approval",
      owner: "data-owner",
      decision,
    });
    const cancelled = cancelAccessApplication({ id: "req-2" });
    expect(cancelled.ok).toBe(true);
    if (!cancelled.ok) return;
    expect(cancelled.data.status).toBe("cancelled");
    expect(cancelled.data.permissionStatus).toBe("revoked");
  });
});
