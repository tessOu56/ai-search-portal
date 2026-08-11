/**
 * Pure in-process policy evaluation (mirrors specs/policies/access-request.rego).
 * Adapters wrap this with asset lookup + decision_id assignment.
 */

export type PolicyEvaluationInput = {
  user: { role: string };
  purpose: string;
  dataset: {
    classification: string;
    fields: { name: string; sensitive?: boolean }[];
  };
};

export type PolicyEvaluationResult = {
  allow: boolean;
  need_approval: boolean;
  mask_fields: string[];
  require_audit: boolean;
  reasons: string[];
};

/** Pure policy evaluator — no I/O, no UUID. */
export interface PolicyEvaluator {
  evaluate(input: PolicyEvaluationInput): PolicyEvaluationResult;
}

export function evaluateAccessPolicy(
  input: PolicyEvaluationInput
): PolicyEvaluationResult {
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

export const defaultPolicyEvaluator: PolicyEvaluator = {
  evaluate: evaluateAccessPolicy,
};
