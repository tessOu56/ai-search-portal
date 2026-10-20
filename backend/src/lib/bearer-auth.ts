/**
 * Fail-closed Bearer auth for the Hono metadata access-request API.
 * ADMIN_API_TOKEN is required; optional reviewer/requester tokens map extra principals.
 */

import { timingSafeEqual } from "node:crypto";

import {
  type Principal,
  principalSchema,
  type UserRole,
} from "@ai-search-portal/contracts";
import type { Context, Next } from "hono";

type AuthEnv = { Variables: { user: Principal } };

type TokenEnvKey =
  "ADMIN_API_TOKEN" | "REVIEWER_API_TOKEN" | "REQUESTER_API_TOKEN";
type IdEnvKey = "ADMIN_ID" | "REVIEWER_ID" | "REQUESTER_ID";
type OpaEnvKey = "ADMIN_OPA_ROLE" | "REVIEWER_OPA_ROLE" | "REQUESTER_OPA_ROLE";
type EnvLookupKey = TokenEnvKey | IdEnvKey | OpaEnvKey;

type TokenBinding = {
  envKey: TokenEnvKey;
  authRole: Principal["authRole"];
  defaultId: string;
  defaultOpaRole: UserRole;
  idEnvKey: IdEnvKey;
  opaEnvKey: OpaEnvKey;
};

const TOKEN_BINDINGS: TokenBinding[] = [
  {
    envKey: "ADMIN_API_TOKEN",
    authRole: "admin",
    defaultId: "principal:admin",
    defaultOpaRole: "data_admin",
    idEnvKey: "ADMIN_ID",
    opaEnvKey: "ADMIN_OPA_ROLE",
  },
  {
    envKey: "REVIEWER_API_TOKEN",
    authRole: "reviewer",
    defaultId: "principal:reviewer",
    defaultOpaRole: "data_admin",
    idEnvKey: "REVIEWER_ID",
    opaEnvKey: "REVIEWER_OPA_ROLE",
  },
  {
    envKey: "REQUESTER_API_TOKEN",
    authRole: "requester",
    defaultId: "principal:requester",
    defaultOpaRole: "analyst",
    idEnvKey: "REQUESTER_ID",
    opaEnvKey: "REQUESTER_OPA_ROLE",
  },
];

function envTrim(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function readToken(envKey: EnvLookupKey): string | undefined {
  switch (envKey) {
    case "ADMIN_API_TOKEN":
      return envTrim(process.env.ADMIN_API_TOKEN);
    case "REVIEWER_API_TOKEN":
      return envTrim(process.env.REVIEWER_API_TOKEN);
    case "REQUESTER_API_TOKEN":
      return envTrim(process.env.REQUESTER_API_TOKEN);
    case "ADMIN_ID":
      return envTrim(process.env.ADMIN_ID);
    case "REVIEWER_ID":
      return envTrim(process.env.REVIEWER_ID);
    case "REQUESTER_ID":
      return envTrim(process.env.REQUESTER_ID);
    case "ADMIN_OPA_ROLE":
      return envTrim(process.env.ADMIN_OPA_ROLE);
    case "REVIEWER_OPA_ROLE":
      return envTrim(process.env.REVIEWER_OPA_ROLE);
    case "REQUESTER_OPA_ROLE":
      return envTrim(process.env.REQUESTER_OPA_ROLE);
    default:
      return undefined;
  }
}

function parseOpaRole(raw: string | undefined, fallback: UserRole): UserRole {
  if (raw === "analyst" || raw === "data_admin" || raw === "engineer") {
    return raw;
  }
  return fallback;
}

function secureCompare(left: string, right: string): boolean {
  const leftBuf = Buffer.from(left);
  const rightBuf = Buffer.from(right);
  const len = Math.max(leftBuf.length, rightBuf.length, 1);
  const paddedLeft = Buffer.alloc(len);
  const paddedRight = Buffer.alloc(len);
  leftBuf.copy(paddedLeft);
  rightBuf.copy(paddedRight);
  return (
    timingSafeEqual(paddedLeft, paddedRight) &&
    leftBuf.length === rightBuf.length
  );
}

function parseBearer(header: string | undefined): string | undefined {
  if (!header) return undefined;
  const match = /^Bearer\s+(\S+)/i.exec(header.trim());
  const token = match?.[1]?.trim();
  return token ? token : undefined;
}

export function resolveBearerPrincipal(authorization: string | undefined):
  | { ok: true; user: Principal }
  | {
      ok: false;
      status: 401 | 503;
      error: string;
      code: "UNAUTHENTICATED" | "AUTH_NOT_CONFIGURED";
    } {
  if (!readToken("ADMIN_API_TOKEN")) {
    return {
      ok: false,
      status: 503,
      error: "Admin API token is not configured",
      code: "AUTH_NOT_CONFIGURED",
    };
  }
  const presented = parseBearer(authorization);
  if (!presented) {
    return {
      ok: false,
      status: 401,
      error: "Authentication required",
      code: "UNAUTHENTICATED",
    };
  }
  for (const binding of TOKEN_BINDINGS) {
    const token = readToken(binding.envKey);
    if (!token || !secureCompare(presented, token)) continue;
    return {
      ok: true,
      user: principalSchema.parse({
        id: readToken(binding.idEnvKey) ?? binding.defaultId,
        authRole: binding.authRole,
        opaRole: parseOpaRole(
          readToken(binding.opaEnvKey),
          binding.defaultOpaRole
        ),
      }),
    };
  }
  return {
    ok: false,
    status: 401,
    error: "Invalid bearer token",
    code: "UNAUTHENTICATED",
  };
}

export async function requireBearer(c: Context<AuthEnv>, next: Next) {
  const result = resolveBearerPrincipal(c.req.header("Authorization"));
  if (!result.ok) {
    return c.json({ error: result.error, code: result.code }, result.status);
  }
  c.set("user", result.user);
  await next();
}

export function getUser(c: Context<AuthEnv>): Principal {
  return c.get("user");
}

export function canReview(
  user: Principal,
  application: { requesterId: string }
): { ok: true } | { ok: false; status: 403; error: string; code: string } {
  if (user.authRole !== "reviewer" && user.authRole !== "admin") {
    return {
      ok: false,
      status: 403,
      error: "Insufficient role",
      code: "FORBIDDEN",
    };
  }
  if (user.id === application.requesterId) {
    return {
      ok: false,
      status: 403,
      error: "Reviewer cannot act on their own request",
      code: "SEPARATION_OF_DUTY",
    };
  }
  return { ok: true };
}

export function canMutateOwn(
  user: Principal,
  application: { requesterId: string }
): { ok: true } | { ok: false; status: 403; error: string; code: string } {
  if (user.authRole === "admin" || user.id === application.requesterId) {
    return { ok: true };
  }
  return {
    ok: false,
    status: 403,
    error: "Not the requester for this application",
    code: "FORBIDDEN",
  };
}
