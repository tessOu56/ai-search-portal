/**
 * Governance contract parity — same cases against Remix + Hono adapters.
 * T-186 Pillar 3 / T-2026-201 Wave R2.
 */

import { beforeEach, describe, expect, it } from "vitest";

import {
  cancelAccessApplication,
  createAccessApplication,
  editAccessApplication,
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

import {
  cancelApplication,
  createApplication,
  editApplication,
  resetHonoAccessStore,
  reviewApplication,
  submitDraft,
} from "../../backend/src/store/access-requests";

const ASSET_ID = "tbl-customers";
const ASSET_NAME = "Customers";
const REQUESTER_ANALYST = "requester:analyst";
const OWNER_ID = "data-owner";

const decision = policyDecisionSchema.parse({
  allow: false,
  need_approval: true,
  mask_fields: ["email"],
  require_audit: true,
  decision_id: "dec-parity-1",
  reasons: ["policy: marketing purpose on PII requires approval"],
});

type Adapter = {
  name: string;
  reset: () => void;
  create: (args: {
    id: string;
    assetId: string;
    assetName: string;
    purpose: "marketing";
    role: "analyst";
    requesterId: string;
    status: "draft" | "pending_approval";
    owner: string;
    decision: typeof decision;
  }) => { id: string; status: string; permissionStatus: string };
  submitDraft: (
    id: string
  ) =>
    | { ok: true; data: { id: string; status: string } }
    | { ok: false; reason: string };
  review: (args: {
    id: string;
    decision: "approved" | "denied";
  }) => { ok: true; data: { status: string } } | { ok: false; reason: string };
  cancel: (
    id: string
  ) =>
    | { ok: true; data: { status: string; permissionStatus: string } }
    | { ok: false; reason: string };
  edit: (args: {
    id: string;
    purpose?: "analytics" | "marketing" | "operations";
    role?: "analyst" | "data_admin" | "engineer";
  }) =>
    | { ok: true; data: { purpose: string; role: string; status: string } }
    | { ok: false; reason: string };
};

const adapters: Adapter[] = [
  {
    name: "remix",
    reset: resetAccessApplicationStore,
    create: createAccessApplication,
    submitDraft: submitDraftAccessApplication,
    review: reviewAccessApplication,
    cancel: (id) => cancelAccessApplication({ id }),
    edit: editAccessApplication,
  },
  {
    name: "hono",
    reset: resetHonoAccessStore,
    create: createApplication,
    submitDraft,
    review: reviewApplication,
    cancel: cancelApplication,
    edit: editApplication,
  },
];

describe("governance contract parity", () => {
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

  describe.each(adapters)("$name store adapter", (adapter) => {
    beforeEach(() => {
      adapter.reset();
    });

    it("draft → submit → review → cancel transitions stay in schema", () => {
      adapter.create({
        id: "req-1",
        assetId: ASSET_ID,
        assetName: ASSET_NAME,
        purpose: "marketing",
        role: "analyst",
        requesterId: REQUESTER_ANALYST,
        status: "draft",
        owner: OWNER_ID,
        decision,
      });

      const submitted = adapter.submitDraft("req-1");
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

      const reviewed = adapter.review({
        id: "req-1",
        decision: "approved",
      });
      expect(reviewed.ok).toBe(true);
      if (!reviewed.ok) return;
      expect(reviewed.data.status).toBe("approved");

      const badCancel = adapter.cancel("req-1");
      expect(badCancel.ok).toBe(false);
      if (badCancel.ok) return;
      expect(badCancel.reason).toBe("invalid_transition");
      expect(
        governanceInvalidTransitionError("Cannot cancel when approved").code
      ).toBe("INVALID_TRANSITION");
    });

    it("cancel works from pending_approval", () => {
      adapter.create({
        id: "req-2",
        assetId: ASSET_ID,
        assetName: ASSET_NAME,
        purpose: "marketing",
        role: "analyst",
        requesterId: REQUESTER_ANALYST,
        status: "pending_approval",
        owner: OWNER_ID,
        decision,
      });
      const cancelled = adapter.cancel("req-2");
      expect(cancelled.ok).toBe(true);
      if (!cancelled.ok) return;
      expect(cancelled.data.status).toBe("cancelled");
      expect(cancelled.data.permissionStatus).toBe("revoked");
    });

    it("edit works from pending_approval (shared transitions)", () => {
      adapter.create({
        id: "req-3",
        assetId: ASSET_ID,
        assetName: ASSET_NAME,
        purpose: "marketing",
        role: "analyst",
        requesterId: REQUESTER_ANALYST,
        status: "pending_approval",
        owner: OWNER_ID,
        decision,
      });
      const edited = adapter.edit({
        id: "req-3",
        purpose: "operations",
        role: "engineer",
      });
      expect(edited.ok).toBe(true);
      if (!edited.ok) return;
      expect(edited.data.status).toBe("pending_approval");
      expect(edited.data.purpose).toBe("operations");
      expect(edited.data.role).toBe("engineer");
    });
  });
});
