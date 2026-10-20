import type { AuthRole, Principal } from "@ai-search-portal/contracts";

import {
  authenticateRequest,
  authFailureResponse,
  requireAuthRole,
} from "~/services/auth.server";
import {
  consumeRateLimit,
  type RateLimitBucket,
  rateLimitResponse,
} from "~/services/rate-limit.server";

export function rejectIfRateLimited(
  request: Request,
  bucket: RateLimitBucket
): Response | null {
  const decision = consumeRateLimit(request, bucket);
  if (!decision.ok) return rateLimitResponse(decision);
  return null;
}

export function requirePrincipal(
  request: Request,
  roles?: readonly AuthRole[]
): { user: Principal } | { response: Response } {
  const auth = authenticateRequest(request);
  if (!auth.ok) return { response: authFailureResponse(auth) };
  if (roles) {
    const gate = requireAuthRole(auth.user, roles);
    if (!gate.ok) return { response: authFailureResponse(gate) };
  }
  return { user: auth.user };
}
