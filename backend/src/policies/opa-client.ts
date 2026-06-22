import type { PolicyDecisionContract } from "@ai-search-portal/contracts";
import { policyDecisionSchema } from "@ai-search-portal/contracts";

type PolicyInput = {
  user: { role: string };
  purpose: string;
  dataset: {
    classification: string;
    fields: { name: string; sensitive?: boolean }[];
  };
};

export async function queryOpa(
  opaUrl: string,
  input: PolicyInput
): Promise<Omit<PolicyDecisionContract, "decision_id">> {
  const base = opaUrl.replace(/\/$/, "");
  const res = await fetch(`${base}/v1/data/access`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
  });

  if (!res.ok) {
    throw new Error(`OPA HTTP ${res.status}`);
  }

  const body = (await res.json()) as {
    result?: {
      allow?: boolean;
      need_approval?: boolean;
      mask_fields?: string[];
      require_audit?: boolean;
      reasons?: string[];
    };
  };

  const result = body.result ?? {};
  return policyDecisionSchema.omit({ decision_id: true }).parse({
    allow: result.allow ?? false,
    need_approval: result.need_approval ?? false,
    mask_fields: result.mask_fields ?? [],
    require_audit: result.require_audit ?? false,
    reasons: result.reasons ?? [],
  });
}
