/**
 * Governance seed coverage (T-2026-024 / G2) + reset isolation.
 *
 * IMPORTANT: the first test in this file must run before any
 * `resetAccessApplicationStore()` call, so it observes the module's fresh,
 * never-seeded state and exercises the real lazy-seed path.
 */

import { describe, expect, it } from "vitest";

import {
  cancelAccessApplication,
  createAccessApplication,
  expireStaleAccessApplications,
  getLatestAccessApplicationForAsset,
  GOVERNANCE_SEED_APPLICATIONS,
  listAccessApplications,
  resetAccessApplicationStore,
  reviewAccessApplication,
  submitDraftAccessApplication,
} from "./access-request-store.server";

const ASSET_CUSTOMERS = "tbl-customers";
const ASSET_ORDERS = "tbl-orders";
const PENDING = "pending_approval";
const STORE_REQUESTER = "requester:store-test";
const STORE_PENDING_ID = "req-store-mutation-1";

describe("governance demo seed (lazy, on first list)", () => {
  it("covers pending, rejected, expired, permission-denied, deprecated API, and missing-owner", () => {
    const rows = listAccessApplications();
    expect(rows.length).toBeGreaterThanOrEqual(
      GOVERNANCE_SEED_APPLICATIONS.length
    );

    const byId = new Map(rows.map((r) => [r.id, r]));

    const pending = byId.get("seed-req-pending-1");
    expect(pending?.status).toBe(PENDING);
    expect(pending?.assetId).toBe(ASSET_CUSTOMERS);

    const rejected = byId.get("seed-req-denied-1");
    expect(rejected?.status).toBe("denied");
    expect(rejected?.assetId).toBe("dash-orders");
    expect(rejected?.decision?.need_approval).toBe(true);

    const expired = byId.get("seed-req-expired-1");
    expect(expired?.status).toBe("expired");
    expect(expired?.assetId).toBe(ASSET_CUSTOMERS);

    const permissionDenied = byId.get("seed-req-permission-denied-1");
    expect(permissionDenied?.status).toBe("denied");
    expect(permissionDenied?.assetId).toBe("tbl-etl-orders");
    // Distinguishes a direct policy deny from a reviewed rejection.
    expect(permissionDenied?.decision?.need_approval).toBe(false);
    expect(permissionDenied?.decision?.allow).toBe(false);

    const deprecatedApi = byId.get("seed-req-deprecated-api-1");
    expect(deprecatedApi?.assetId).toBe("api-legacy-orders");
    expect(deprecatedApi?.status).toBe("denied");

    const missingOwner = byId.get("seed-req-missing-owner-1");
    expect(missingOwner?.assetId).toBe("dim-vendor-directory");
    expect(missingOwner?.owner).toBe("");
    expect(missingOwner?.status).toBe(PENDING);

    const draft = byId.get("seed-req-draft-1");
    expect(draft?.status).toBe("draft");
    expect(draft?.assetId).toBe(ASSET_ORDERS);

    const approved = byId.get("seed-req-approved-1");
    expect(approved?.status).toBe("approved");
    expect(approved?.assetId).toBe(ASSET_ORDERS);
  });

  it("role-switch subsets differ: pendingOnly (owner/admin) is a strict subset of the full list (requester)", () => {
    const all = listAccessApplications();
    const pendingOnly = listAccessApplications({ pendingOnly: true });
    expect(pendingOnly.length).toBeGreaterThan(0);
    expect(pendingOnly.length).toBeLessThan(all.length);
    expect(pendingOnly.every((r) => r.status === PENDING)).toBe(true);
  });
});

describe("access request mutations", () => {
  const decision = {
    allow: false,
    need_approval: true,
    mask_fields: ["email"],
    require_audit: false,
    decision_id: "dec-store-test",
    reasons: ["policy: analyst requires approval for PII datasets"],
  };

  it("creates, locates latest, reviews, and expires stale rows", () => {
    const created = createAccessApplication({
      id: STORE_PENDING_ID,
      assetId: ASSET_CUSTOMERS,
      assetName: "customer_profile",
      purpose: "marketing",
      role: "analyst",
      requesterId: STORE_REQUESTER,
      status: PENDING,
      owner: "crm-owner@example.com",
      decision,
    });
    expect(created.status).toBe(PENDING);

    const latest = getLatestAccessApplicationForAsset({
      assetId: ASSET_CUSTOMERS,
      requesterId: STORE_REQUESTER,
    });
    expect(latest?.id).toBe(STORE_PENDING_ID);

    const reviewed = reviewAccessApplication({
      id: STORE_PENDING_ID,
      decision: "approved",
    });
    expect(reviewed.ok).toBe(true);
    if (!reviewed.ok) return;
    expect(reviewed.data.status).toBe("approved");

    const draft = createAccessApplication({
      id: "req-store-mutation-draft",
      assetId: ASSET_ORDERS,
      assetName: "orders",
      purpose: "analytics",
      role: "analyst",
      requesterId: STORE_REQUESTER,
      status: "draft",
      owner: "bi-team@example.com",
      decision,
    });
    const submitted = submitDraftAccessApplication(draft.id);
    expect(submitted.ok).toBe(true);

    const cancelled = cancelAccessApplication({
      id: "req-store-mutation-draft",
    });
    expect(cancelled.ok).toBe(true);
    if (!cancelled.ok) return;
    expect(cancelled.data.status).toBe("cancelled");

    const expired = expireStaleAccessApplications(0, Date.now() + 1);
    expect(Array.isArray(expired)).toBe(true);
  });
});

describe("resetAccessApplicationStore isolation", () => {
  it("leaves the store genuinely empty (no silent reseed)", () => {
    resetAccessApplicationStore();
    expect(listAccessApplications()).toHaveLength(0);
  });
});
