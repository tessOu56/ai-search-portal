import { describe, expect, it } from "vitest";

import { createAccessRequestStore } from "./repository.js";

const DECISION = {
  allow: false,
  need_approval: true,
  mask_fields: ["email"],
  require_audit: false,
  decision_id: "dec-repo-1",
  reasons: ["policy: analyst requires approval for PII datasets"],
};
const ASSET_CUSTOMERS = "tbl-customers";
const REQUESTER = "requester:analyst";
const PENDING = "pending_approval";
const OWNER = "owner@example.com";

function createPendingStore() {
  const store = createAccessRequestStore();
  store.create({
    id: "req-1",
    assetId: ASSET_CUSTOMERS,
    assetName: "customer_profile",
    purpose: "marketing",
    role: "analyst",
    requesterId: REQUESTER,
    status: PENDING,
    owner: OWNER,
    decision: DECISION,
  });
  return store;
}

describe("createAccessRequestStore", () => {
  it("lists, filters, and returns the latest matching row", () => {
    const store = createPendingStore();
    store.create({
      id: "req-2",
      assetId: "tbl-orders",
      assetName: "orders",
      purpose: "analytics",
      role: "analyst",
      requesterId: REQUESTER,
      status: "draft",
      owner: OWNER,
      decision: DECISION,
    });

    expect(store.list({ pendingOnly: true })).toHaveLength(1);
    expect(store.list({ assetId: "tbl-orders" })[0]?.id).toBe("req-2");
    expect(store.get("req-1")?.status).toBe(PENDING);
  });

  it("approves, denies, and rejects invalid transitions", () => {
    const store = createPendingStore();
    const approved = store.review({ id: "req-1", decision: "approved" });
    expect(approved.ok).toBe(true);
    if (!approved.ok) return;
    expect(approved.data.status).toBe("approved");
    expect(approved.data.permissionStatus).toBe("granted");

    const twice = store.review({ id: "req-1", decision: "denied" });
    expect(twice.ok).toBe(false);
    if (twice.ok) return;
    expect(twice.reason).toBe("invalid_transition");

    expect(store.review({ id: "missing", decision: "approved" }).ok).toBe(
      false
    );
  });

  it("cancels pending rows and edits purpose/role in place", () => {
    const store = createPendingStore();
    const edited = store.edit({
      id: "req-1",
      purpose: "operations",
      role: "engineer",
    });
    expect(edited.ok).toBe(true);
    if (!edited.ok) return;
    expect(edited.data.status).toBe(PENDING);
    expect(edited.data.purpose).toBe("operations");
    expect(edited.data.role).toBe("engineer");

    const cancelled = store.cancel({ id: "req-1" });
    expect(cancelled.ok).toBe(true);
    if (!cancelled.ok) return;
    expect(cancelled.data.status).toBe("cancelled");
    expect(cancelled.data.permissionStatus).toBe("revoked");
  });

  it("promotes draft submit and expires stale draft/pending rows", () => {
    const now = Date.parse("2026-10-20T00:00:00.000Z");
    const store = createAccessRequestStore({
      now: () => new Date(now),
    });
    store.create({
      id: "draft-1",
      assetId: ASSET_CUSTOMERS,
      assetName: "customer_profile",
      purpose: "analytics",
      role: "analyst",
      requesterId: REQUESTER,
      status: "draft",
      owner: OWNER,
      decision: DECISION,
    });

    const submitted = store.submitDraft("draft-1");
    expect(submitted.ok).toBe(true);
    if (!submitted.ok) return;
    expect(submitted.data.status).toBe(PENDING);

    const expired = store.expireStale(1, now + 2);
    expect(expired).toHaveLength(1);
    expect(expired[0]?.status).toBe("expired");
    expect(store.get("draft-1")?.permissionStatus).toBe("revoked");
  });

  it("remembers idempotency keys until reset", () => {
    const store = createPendingStore();
    store.rememberIdempotencyKey("idem-1", "req-1");
    expect(store.resolveIdempotencyKey("idem-1")?.id).toBe("req-1");
    store.reset({ keepSeedSuppressed: true });
    expect(store.resolveIdempotencyKey("idem-1")).toBeNull();
    expect(store.list()).toHaveLength(0);
  });
});
