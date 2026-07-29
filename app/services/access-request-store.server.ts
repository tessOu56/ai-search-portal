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
      return "revoked";
    default:
      return "none";
  }
}

export function resetAccessApplicationStore(): void {
  applications.clear();
}

export function listAccessApplications(filter?: {
  requesterId?: string;
  status?: AccessRequestLifecycleStatus;
  pendingOnly?: boolean;
}): AccessApplicationContract[] {
  let rows = [...applications.values()];
  if (filter?.requesterId) {
    rows = rows.filter((r) => r.requesterId === filter.requesterId);
  }
  if (filter?.status) {
    rows = rows.filter((r) => r.status === filter.status);
  }
  if (filter?.pendingOnly) {
    rows = rows.filter((r) => r.status === "pending_approval");
  }
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
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

export function reviewAccessApplication(args: {
  id: string;
  decision: "approved" | "denied";
}): AccessApplicationContract | null {
  const current = applications.get(args.id);
  if (!current) return null;
  if (current.status !== "pending_approval") {
    return current;
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
  return updated;
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

export function submitDraftAccessApplication(
  id: string
): AccessApplicationContract | null {
  const current = applications.get(id);
  if (!current || current.status !== "draft") return null;
  const updated = accessApplicationSchema.parse({
    ...current,
    status: "pending_approval" as const,
    permissionStatus: permissionFor("pending_approval"),
    updatedAt: new Date().toISOString(),
  });
  applications.set(updated.id, updated);
  return updated;
}

export function editAccessApplication(args: {
  id: string;
  purpose?: AccessApplicationContract["purpose"];
  role?: AccessApplicationContract["role"];
}): AccessApplicationContract | null {
  const current = applications.get(args.id);
  if (!current || current.status !== "pending_approval") return null;
  const updated = accessApplicationSchema.parse({
    ...current,
    purpose: args.purpose ?? current.purpose,
    role: args.role ?? current.role,
    updatedAt: new Date().toISOString(),
  });
  applications.set(updated.id, updated);
  return updated;
}
