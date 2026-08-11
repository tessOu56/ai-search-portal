/**
 * Access-request repository interface + in-memory implementation.
 * Remix / Hono adapters wrap a store instance — no duplicated transition logic.
 */

import type {
  AccessApplicationContract,
  AccessRequestLifecycleStatus,
  PolicyDecisionContract,
} from "@ai-search-portal/contracts";
import { accessApplicationSchema } from "@ai-search-portal/contracts";

import {
  createIdempotencyIndex,
  type IdempotencyIndex,
} from "./idempotency.js";
import { permissionFor } from "./permission.js";
import {
  canTransition,
  nextStatus,
  reviewActionForDecision,
} from "./transitions.js";

export type AccessMutationFailure = "not_found" | "invalid_transition";

export type AccessMutationResult =
  | { ok: true; data: AccessApplicationContract }
  | { ok: false; reason: AccessMutationFailure };

export type AccessApplicationListFilter = {
  requesterId?: string;
  assetId?: string;
  status?: AccessRequestLifecycleStatus;
  pendingOnly?: boolean;
};

export type CreateAccessApplicationArgs = {
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
};

export type EditAccessApplicationArgs = {
  id: string;
  purpose?: AccessApplicationContract["purpose"];
  role?: AccessApplicationContract["role"];
};

/** Persistence + query surface shared by adapters. */
export interface AccessRequestRepository {
  get(id: string): AccessApplicationContract | null;
  list(filter?: AccessApplicationListFilter): AccessApplicationContract[];
  save(record: AccessApplicationContract): void;
  deleteAll(): void;
}

export type AccessRequestStore = {
  repository: AccessRequestRepository;
  idempotency: IdempotencyIndex;
  /** When true, seed is considered already applied (tests / empty reset). */
  markSeedApplied(): void;
  ensureSeed(): void;
  setSeed(rows: AccessApplicationContract[]): void;
  rememberIdempotencyKey(key: string, requestId: string): void;
  resolveIdempotencyKey(key: string): AccessApplicationContract | null;
  list(filter?: AccessApplicationListFilter): AccessApplicationContract[];
  get(id: string): AccessApplicationContract | null;
  create(args: CreateAccessApplicationArgs): AccessApplicationContract;
  review(args: {
    id: string;
    decision: "approved" | "denied";
  }): AccessMutationResult;
  cancel(args: { id: string }): AccessMutationResult;
  edit(args: EditAccessApplicationArgs): AccessMutationResult;
  submitDraft(id: string): AccessMutationResult;
  expireStale(maxAgeMs?: number, now?: number): AccessApplicationContract[];
  reset(options?: { keepSeedSuppressed?: boolean }): void;
};

export type CreateAccessRequestStoreOptions = {
  seed?: AccessApplicationContract[];
  /** Lazy-apply seed on first list() (Remix demo default). */
  lazySeed?: boolean;
  now?: () => Date;
};

class InMemoryAccessRequestRepository implements AccessRequestRepository {
  private readonly applications = new Map<string, AccessApplicationContract>();

  get(id: string): AccessApplicationContract | null {
    return this.applications.get(id) ?? null;
  }

