/**
 * Metadata access request + OPA policy decision contracts.
 */

import { z } from "zod";

export const accessPurposeSchema = z.enum([
  "analytics",
  "marketing",
  "operations",
]);

export type AccessPurpose = z.infer<typeof accessPurposeSchema>;

export const userRoleSchema = z.enum(["analyst", "data_admin", "engineer"]);

export type UserRole = z.infer<typeof userRoleSchema>;

export const policyDecisionSchema = z.object({
  allow: z.boolean(),
  need_approval: z.boolean(),
  mask_fields: z.array(z.string()),
  require_audit: z.boolean(),
  decision_id: z.string(),
  reasons: z.array(z.string()),
});

export type PolicyDecisionContract = z.infer<typeof policyDecisionSchema>;

export const metadataAccessEvaluateRequestSchema = z.object({
  assetId: z.string().min(1),
  purpose: accessPurposeSchema,
  role: userRoleSchema.optional(),
});

export const metadataAccessRequestSchema = z.object({
  assetId: z.string().min(1),
  purpose: accessPurposeSchema,
  role: userRoleSchema.optional(),
  approved: z.boolean().optional(),
});

export const evaluateAccessResponseSchema = z.object({
  data: policyDecisionSchema,
});

export const submitAccessResponseSchema = z.object({
  data: z.object({
    requestId: z.string(),
    status: z.enum(["approved", "pending_approval", "denied"]),
    decision: policyDecisionSchema,
    auditLogged: z.boolean(),
  }),
});
