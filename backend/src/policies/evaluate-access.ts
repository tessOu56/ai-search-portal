import { randomUUID } from "node:crypto";

import {
  type PolicyDecisionContract,
  policyDecisionSchema,
} from "@ai-search-portal/contracts";

import { getMetadataAsset } from "../store/metadata.js";

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

/** In-process policy evaluator mirroring specs/policies/access-request.rego */
export function evaluateAccessInProcess(
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

export async function evaluateAccess(
  params: EvaluateAccessInput
): Promise<PolicyDecisionContract> {
  const asset = getMetadataAsset(params.assetId, params.packId);
  if (!asset) {
    throw new Error("Asset not found");
  }

  const role = params.role ?? "analyst";
  const policyInput: PolicyInput = {
    user: { role },
    purpose: params.purpose,
    dataset: {
      classification: asset.classification,
      fields: (asset.columns ?? []).map((c) => ({
        name: c.name,
        sensitive: c.sensitive,
      })),
    },
  };

  const opaUrl = process.env.OPA_URL?.trim();
  let partial: Omit<PolicyDecisionContract, "decision_id">;

  if (opaUrl) {
    const { queryOpa } = await import("./opa-client.js");
    partial = await queryOpa(opaUrl, policyInput);
  } else {
    partial = evaluateAccessInProcess(policyInput);
  }

  return policyDecisionSchema.parse({
    ...partial,
    decision_id: randomUUID(),
  });
}
