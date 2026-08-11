import { randomUUID } from "node:crypto";

import type { PolicyDecisionContract } from "@ai-search-portal/contracts";
import { policyDecisionSchema } from "@ai-search-portal/contracts";
import { evaluateAccessPolicy } from "@ai-search-portal/governance-domain";

import { createAccessApplication } from "~/services/access-request-store.server";
import { appendAuditEvent } from "~/services/audit-log.server";
import { getMetadataAsset } from "~/services/metadata.server";

export type EvaluateAccessInput = {
  assetId: string;
  purpose: "analytics" | "marketing" | "operations";
  role?: "analyst" | "data_admin" | "engineer";
  packId?: string;
};

export function evaluateMetadataAccess(
  params: EvaluateAccessInput
): PolicyDecisionContract {
  const asset = getMetadataAsset(params.assetId, params.packId);
  if (!asset) {
    throw new Error("Asset not found");
  }

  const role = params.role ?? "analyst";
  const partial = evaluateAccessPolicy({
    user: { role },
    purpose: params.purpose,
    dataset: {
      classification: asset.classification,
      fields: (asset.columns ?? []).map((c) => ({
        name: c.name,
        sensitive: c.sensitive,
      })),
    },
  });

  return policyDecisionSchema.parse({
    ...partial,
    decision_id: randomUUID(),
  });
}

export function submitMetadataAccessRequest(args: {
  assetId: string;
  purpose: EvaluateAccessInput["purpose"];
  role?: EvaluateAccessInput["role"];
  approved?: boolean;
  packId?: string;
  requesterId?: string;
  /** When true, persist as draft without submitting for approval. */
  asDraft?: boolean;
}) {
  const decision = evaluateMetadataAccess({
    assetId: args.assetId,
    purpose: args.purpose,
    role: args.role,
    packId: args.packId,
  });

  if (args.asDraft) {
    const requestId = randomUUID();
    const asset = getMetadataAsset(args.assetId, args.packId);
    const role = args.role ?? "analyst";
    const requesterId = args.requesterId ?? `requester:${role}`;
    if (!asset) {
      return {
        ok: false as const,
        status: 404,
        error: "Asset not found",
        decision,
      };
    }
    createAccessApplication({
      id: requestId,
      assetId: args.assetId,
      assetName: asset.name,
      purpose: args.purpose,
      role,
      requesterId,
      status: "draft",
      owner: asset.owner,
      decision,
      termsAccepted: asset.termsOfUse,
    });
    return {
      ok: true as const,
      status: 201,
      data: {
        requestId,
        status: "draft" as const,
        decision,
        auditLogged: false,
      },
    };
  }

  if (decision.need_approval && !args.approved) {
    return {
      ok: false as const,
      status: 422,
      error: "Human approval required",
      decision,
    };
  }

  if (!decision.allow && !decision.need_approval) {
    return {
      ok: false as const,
      status: 403,
      error: "Access denied by policy",
      decision,
    };
  }

  const status =
    decision.need_approval && args.approved
      ? ("pending_approval" as const)
      : decision.allow
        ? ("approved" as const)
        : ("denied" as const);

  const requestId = randomUUID();
  const asset = getMetadataAsset(args.assetId, args.packId);
  const role = args.role ?? "analyst";
  const requesterId = args.requesterId ?? `requester:${role}`;

  if (asset) {
    createAccessApplication({
      id: requestId,
      assetId: args.assetId,
      assetName: asset.name,
      purpose: args.purpose,
      role,
      requesterId,
      status,
      owner: asset.owner,
      decision,
      termsAccepted: asset.termsOfUse,
    });
  }

  // auditLogged = 事件真實寫入與否（原為空頭布林，2026-07-09 起實作最小落盤）。
  const auditLogged = decision.require_audit
    ? appendAuditEvent({
        action: "access_request.submit",
        actor: { role },
        resource: { type: "metadata_asset", id: args.assetId },
        decisionId: decision.decision_id,
        requestId,
        outcome: status,
        requireAudit: decision.require_audit,
        reasons: decision.reasons,
      }) !== null
    : false;

  return {
    ok: true as const,
    status: 202,
    data: {
      requestId,
      status,
      decision,
      auditLogged,
    },
  };
}
