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

import governanceApplicationsV1 from "~/test/datasets/v1/governance-applications.json";

export type { AccessMutationFailure, AccessMutationResult };

/**
 * Realistic governance demo seed (T-2026-024 / T-2026-248). Lazily applied on
 * first `listAccessApplications()` call so pure unit tests that never list
 * are unaffected. Fixture SSOT: app/test/datasets/v1/governance-applications.json
 */
const GOVERNANCE_SEED_APPLICATIONS: AccessApplicationContract[] =
  governanceApplicationsV1.map((row) => accessApplicationSchema.parse(row));

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
