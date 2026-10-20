import { afterEach, describe, expect, it } from "vitest";

import {
  evaluateMetadataAccess,
  submitMetadataAccessRequest,
} from "./access-policy.server";
import { resetAuditLogForTest } from "./audit-log.server";

const CUSTOMERS = "tbl-customers";
const DASH_ORDERS = "dash-orders";

afterEach(() => {
  resetAuditLogForTest();
});

describe("evaluateMetadataAccess", () => {
  it("requires HITL for analyst + marketing on PII", () => {
    const decision = evaluateMetadataAccess({
      assetId: CUSTOMERS,
      purpose: "marketing",
      role: "analyst",
    });
    expect(decision.allow).toBe(false);
    expect(decision.need_approval).toBe(true);
    expect(decision.mask_fields).toEqual(
      expect.arrayContaining(["email", "phone"])
    );
    expect(decision.decision_id.length).toBeGreaterThan(0);
    expect(decision.reasons.some((reason) => /PII/i.test(reason))).toBe(true);
  });

  it("allows data_admin on PII without approval", () => {
    const decision = evaluateMetadataAccess({
      assetId: CUSTOMERS,
      purpose: "analytics",
      role: "data_admin",
    });
    expect(decision.allow).toBe(true);
    expect(decision.need_approval).toBe(false);
  });

  it("denies engineer on PII when no HITL rule matches", () => {
    const decision = evaluateMetadataAccess({
      assetId: CUSTOMERS,
      purpose: "analytics",
      role: "engineer",
    });
    expect(decision.allow).toBe(false);
    expect(decision.need_approval).toBe(false);
  });

  it("flags confidential assets for audit", () => {
    const decision = evaluateMetadataAccess({
      assetId: DASH_ORDERS,
      purpose: "analytics",
      role: "data_admin",
    });
    expect(decision.require_audit).toBe(true);
    expect(decision.reasons.some((reason) => /audit/i.test(reason))).toBe(true);
  });

  it("throws when the asset is missing", () => {
    expect(() =>
      evaluateMetadataAccess({
        assetId: "missing-asset",
        purpose: "analytics",
        role: "analyst",
      })
    ).toThrow(/not found/i);
  });
});

describe("submitMetadataAccessRequest", () => {
  it("returns 422 HITL when approval is required and missing", () => {
    const result = submitMetadataAccessRequest({
      assetId: CUSTOMERS,
      purpose: "marketing",
      role: "analyst",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(422);
    expect(result.decision.need_approval).toBe(true);
  });

  it("persists pending_approval when HITL is confirmed", () => {
    const result = submitMetadataAccessRequest({
      assetId: CUSTOMERS,
      purpose: "marketing",
      role: "analyst",
      approved: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.status).toBe(202);
    expect(result.data.status).toBe("pending_approval");
    expect(result.data.requestId.length).toBeGreaterThan(0);
  });

  it("auto-approves data_admin and records audit for confidential assets", () => {
    const result = submitMetadataAccessRequest({
      assetId: DASH_ORDERS,
      purpose: "analytics",
      role: "data_admin",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.status).toBe("approved");
    expect(result.data.auditLogged).toBe(true);
  });

  it("persists a draft without submitting", () => {
    const result = submitMetadataAccessRequest({
      assetId: CUSTOMERS,
      purpose: "analytics",
      role: "analyst",
      asDraft: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.status).toBe(201);
    expect(result.data.status).toBe("draft");
    expect(result.data.auditLogged).toBe(false);
  });

  it("returns 403 when policy denies without HITL", () => {
    const result = submitMetadataAccessRequest({
      assetId: CUSTOMERS,
      purpose: "analytics",
      role: "engineer",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(403);
    expect(result.decision.allow).toBe(false);
    expect(result.decision.need_approval).toBe(false);
  });
});
