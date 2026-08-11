import { randomUUID } from "node:crypto";

import {
  type PolicyDecisionContract,
  policyDecisionSchema,
} from "@ai-search-portal/contracts";
import {
  evaluateAccessPolicy,
  type PolicyEvaluationInput,
} from "@ai-search-portal/governance-domain";

import { getMetadataAsset } from "../store/metadata.js";

export type EvaluateAccessInput = {
  assetId: string;
  purpose: "analytics" | "marketing" | "operations";
  role?: "analyst" | "data_admin" | "engineer";
  packId?: string;
};

/** In-process policy evaluator mirroring specs/policies/access-request.rego */
export function evaluateAccessInProcess(
  input: PolicyEvaluationInput
): Omit<PolicyDecisionContract, "decision_id"> {
  return evaluateAccessPolicy(input);
}

export async function evaluateAccess(
  params: EvaluateAccessInput
): Promise<PolicyDecisionContract> {
  const asset = getMetadataAsset(params.assetId, params.packId);
  if (!asset) {
    throw new Error("Asset not found");
  }

  const role = params.role ?? "analyst";
  const policyInput: PolicyEvaluationInput = {
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
