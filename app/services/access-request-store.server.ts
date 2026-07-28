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
