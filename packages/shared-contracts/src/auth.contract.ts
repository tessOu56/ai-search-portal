/**
 * Server-side principal + auth error envelope.
 * Identity is never taken from the request body; tokens map to principals.
 */

import { z } from "zod";

import { userRoleSchema } from "./access-request.contract.js";

export const authRoleSchema = z.enum(["admin", "reviewer", "requester"]);

export type AuthRole = z.infer<typeof authRoleSchema>;

export const principalSchema = z.object({
  id: z.string().min(1),
  authRole: authRoleSchema,
  opaRole: userRoleSchema,
});

export type Principal = z.infer<typeof principalSchema>;

export const authErrorCodeSchema = z.enum([
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "AUTH_NOT_CONFIGURED",
  "RATE_LIMITED",
  "PAYLOAD_TOO_LARGE",
  "SEPARATION_OF_DUTY",
]);

export type AuthErrorCode = z.infer<typeof authErrorCodeSchema>;

export const authErrorResponseSchema = z.object({
  error: z.string().min(1),
  code: authErrorCodeSchema,
});

export type AuthErrorResponse = z.infer<typeof authErrorResponseSchema>;

export const sessionResponseSchema = z.object({
  data: principalSchema,
});

export type SessionResponse = z.infer<typeof sessionResponseSchema>;
