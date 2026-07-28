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
 */
export const accessRequestLifecycleStatusSchema = z.enum([
  "draft",
  "pending_approval",
  "approved",
  "denied",
  "expired",
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

export const reviewAccessRequestSchema = z.object({
  decision: z.enum(["approved", "denied"]),
  reviewerId: z.string().min(1).optional(),
});

export const reviewAccessResponseSchema = z.object({
  data: accessApplicationSchema,
});
