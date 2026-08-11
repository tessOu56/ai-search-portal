/**
 * Remix adapter over shared governance-domain store (T-2026-201).
 * Seed + public API preserved for G1/G2 demo and existing callers.
 */

import type {
  AccessApplicationContract,
  AccessRequestLifecycleStatus,
  PolicyDecisionContract,
} from "@ai-search-portal/contracts";
import { accessApplicationSchema } from "@ai-search-portal/contracts";
import {
  type AccessMutationFailure,
  type AccessMutationResult,
  createAccessRequestStore,
} from "@ai-search-portal/governance-domain";

export type { AccessMutationFailure, AccessMutationResult };

/** Shared seed requester id — same analyst persona across most fixture rows. */
const SEED_REQUESTER_ANALYST = "requester:analyst";

/**
 * Realistic governance demo seed (T-2026-024 / G2). Lazily applied on first
 * `listAccessApplications()` call so pure unit tests that never list are unaffected.
 */
const GOVERNANCE_SEED_APPLICATIONS: AccessApplicationContract[] = [
  {
    id: "seed-req-pending-1",
    assetId: "tbl-customer-profile",
    assetName: "dim_customer_profile",
    purpose: "marketing",
    role: "analyst",
    requesterId: SEED_REQUESTER_ANALYST,
    status: "pending_approval",
    permissionStatus: "pending",
    owner: "crm-owner@example.com",
    createdAt: "2026-08-09T02:00:00.000Z",
    updatedAt: "2026-08-09T02:00:00.000Z",
    decision: {
      allow: false,
      need_approval: true,
      mask_fields: ["email", "phone", "line_uid"],
      require_audit: false,
      decision_id: "dec-seed-pending-1",
      reasons: [
        "policy: analyst requires approval for PII datasets",
        "policy: marketing purpose on PII requires approval",
      ],
    },
  },
  {
    id: "seed-req-denied-1",
    assetId: "dash-studio-margin",
    assetName: "studio_margin_dashboard",
    purpose: "analytics",
    role: "analyst",
    requesterId: SEED_REQUESTER_ANALYST,
    status: "denied",
    permissionStatus: "revoked",
    owner: "bi-team@example.com",
    createdAt: "2026-08-04T06:00:00.000Z",
    updatedAt: "2026-08-06T09:30:00.000Z",
    decision: {
      allow: false,
      need_approval: true,
      mask_fields: [],
      require_audit: true,
      decision_id: "dec-seed-denied-1",
      reasons: ["policy: confidential classification requires audit log"],
    },
  },
  {
    id: "seed-req-expired-1",
    assetId: "tbl-customer-profile",
    assetName: "dim_customer_profile",
    purpose: "operations",
    role: "analyst",
    requesterId: SEED_REQUESTER_ANALYST,
    status: "expired",
    permissionStatus: "revoked",
    owner: "crm-owner@example.com",
    createdAt: "2026-07-20T01:00:00.000Z",
    updatedAt: "2026-07-28T01:00:00.000Z",
    decision: {
      allow: false,
      need_approval: true,
      mask_fields: ["email", "phone", "line_uid"],
      require_audit: false,
      decision_id: "dec-seed-expired-1",
      reasons: ["policy: analyst requires approval for PII datasets"],
    },
  },
  {
    id: "seed-req-permission-denied-1",
    assetId: "tbl-rental-slot",
    assetName: "fact_rental_slot",
    purpose: "analytics",
    role: "analyst",
    requesterId: SEED_REQUESTER_ANALYST,
    status: "denied",
    permissionStatus: "revoked",
    owner: "studio-data@example.com",
    createdAt: "2026-08-07T03:15:00.000Z",
    updatedAt: "2026-08-07T03:15:00.000Z",
    decision: {
      allow: false,
      need_approval: false,
      mask_fields: [],
      require_audit: false,
      decision_id: "dec-seed-permission-denied-1",
      reasons: ["policy: default deny"],
    },
  },
  {
    id: "seed-req-deprecated-api-1",
    assetId: "api-legacy-quote",
    assetName: "GET /api/materials/legacy-quote",
    purpose: "operations",
    role: "engineer",
    requesterId: "requester:engineer",
    status: "denied",
    permissionStatus: "revoked",
    owner: "api-team@example.com",
    createdAt: "2026-08-02T05:00:00.000Z",
    updatedAt: "2026-08-02T05:05:00.000Z",
    decision: {
      allow: false,
      need_approval: false,
      mask_fields: [],
      require_audit: false,
      decision_id: "dec-seed-deprecated-1",
      reasons: [
        "policy: asset deprecated — access blocked pending sunset",
        "see api-material-quote for the supported replacement",
      ],
    },
  },
  {
    id: "seed-req-missing-owner-1",
    assetId: "dim-vendor-directory",
    assetName: "dim_vendor_directory",
    purpose: "operations",
    role: "analyst",
    requesterId: SEED_REQUESTER_ANALYST,
    status: "pending_approval",
    permissionStatus: "pending",
    owner: "",
    createdAt: "2026-08-10T08:00:00.000Z",
    updatedAt: "2026-08-10T08:00:00.000Z",
    decision: {
      allow: false,
      need_approval: true,
      mask_fields: [],
      require_audit: false,
      decision_id: "dec-seed-missing-owner-1",
      reasons: [
        "policy: no owner on record — routed to admin escalation queue",
      ],
    },
  },
].map((row) => accessApplicationSchema.parse(row));

