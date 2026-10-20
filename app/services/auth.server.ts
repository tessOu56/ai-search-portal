/**
 * Fail-closed Bearer + signed-cookie auth for the Remix BFF.
 *
 * ADMIN_API_TOKEN is required. Missing/blank token → 503 AUTH_NOT_CONFIGURED
 * (same posture as a locked-down admin API: no anonymous writes).
 * Optional REVIEWER_API_TOKEN / REQUESTER_API_TOKEN map extra principals.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

import {
  type AuthErrorCode,
  authErrorResponseSchema,
  type AuthRole,
  type Principal,
  principalSchema,
  type UserRole,
} from "@ai-search-portal/contracts";

export const SESSION_COOKIE_NAME = "portal_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export type AuthFailure = {
  ok: false;
  status: 401 | 403 | 503;
  error: string;
  code: AuthErrorCode;
};

export type AuthSuccess = { ok: true; user: Principal };
export type AuthResult = AuthSuccess | AuthFailure;

type TokenEnvKey =
  "ADMIN_API_TOKEN" | "REVIEWER_API_TOKEN" | "REQUESTER_API_TOKEN";
type IdEnvKey = "ADMIN_ID" | "REVIEWER_ID" | "REQUESTER_ID";
type OpaEnvKey = "ADMIN_OPA_ROLE" | "REVIEWER_OPA_ROLE" | "REQUESTER_OPA_ROLE";
type EnvLookupKey = TokenEnvKey | IdEnvKey | OpaEnvKey | "SESSION_SECRET";

type TokenBinding = {
  envKey: TokenEnvKey;
  authRole: AuthRole;
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

const OPA_ROLES: UserRole[] = ["analyst", "data_admin", "engineer"];

export function secureCompare(left: string, right: string): boolean {
  const leftBuf = Buffer.from(left);
  const rightBuf = Buffer.from(right);
  const len = Math.max(leftBuf.length, rightBuf.length, 1);
  const paddedLeft = Buffer.alloc(len);
  const paddedRight = Buffer.alloc(len);
  leftBuf.copy(paddedLeft);
  rightBuf.copy(paddedRight);
  const sameBytes = timingSafeEqual(paddedLeft, paddedRight);
  return sameBytes && leftBuf.length === rightBuf.length;
}

function envTrim(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function readToken(envKey: EnvLookupKey): string | undefined {
  switch (envKey) {
    case "SESSION_SECRET":
      return envTrim(process.env.SESSION_SECRET);
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

export function adminTokenConfigured(): boolean {
  return Boolean(readToken("ADMIN_API_TOKEN"));
}

function signingSecret(): string | undefined {
  return readToken("SESSION_SECRET") ?? readToken("ADMIN_API_TOKEN");
}

export function configuredPrincipals(): Array<{
  token: string;
  principal: Principal;
}> {
  const rows: Array<{ token: string; principal: Principal }> = [];
  for (const binding of TOKEN_BINDINGS) {
    const token = readToken(binding.envKey);
    if (!token) continue;
    const principal = principalSchema.parse({
      id: readToken(binding.idEnvKey) ?? binding.defaultId,
      authRole: binding.authRole,
      opaRole: parseOpaRole(
        readToken(binding.opaEnvKey),
        binding.defaultOpaRole
      ),
    });
    rows.push({ token, principal });
  }
  return rows;
}

export function parseBearerToken(header: string | null): string | undefined {
  if (!header) return undefined;
  const match = /^Bearer\s+(\S+)/i.exec(header.trim());
  const token = match?.[1]?.trim();
  return token ? token : undefined;
}

function principalForToken(presented: string): Principal | undefined {
  for (const row of configuredPrincipals()) {
    if (secureCompare(presented, row.token)) return row.principal;
  }
  return undefined;
}

type SessionPayload = {
  id: string;
  authRole: AuthRole;
  opaRole: UserRole;
  exp: number;
};

function signSession(payload: SessionPayload, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  );
  const mac = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${mac}`;
}

function verifySession(
  token: string,
  secret: string
): SessionPayload | undefined {
  const sep = token.lastIndexOf(".");
  if (sep <= 0) return undefined;
  const body = token.slice(0, sep);
  const mac = token.slice(sep + 1);
  if (!body || !mac) return undefined;
  const expected = createHmac("sha256", secret)
    .update(body)
    .digest("base64url");
  if (!secureCompare(mac, expected)) return undefined;
  try {
    const parsed = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    ) as SessionPayload;
    if (typeof parsed.exp !== "number" || parsed.exp < Date.now()) {
      return undefined;
    }
    if (!OPA_ROLES.includes(parsed.opaRole)) return undefined;
    if (
      parsed.authRole !== "admin" &&
      parsed.authRole !== "reviewer" &&
      parsed.authRole !== "requester"
    ) {
      return undefined;
    }
    if (typeof parsed.id !== "string" || parsed.id.length === 0) {
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
}

export function readCookie(cookieHeader: string | null, name: string): string {
  if (!cookieHeader) return "";
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    if (trimmed.slice(0, eq) === name) {
      return decodeURIComponent(trimmed.slice(eq + 1));
    }
  }
  return "";
}

export function sessionCookieValue(user: Principal): string | undefined {
  const secret = signingSecret();
  if (!secret) return undefined;
  return signSession(
    {
      id: user.id,
      authRole: user.authRole,
      opaRole: user.opaRole,
      exp: Date.now() + SESSION_TTL_MS,
    },
    secret
  );
}

export function sessionSetCookie(value: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${secure}`;
}

export function sessionClearCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

function principalFromCookie(request: Request): Principal | undefined {
  const secret = signingSecret();
  if (!secret) return undefined;
  const raw = readCookie(request.headers.get("Cookie"), SESSION_COOKIE_NAME);
  if (!raw) return undefined;
  const payload = verifySession(raw, secret);
  if (!payload) return undefined;
  return principalSchema.parse({
    id: payload.id,
    authRole: payload.authRole,
    opaRole: payload.opaRole,
  });
}

export function authenticateRequest(request: Request): AuthResult {
  if (!adminTokenConfigured()) {
    return {
      ok: false,
      status: 503,
      error: "Admin API token is not configured",
      code: "AUTH_NOT_CONFIGURED",
    };
  }

  const bearer = parseBearerToken(request.headers.get("Authorization"));
  if (bearer) {
    const user = principalForToken(bearer);
    if (user) return { ok: true, user };
    return {
      ok: false,
      status: 401,
      error: "Invalid bearer token",
      code: "UNAUTHENTICATED",
    };
  }

  const fromCookie = principalFromCookie(request);
  if (fromCookie) return { ok: true, user: fromCookie };

  return {
    ok: false,
    status: 401,
    error: "Authentication required",
    code: "UNAUTHENTICATED",
  };
}

export function authFailureResponse(failure: AuthFailure): Response {
  const body = authErrorResponseSchema.parse({
    error: failure.error,
    code: failure.code,
  });
  return Response.json(body, { status: failure.status });
}

export function requireAuthRole(
  user: Principal,
  roles: readonly AuthRole[]
): AuthResult {
  if (roles.includes(user.authRole)) return { ok: true, user };
  return {
    ok: false,
    status: 403,
    error: "Insufficient role",
    code: "FORBIDDEN",
  };
}

export function assertCanReview(
  user: Principal,
  application: { requesterId: string }
): AuthResult {
  const roleGate = requireAuthRole(user, ["reviewer", "admin"]);
  if (!roleGate.ok) return roleGate;
  if (user.id === application.requesterId) {
    return {
      ok: false,
      status: 403,
      error: "Reviewer cannot act on their own request",
      code: "SEPARATION_OF_DUTY",
    };
  }
  return { ok: true, user };
}

export function assertCanMutateOwn(
  user: Principal,
  application: { requesterId: string }
): AuthResult {
  if (user.authRole === "admin" || user.id === application.requesterId) {
    return { ok: true, user };
  }
  return {
    ok: false,
    status: 403,
    error: "Not the requester for this application",
    code: "FORBIDDEN",
  };
}

export function listVisibleRequesterId(user: Principal): string | undefined {
  if (user.authRole === "admin" || user.authRole === "reviewer") {
    return undefined;
  }
  return user.id;
}

export function issueHitlConfirmToken(user: Principal, tool: string): string {
  const secret = signingSecret();
  if (!secret) return "";
  const body = `${user.id}:${tool}`;
  return createHmac("sha256", secret).update(body).digest("base64url");
}

export function verifyHitlConfirmToken(
  token: string | undefined,
  user: Principal,
  tool: string
): boolean {
  if (!token) return false;
  const expected = issueHitlConfirmToken(user, tool);
  if (!expected) return false;
  return secureCompare(token, expected);
}
