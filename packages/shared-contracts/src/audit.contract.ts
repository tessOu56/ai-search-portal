/**
 * Audit log contracts（agentic 階段五先遣：讓 auditLogged 有真實依據）。
 * 事件命名 = 點分動作名（對齊 tool 命名慣例），資源型別小寫底線。
 */

import { z } from "zod";

import { userRoleSchema } from "./access-request.contract.js";

export const auditActionSchema = z
  .string()
  // Bounded dotted identifiers (a.b); not user-controlled free text.
  // eslint-disable-next-line security/detect-unsafe-regex -- closed identifier pattern
  .regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/, "expect dot.separated name");

export const auditOutcomeSchema = z.enum([
  "approved",
  "pending_approval",
  "denied",
  "draft",
  "expired",
  "edited",
]);

export const auditEventSchema = z.object({
  id: z.string().min(1),
  /** ISO 8601 */
  at: z.string().min(1),
  action: auditActionSchema,
  actor: z.object({ role: userRoleSchema }),
  resource: z.object({
    type: z.string().min(1),
    id: z.string().min(1),
  }),
  decisionId: z.string().min(1),
  requestId: z.string().min(1).optional(),
  outcome: auditOutcomeSchema,
  requireAudit: z.boolean(),
  reasons: z.array(z.string()),
});

export type AuditEventContract = z.infer<typeof auditEventSchema>;

export const listAuditEventsResponseSchema = z.object({
  data: z.array(auditEventSchema),
  total: z.number().int().nonnegative(),
});