/** Exposed for tests asserting seed coverage of the required edge cases. */
export { GOVERNANCE_SEED_APPLICATIONS };

const store = createAccessRequestStore({
  seed: GOVERNANCE_SEED_APPLICATIONS,
  lazySeed: true,
});

/**
 * Test-only reset. Marks the governance seed as already-applied so tests get
 * a genuinely empty store (no silent reseed on the next list).
 */
export function resetAccessApplicationStore(): void {
  store.reset({ keepSeedSuppressed: true });
}

export function rememberIdempotencyKey(key: string, requestId: string): void {
  store.rememberIdempotencyKey(key, requestId);
}

export function resolveIdempotencyKey(
  key: string
): AccessApplicationContract | null {
  return store.resolveIdempotencyKey(key);
}

export function listAccessApplications(filter?: {
  requesterId?: string;
  assetId?: string;
  status?: AccessRequestLifecycleStatus;
  pendingOnly?: boolean;
}): AccessApplicationContract[] {
  return store.list(filter);
}

/**
 * Most recent application for a requester on a given asset (metadata detail
 * lifecycle stepper — T-186 tool-density polish).
 */
export function getLatestAccessApplicationForAsset(args: {
  assetId: string;
  requesterId: string;
}): AccessApplicationContract | null {
  const rows = listAccessApplications({
    assetId: args.assetId,
    requesterId: args.requesterId,
  });
  return rows[0] ?? null;
}

export function getAccessApplication(
  id: string
): AccessApplicationContract | null {
  return store.get(id);
}

export function createAccessApplication(args: {
  id: string;
  assetId: string;
  assetName: string;
  purpose: AccessApplicationContract["purpose"];
  role: AccessApplicationContract["role"];
  requesterId: string;
  status: AccessRequestLifecycleStatus;
  owner: string;
  decision?: PolicyDecisionContract;
  termsAccepted?: string[];
}): AccessApplicationContract {
  return store.create(args);
}

export function reviewAccessApplication(args: {
  id: string;
  decision: "approved" | "denied";
}): AccessMutationResult {
  return store.review(args);
}

export function cancelAccessApplication(args: {
  id: string;
}): AccessMutationResult {
  return store.cancel(args);
}

/** Mark draft / pending_approval rows older than maxAgeMs as expired (G1 demo). */
export function expireStaleAccessApplications(
  maxAgeMs = 7 * 24 * 60 * 60 * 1000,
  now = Date.now()
): AccessApplicationContract[] {
  return store.expireStale(maxAgeMs, now);
}

export function editAccessApplication(args: {
  id: string;
  purpose?: AccessApplicationContract["purpose"];
  role?: AccessApplicationContract["role"];
}): AccessMutationResult {
  return store.edit(args);
}

export function submitDraftAccessApplication(id: string): AccessMutationResult {
  return store.submitDraft(id);
}
