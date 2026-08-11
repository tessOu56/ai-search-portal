/**
 * In-memory access application store for Hono reference API (T-186 align with BFF).
 */

import type {
  AccessApplicationContract,
  AccessPermissionStatus,
  AccessRequestLifecycleStatus,
  PolicyDecisionContract,
} from "@ai-search-portal/contracts";
import { accessApplicationSchema } from "@ai-search-portal/contracts";

const applications = new Map<string, AccessApplicationContract>();
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

export function resetHonoAccessStore(): void {
  applications.clear();
  idempotencyKeys.clear();
}

export function rememberIdempotency(key: string, requestId: string): void {
  idempotencyKeys.set(key, requestId);
}

export function resolveIdempotency(
  key: string
): AccessApplicationContract | null {
  const id = idempotencyKeys.get(key);
  if (!id) return null;
  return applications.get(id) ?? null;
}

export function listApplications(filter?: {
  requesterId?: string;
  pendingOnly?: boolean;
}): AccessApplicationContract[] {
  let rows = [...applications.values()];
  if (filter?.requesterId) {
    rows = rows.filter((r) => r.requesterId === filter.requesterId);
  }
  if (filter?.pendingOnly) {
    rows = rows.filter((r) => r.status === "pending_approval");
  }
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getApplication(id: string): AccessApplicationContract | null {
  return applications.get(id) ?? null;
}

export function createApplication(args: {
  id: string;
  assetId: string;
  assetName: string;
  purpose: AccessApplicationContract["purpose"];
  role: AccessApplicationContract["role"];
  requesterId: string;
  status: AccessRequestLifecycleStatus;
  owner: string;
  decision?: PolicyDecisionContract;
}): AccessApplicationContract {
  const now = new Date().toISOString();
  const record = accessApplicationSchema.parse({
    ...args,
    permissionStatus: permissionFor(args.status),
    createdAt: now,
    updatedAt: now,
  });
  applications.set(record.id, record);
  return record;
}

export function reviewApplication(args: {
  id: string;
  decision: "approved" | "denied";
}):
  | { ok: true; data: AccessApplicationContract }
  | { ok: false; reason: "not_found" | "invalid_transition" } {
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

export function submitDraft(
  id: string
):
  | { ok: true; data: AccessApplicationContract }
  | { ok: false; reason: "not_found" | "invalid_transition" } {
  const current = applications.get(id);
  if (!current) return { ok: false, reason: "not_found" };
  if (current.status !== "draft") {
    return { ok: false, reason: "invalid_transition" };
  }
  const updated = accessApplicationSchema.parse({
    ...current,
    status: "pending_approval",
    permissionStatus: permissionFor("pending_approval"),
    updatedAt: new Date().toISOString(),
  });
  applications.set(updated.id, updated);
  return { ok: true, data: updated };
}

export function cancelApplication(
  id: string
):
  | { ok: true; data: AccessApplicationContract }
  | { ok: false; reason: "not_found" | "invalid_transition" } {
  const current = applications.get(id);
  if (!current) return { ok: false, reason: "not_found" };
  if (current.status !== "pending_approval" && current.status !== "draft") {
    return { ok: false, reason: "invalid_transition" };
  }
  const updated = accessApplicationSchema.parse({
    ...current,
    status: "cancelled",
    permissionStatus: permissionFor("cancelled"),
    updatedAt: new Date().toISOString(),
  });
  applications.set(updated.id, updated);
  return { ok: true, data: updated };
}
