/**
 * Hono adapter over shared governance-domain store (T-2026-201).
 */

import type {
  AccessApplicationContract,
  AccessRequestLifecycleStatus,
  PolicyDecisionContract,
} from "@ai-search-portal/contracts";
import {
  type AccessMutationResult,
  createAccessRequestStore,
} from "@ai-search-portal/governance-domain";

const store = createAccessRequestStore();

export function resetHonoAccessStore(): void {
  store.reset({ keepSeedSuppressed: true });
}

export function rememberIdempotency(key: string, requestId: string): void {
  store.rememberIdempotencyKey(key, requestId);
}

export function resolveIdempotency(
  key: string
): AccessApplicationContract | null {
  return store.resolveIdempotencyKey(key);
}

export function listApplications(filter?: {
  requesterId?: string;
  pendingOnly?: boolean;
}): AccessApplicationContract[] {
  return store.list(filter);
}

export function getApplication(id: string): AccessApplicationContract | null {
  return store.get(id);
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
  return store.create(args);
}

export function reviewApplication(args: {
  id: string;
  decision: "approved" | "denied";
}): AccessMutationResult {
  return store.review(args);
}

export function editApplication(args: {
  id: string;
  purpose?: AccessApplicationContract["purpose"];
  role?: AccessApplicationContract["role"];
}): AccessMutationResult {
  return store.edit(args);
}

export function submitDraft(id: string): AccessMutationResult {
  return store.submitDraft(id);
}

export function cancelApplication(id: string): AccessMutationResult {
  return store.cancel({ id });
}
