import { randomUUID } from "node:crypto";

import {
  type PolicyDecisionContract,
  policyDecisionSchema,
} from "@ai-search-portal/contracts";

import { getMetadataAsset } from "~/services/metadata.server";

export type EvaluateAccessInput = {
  assetId: string;
  purpose: "analytics" | "marketing" | "operations";
  role?: "analyst" | "data_admin" | "engineer";
  packId?: string;
};

type PolicyInput = {
  user: { role: string };
  purpose: string;
  dataset: {
    classification: string;
    fields: { name: string; sensitive?: boolean }[];
  };
};

function evaluateAccessInProcess(
  input: PolicyInput
): Omit<PolicyDecisionContract, "decision_id"> {
  const role = input.user.role;
  const classification = input.dataset.classification;
  const purpose = input.purpose;

  const mask_fields = input.dataset.fields
    .filter((f) => f.sensitive === true)
    .map((f) => f.name);

  let allow = false;
  let need_approval = false;
  const require_audit = classification === "confidential";
  const reasons: string[] = [];

  if (role === "data_admin") {
    allow = true;
    reasons.push("policy: data_admin allow");
  } else if (role === "engineer" && classification === "internal") {
    allow = true;
    reasons.push("policy: engineer_internal allow");
  }

  if (classification === "PII" && role === "analyst") {
    need_approval = true;
    reasons.push("policy: analyst requires approval for PII datasets");
  }

  if (purpose === "marketing" && classification === "PII") {
    need_approval = true;
    reasons.push("policy: marketing purpose on PII requires approval");
  }

  if (require_audit) {
    reasons.push("policy: confidential classification requires audit log");
  }

  if (!allow && !need_approval && reasons.length === 0) {
    reasons.push("policy: default deny");
  }

  return {
    allow,
    need_approval,
    mask_fields,
    require_audit,
    reasons,
  };
}

export function evaluateMetadataAccess(
  params: EvaluateAccessInput
): PolicyDecisionContract {
  const asset = getMetadataAsset(params.assetId, params.packId);
  if (!asset) {
    throw new Error("Asset not found");
  }

  const role = params.role ?? "analyst";
  const partial = evaluateAccessInProcess({
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
}) {
  const decision = evaluateMetadataAccess({
    assetId: args.assetId,
    purpose: args.purpose,
    role: args.role,
    packId: args.packId,
  });

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

  return {
    ok: true as const,
    status: 202,
    data: {
      requestId: randomUUID(),
      status,
      decision,
      auditLogged: decision.require_audit,
    },
  };
}
