/**
 * In-memory access application store for G1 governance demo (T-2026-023).
 */

import type {
  AccessApplicationContract,
  AccessPermissionStatus,
  AccessRequestLifecycleStatus,
  PolicyDecisionContract,
} from "@ai-search-portal/contracts";
import { accessApplicationSchema } from "@ai-search-portal/contracts";

const applications = new Map<string, AccessApplicationContract>();
/** Idempotency-Key → requestId for POST submit replay (T-186). */
const idempotencyKeys = new Map<string, string>();

/**
 * Realistic governance demo seed (T-2026-024 / G2). Lazily applied on first
 * `listAccessApplications()` call so pure unit tests that never list (e.g.
 * governance-contract-parity.test.ts, which resets then only exercises
 * create/submit/review helpers directly) are unaffected. Covers the six
 * required edge cases: pending, rejected, expired, permission denied,
 * deprecated API, missing owner — see
 * code-review/spec-reviews/2026-08-11-t-2026-024-governance-g2-seed.md §4.
 */
let governanceSeedApplied = false;

/** Shared seed requester id — same analyst persona across most fixture rows. */
const SEED_REQUESTER_ANALYST = "requester:analyst";

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

function ensureGovernanceSeed(): void {
  if (governanceSeedApplied) return;
  governanceSeedApplied = true;
  for (const row of GOVERNANCE_SEED_APPLICATIONS) {
    applications.set(row.id, row);
  }
}

/** Exposed for tests asserting seed coverage of the required edge cases. */
export { GOVERNANCE_SEED_APPLICATIONS };

function permissionFor(
  status: AccessRequestLifecycleStatus
): AccessPermissionStatus {
  switch (status) {
    case "approved":
      return "granted";
    case "pending_approval":
    case "draft":
      return "pending";
    case "denied":
    case "expired":
    case "cancelled":
      return "revoked";
    default:
      return "none";
  }
}

/**
 * Test-only reset. Marks the governance seed as already-applied so tests get
 * a genuinely empty store (no silent reseed on the next `listAccessApplications`
 * call) — see spec review §3 "Test isolation".
 */
export function resetAccessApplicationStore(): void {
  applications.clear();
  idempotencyKeys.clear();
  governanceSeedApplied = true;
}

export function rememberIdempotencyKey(key: string, requestId: string): void {
  idempotencyKeys.set(key, requestId);
}

export function resolveIdempotencyKey(
  key: string
): AccessApplicationContract | null {
  const id = idempotencyKeys.get(key);
  if (!id) return null;
  return applications.get(id) ?? null;
}

export function listAccessApplications(filter?: {
  requesterId?: string;
  assetId?: string;
  status?: AccessRequestLifecycleStatus;
  pendingOnly?: boolean;
}): AccessApplicationContract[] {
  ensureGovernanceSeed();
  let rows = [...applications.values()];
  if (filter?.requesterId) {
    rows = rows.filter((r) => r.requesterId === filter.requesterId);
  }
  if (filter?.assetId) {
    rows = rows.filter((r) => r.assetId === filter.assetId);
  }
  if (filter?.status) {
    rows = rows.filter((r) => r.status === filter.status);
  }
  if (filter?.pendingOnly) {
    rows = rows.filter((r) => r.status === "pending_approval");
  }
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/**
 * Most recent application for a requester on a given asset (metadata detail
 * lifecycle stepper — T-186 tool-density polish). Terminal statuses
 * (denied/cancelled/expired) are ignored once superseded by a newer draft.
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
  return applications.get(id) ?? null;
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
  const now = new Date().toISOString();
  const record = accessApplicationSchema.parse({
    id: args.id,
    assetId: args.assetId,
    assetName: args.assetName,
    purpose: args.purpose,
    role: args.role,
    requesterId: args.requesterId,
    status: args.status,
    permissionStatus: permissionFor(args.status),
    owner: args.owner,
    createdAt: now,
    updatedAt: now,
    decision: args.decision,
    termsAccepted: args.termsAccepted,
  });
  applications.set(record.id, record);
  return record;
}

export type AccessMutationFailure = "not_found" | "invalid_transition";

export type AccessMutationResult =
  | { ok: true; data: AccessApplicationContract }
  | { ok: false; reason: AccessMutationFailure };

export function reviewAccessApplication(args: {
  id: string;
  decision: "approved" | "denied";
}): AccessMutationResult {
  const current = applications.get(args.id);
  if (!current) return { ok: false, reason: "not_found" };
  if (current.status !== "pending_approval") {
    return { ok: false, reason: "invalid_transition" };
  }
  const status: AccessRequestLifecycleStatus =
    args.decision === "approved" ? "approved" : "denied";
  const updated = accessApplicationSchema.parse({
    ...current,
    status,
    permissionStatus: permissionFor(status),
    updatedAt: new Date().toISOString(),
  });
  applications.set(updated.id, updated);
  return { ok: true, data: updated };
}

export function cancelAccessApplication(args: {
  id: string;
}): AccessMutationResult {
  const current = applications.get(args.id);
  if (!current) return { ok: false, reason: "not_found" };
  if (current.status !== "pending_approval" && current.status !== "draft") {
    return { ok: false, reason: "invalid_transition" };
  }
  const updated = accessApplicationSchema.parse({
    ...current,
    status: "cancelled" as const,
    permissionStatus: permissionFor("cancelled"),
    updatedAt: new Date().toISOString(),
  });
  applications.set(updated.id, updated);
  return { ok: true, data: updated };
}

/** Mark draft / pending_approval rows older than maxAgeMs as expired (G1 demo). */
export function expireStaleAccessApplications(
  maxAgeMs = 7 * 24 * 60 * 60 * 1000,
  now = Date.now()
): AccessApplicationContract[] {
  const expired: AccessApplicationContract[] = [];
  for (const current of applications.values()) {
    if (current.status !== "draft" && current.status !== "pending_approval") {
      continue;
    }
    const updatedAt = Date.parse(current.updatedAt);
    if (Number.isNaN(updatedAt) || now - updatedAt < maxAgeMs) {
      continue;
    }
    const next = accessApplicationSchema.parse({
      ...current,
      status: "expired" as const,
      permissionStatus: permissionFor("expired"),
      updatedAt: new Date(now).toISOString(),
    });
    applications.set(next.id, next);
    expired.push(next);
  }
  return expired;
}

export function editAccessApplication(args: {
  id: string;
  purpose?: AccessApplicationContract["purpose"];
  role?: AccessApplicationContract["role"];
}): AccessMutationResult {
  const current = applications.get(args.id);
  if (!current) return { ok: false, reason: "not_found" };
  if (current.status !== "pending_approval") {
    return { ok: false, reason: "invalid_transition" };
  }
  const updated = accessApplicationSchema.parse({
    ...current,
    purpose: args.purpose ?? current.purpose,
    role: args.role ?? current.role,
    updatedAt: new Date().toISOString(),
  });
  applications.set(updated.id, updated);
  return { ok: true, data: updated };
}

export function submitDraftAccessApplication(id: string): AccessMutationResult {
  const current = applications.get(id);
  if (!current) return { ok: false, reason: "not_found" };
  if (current.status !== "draft") {
    return { ok: false, reason: "invalid_transition" };
  }
  const updated = accessApplicationSchema.parse({
    ...current,
    status: "pending_approval" as const,
    permissionStatus: permissionFor("pending_approval"),
    updatedAt: new Date().toISOString(),
  });
  applications.set(updated.id, updated);
  return { ok: true, data: updated };
}