  list(filter?: AccessApplicationListFilter): AccessApplicationContract[] {
    let rows = [...this.applications.values()];
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

  save(record: AccessApplicationContract): void {
    this.applications.set(record.id, record);
  }

  deleteAll(): void {
    this.applications.clear();
  }
}

export function createAccessRequestStore(
  options: CreateAccessRequestStoreOptions = {}
): AccessRequestStore {
  const repository = new InMemoryAccessRequestRepository();
  const idempotency = createIdempotencyIndex();
  const nowFn = options.now ?? (() => new Date());
  let seedRows =
    options.seed?.map((row) => accessApplicationSchema.parse(row)) ?? [];
  let seedApplied = seedRows.length === 0 || options.lazySeed !== true;
  const lazySeed = options.lazySeed === true;

  if (!lazySeed && seedRows.length > 0) {
    for (const row of seedRows) {
      repository.save(row);
    }
    seedApplied = true;
  }

  function ensureSeed(): void {
    if (!lazySeed || seedApplied) return;
    seedApplied = true;
    for (const row of seedRows) {
      repository.save(row);
    }
  }

  function isoNow(ms?: number): string {
    return ms === undefined
      ? nowFn().toISOString()
      : new Date(ms).toISOString();
  }

  function mutateStatus(
    current: AccessApplicationContract,
    action: Parameters<typeof canTransition>[1],
    patch?: Partial<AccessApplicationContract>
  ): AccessMutationResult {
    if (!canTransition(current.status, action)) {
      return { ok: false, reason: "invalid_transition" };
    }
    const status = nextStatus(current.status, action);
    if (!status) {
      return { ok: false, reason: "invalid_transition" };
    }
    const updated = accessApplicationSchema.parse({
      ...current,
      ...patch,
      status,
      permissionStatus: permissionFor(status),
      updatedAt: isoNow(),
    });
    repository.save(updated);
    return { ok: true, data: updated };
  }

  return {
    repository,
    idempotency,
    markSeedApplied(): void {
      seedApplied = true;
    },
    ensureSeed,
    setSeed(rows: AccessApplicationContract[]): void {
      seedRows = rows.map((row) => accessApplicationSchema.parse(row));
      seedApplied = false;
    },
    rememberIdempotencyKey(key: string, requestId: string): void {
      idempotency.remember(key, requestId);
    },
    resolveIdempotencyKey(key: string): AccessApplicationContract | null {
      const id = idempotency.resolve(key);
      if (!id) return null;
      return repository.get(id);
    },
    list(filter?: AccessApplicationListFilter): AccessApplicationContract[] {
      ensureSeed();
      return repository.list(filter);
    },
    get(id: string): AccessApplicationContract | null {
      return repository.get(id);
    },
    create(args: CreateAccessApplicationArgs): AccessApplicationContract {
      const now = isoNow();
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
      repository.save(record);
      return record;
    },
    review(args: {
      id: string;
      decision: "approved" | "denied";
    }): AccessMutationResult {
      const current = repository.get(args.id);
      if (!current) return { ok: false, reason: "not_found" };
      return mutateStatus(current, reviewActionForDecision(args.decision));
    },
    cancel(args: { id: string }): AccessMutationResult {
      const current = repository.get(args.id);
      if (!current) return { ok: false, reason: "not_found" };
      return mutateStatus(current, "cancel");
    },
    edit(args: EditAccessApplicationArgs): AccessMutationResult {
      const current = repository.get(args.id);
      if (!current) return { ok: false, reason: "not_found" };
      if (!canTransition(current.status, "edit")) {
        return { ok: false, reason: "invalid_transition" };
      }
      const updated = accessApplicationSchema.parse({
        ...current,
        purpose: args.purpose ?? current.purpose,
        role: args.role ?? current.role,
        updatedAt: isoNow(),
      });
      repository.save(updated);
      return { ok: true, data: updated };
    },
    submitDraft(id: string): AccessMutationResult {
      const current = repository.get(id);
      if (!current) return { ok: false, reason: "not_found" };
      return mutateStatus(current, "submit");
    },
    expireStale(
      maxAgeMs = 7 * 24 * 60 * 60 * 1000,
      now = Date.now()
    ): AccessApplicationContract[] {
      const expired: AccessApplicationContract[] = [];
      for (const current of repository.list()) {
        if (!canTransition(current.status, "expire")) continue;
        const updatedAt = Date.parse(current.updatedAt);
        if (Number.isNaN(updatedAt) || now - updatedAt < maxAgeMs) continue;
        const next = accessApplicationSchema.parse({
          ...current,
          status: "expired" as const,
          permissionStatus: permissionFor("expired"),
          updatedAt: isoNow(now),
        });
        repository.save(next);
        expired.push(next);
      }
      return expired;
    },
    reset(options?: { keepSeedSuppressed?: boolean }): void {
      repository.deleteAll();
      idempotency.clear();
      if (options?.keepSeedSuppressed !== false) {
        seedApplied = true;
      } else {
        seedApplied = !lazySeed;
        if (!lazySeed && seedRows.length > 0) {
          for (const row of seedRows) {
            repository.save(row);
          }
          seedApplied = true;
        }
      }
    },
  };
}
