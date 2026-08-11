/**
 * Governance seed coverage (T-2026-024 / G2) + reset isolation.
 *
 * IMPORTANT: the first test in this file must run before any
 * `resetAccessApplicationStore()` call, so it observes the module's fresh,
 * never-seeded state and exercises the real lazy-seed path.
 */

import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_SEED_APPLICATIONS,
  listAccessApplications,
  resetAccessApplicationStore,
} from "./access-request-store.server";

describe("governance demo seed (lazy, on first list)", () => {
  it("covers pending, rejected, expired, permission-denied, deprecated API, and missing-owner", () => {
    const rows = listAccessApplications();
    expect(rows.length).toBeGreaterThanOrEqual(
      GOVERNANCE_SEED_APPLICATIONS.length
    );

    const byId = new Map(rows.map((r) => [r.id, r]));

    const pending = byId.get("seed-req-pending-1");
    expect(pending?.status).toBe("pending_approval");

    const rejected = byId.get("seed-req-denied-1");
    expect(rejected?.status).toBe("denied");
    expect(rejected?.decision?.need_approval).toBe(true);

    const expired = byId.get("seed-req-expired-1");
    expect(expired?.status).toBe("expired");

    const permissionDenied = byId.get("seed-req-permission-denied-1");
    expect(permissionDenied?.status).toBe("denied");
    // Distinguishes a direct policy deny from a reviewed rejection.
    expect(permissionDenied?.decision?.need_approval).toBe(false);
    expect(permissionDenied?.decision?.allow).toBe(false);

    const deprecatedApi = byId.get("seed-req-deprecated-api-1");
    expect(deprecatedApi?.assetId).toBe("api-legacy-quote");
    expect(deprecatedApi?.status).toBe("denied");

    const missingOwner = byId.get("seed-req-missing-owner-1");
    expect(missingOwner?.assetId).toBe("dim-vendor-directory");
    expect(missingOwner?.owner).toBe("");
    expect(missingOwner?.status).toBe("pending_approval");
  });

  it("role-switch subsets differ: pendingOnly (owner/admin) is a strict subset of the full list (requester)", () => {
    const all = listAccessApplications();
    const pendingOnly = listAccessApplications({ pendingOnly: true });
    expect(pendingOnly.length).toBeGreaterThan(0);
    expect(pendingOnly.length).toBeLessThan(all.length);
    expect(pendingOnly.every((r) => r.status === "pending_approval")).toBe(
      true
    );
  });
});

describe("resetAccessApplicationStore isolation", () => {
  it("leaves the store genuinely empty (no silent reseed)", () => {
    resetAccessApplicationStore();
    expect(listAccessApplications()).toHaveLength(0);
  });
});
