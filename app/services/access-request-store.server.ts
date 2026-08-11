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

export function resetAccessApplicationStore(): void {
  applications.clear();
  idempotencyKeys.clear();
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
