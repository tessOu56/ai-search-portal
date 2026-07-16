/**
 * Audit log minimal store — parity port of app/services/audit-log.server.ts
 * so the reference HTTP API (ai-search-api) satisfies the OpenAPI
 * `GET /api/audit` contract and `auditLogged` reflects a real write.
 * In-memory by default; set AUDIT_LOG_PATH to also append JSONL.
 * Durable storage (DB + pagination) remains Phase 5 / Gate 3 work.
 */

import { randomUUID } from "node:crypto";
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

import {
  type AuditEventContract,
  auditEventSchema,
} from "@ai-search-portal/contracts";

const memoryStore: AuditEventContract[] = [];

function tryAppendJsonl(event: AuditEventContract): void {
  const path = process.env.AUDIT_LOG_PATH?.trim();
  if (!path) return;
  // AUDIT_LOG_PATH is operator-configured; not user input.
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- env path
  mkdirSync(dirname(path), { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- env path
  appendFileSync(path, `${JSON.stringify(event)}\n`, "utf8");
}

export type AppendAuditInput = Omit<AuditEventContract, "id" | "at">;

/** Append an audit event; returns the stored event, or null on failure. */
export function appendAuditEvent(
  input: AppendAuditInput
): AuditEventContract | null {
  try {
    const event = auditEventSchema.parse({
      ...input,
      id: randomUUID(),
      at: new Date().toISOString(),
    });
    memoryStore.push(event);
    tryAppendJsonl(event);
    return event;
  } catch {
    return null;
  }
}

/** List events newest-first, bounded to [1, 200]. */
export function listAuditEvents(limit = 50): {
  data: AuditEventContract[];
  total: number;
} {
  const bounded = Math.max(1, Math.min(limit, 200));
  return {
    data: [...memoryStore].reverse().slice(0, bounded),
    total: memoryStore.length,
  };
}

/** Test helper: clear the in-memory store. */
export function resetAuditLogForTest(): void {
  memoryStore.length = 0;
}
