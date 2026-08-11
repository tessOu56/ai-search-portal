/**
 * Metadata access request + OPA policy decision contracts.
 * Domain SSOT: specs/domain/metadata-access.yaml (T-2026-023 G1).
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

/** UI mock persona — not an OPA role. */
export const governanceSessionRoleSchema = z.enum([
  "requester",
  "owner",
  "admin",
]);

export type GovernanceSessionRole = z.infer<typeof governanceSessionRoleSchema>;

/**
 * Lifecycle SSOT. Ticket aliases: submitted→pending_approval, rejected→denied.
 * `cancelled` = requester withdrew while pending (T-186).
 */
export const accessRequestLifecycleStatusSchema = z.enum([
  "draft",
  "pending_approval",
  "approved",
  "denied",
  "expired",
  "cancelled",
]);

export type AccessRequestLifecycleStatus = z.infer<
  typeof accessRequestLifecycleStatusSchema
>;

export const accessPermissionStatusSchema = z.enum([
  "none",
  "pending",
  "granted",
  "revoked",
]);

export type AccessPermissionStatus = z.infer<
  typeof accessPermissionStatusSchema
>;

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
  /** Optional requester label for my-apis tracking (mock). */
  requesterId: z.string().min(1).optional(),
  /** Persist as draft without submitting for approval (G1 lifecycle). */
  asDraft: z.boolean().optional(),
});

export const evaluateAccessResponseSchema = z.object({
  data: policyDecisionSchema,
});

export const submitAccessResponseSchema = z.object({
  data: z.object({
    requestId: z.string(),
    status: accessRequestLifecycleStatusSchema,
    decision: policyDecisionSchema,
    auditLogged: z.boolean(),
  }),
});

export const accessApplicationSchema = z.object({
  id: z.string(),
  assetId: z.string(),
  assetName: z.string(),
  purpose: accessPurposeSchema,
  role: userRoleSchema,
  requesterId: z.string(),
  status: accessRequestLifecycleStatusSchema,
  permissionStatus: accessPermissionStatusSchema,
  owner: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  decision: policyDecisionSchema.optional(),
  termsAccepted: z.array(z.string()).optional(),
});

export type AccessApplicationContract = z.infer<typeof accessApplicationSchema>;

export const listAccessApplicationsResponseSchema = z.object({
  data: z.array(accessApplicationSchema),
});

export const reviewAccessRequestSchema = z
  .object({
    decision: z.enum(["approved", "denied", "edited"]),
    reviewerId: z.string().min(1).optional(),
    purpose: accessPurposeSchema.optional(),
    role: userRoleSchema.optional(),
  })
  .superRefine((val, ctx) => {
    if (val.decision === "edited" && !val.purpose && !val.role) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "edited requires purpose and/or role",
        path: ["purpose"],
      });
    }
  });

export const reviewAccessResponseSchema = z.object({
  data: accessApplicationSchema,
});

/** Typed governance API errors (validation | deny | HITL | invalid transition). */
export const governancePolicyErrorCodeSchema = z.enum([
  "ACCESS_DENIED",
  "HITL_REQUIRED",
  "INVALID_TRANSITION",
  "NOT_FOUND",
  "VALIDATION_ERROR",
]);

export type GovernancePolicyErrorCode = z.infer<
  typeof governancePolicyErrorCodeSchema
>;

export const governancePolicyErrorSchema = z.object({
  error: z.string().min(1),
  code: governancePolicyErrorCodeSchema.optional(),
  decision: policyDecisionSchema.optional(),
  toolError: z
    .object({
      code: z.literal("HITL_REQUIRED"),
      message: z.string().min(1),
      tool: z.string().min(1).optional(),
      riskLevel: z.enum(["low", "medium", "high"]).optional(),
    })
    .optional(),
});

export type GovernancePolicyError = z.infer<typeof governancePolicyErrorSchema>;

export const submitDraftAccessRequestSchema = z.object({
  /** Re-evaluate policy before promoting draft → pending_approval. */
  approved: z.boolean().optional(),
});

export const cancelAccessRequestSchema = z.object({
  reason: z.string().min(1).optional(),
});

export const cancelAccessResponseSchema = z.object({
  data: accessApplicationSchema,
});

/** Build a HITL 422 body matching governancePolicyErrorSchema. */
export function governanceHitlError(
  message = "Human approval required",
  decision?: z.infer<typeof policyDecisionSchema>,
  tool = "access_request.submit"
): z.infer<typeof governancePolicyErrorSchema> {
  return governancePolicyErrorSchema.parse({
    error: message,
    code: "HITL_REQUIRED",
    decision,
    toolError: {
      code: "HITL_REQUIRED",
      message,
      tool,
      riskLevel: "high",
    },
  });
}

export function governanceDeniedError(
  message = "Access denied by policy",
  decision?: z.infer<typeof policyDecisionSchema>
): z.infer<typeof governancePolicyErrorSchema> {
  return governancePolicyErrorSchema.parse({
    error: message,
    code: "ACCESS_DENIED",
    decision,
  });
}

export function governanceInvalidTransitionError(
  message: string
): z.infer<typeof governancePolicyErrorSchema> {
  return governancePolicyErrorSchema.parse({
    error: message,
    code: "INVALID_TRANSITION",
  });
}
