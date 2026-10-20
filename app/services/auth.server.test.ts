import { afterEach, describe, expect, it } from "vitest";

import {
  applyTestAuthEnv,
  bearer,
  TEST_ADMIN_TOKEN,
  TEST_REQUESTER_TOKEN,
  TEST_REVIEWER_TOKEN,
} from "~/test/auth-fixtures";

import {
  assertCanReview,
  authenticateRequest,
  issueHitlConfirmToken,
  SESSION_COOKIE_NAME,
  sessionCookieValue,
  verifyHitlConfirmToken,
} from "./auth.server";

const REQUESTER_ID = "principal:requester";
const SUBMIT_TOOL = "access_request.submit";

function requestWith(headers: HeadersInit): Request {
  return new Request("http://localhost/api/audit", { headers });
}

describe("authenticateRequest", () => {
  afterEach(() => {
    applyTestAuthEnv();
  });

  it("fails closed when ADMIN_API_TOKEN is missing", () => {
    delete process.env.ADMIN_API_TOKEN;
    const result = authenticateRequest(
      requestWith({ Authorization: bearer(TEST_ADMIN_TOKEN) })
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(503);
    expect(result.code).toBe("AUTH_NOT_CONFIGURED");
  });

  it("rejects anonymous requests", () => {
    const result = authenticateRequest(requestWith({}));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(401);
    expect(result.code).toBe("UNAUTHENTICATED");
  });

  it("rejects a forged bearer token", () => {
    const result = authenticateRequest(
      requestWith({ Authorization: bearer("totally-not-the-token") })
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(401);
  });

  it("maps admin / reviewer / requester tokens to server-side principals", () => {
    const admin = authenticateRequest(
      requestWith({ Authorization: bearer(TEST_ADMIN_TOKEN) })
    );
    expect(admin.ok).toBe(true);
    if (!admin.ok) return;
    expect(admin.user).toEqual({
      id: "principal:admin",
      authRole: "admin",
      opaRole: "data_admin",
    });

    const reviewer = authenticateRequest(
      requestWith({ Authorization: bearer(TEST_REVIEWER_TOKEN) })
    );
    expect(reviewer.ok).toBe(true);
    if (!reviewer.ok) return;
    expect(reviewer.user.authRole).toBe("reviewer");

    const requester = authenticateRequest(
      requestWith({ Authorization: bearer(TEST_REQUESTER_TOKEN) })
    );
    expect(requester.ok).toBe(true);
    if (!requester.ok) return;
    expect(requester.user).toEqual({
      id: REQUESTER_ID,
      authRole: "requester",
      opaRole: "analyst",
    });
  });

  it("accepts a signed session cookie minted from a valid bearer", () => {
    const authed = authenticateRequest(
      requestWith({ Authorization: bearer(TEST_REVIEWER_TOKEN) })
    );
    expect(authed.ok).toBe(true);
    if (!authed.ok) return;
    const cookie = sessionCookieValue(authed.user);
    expect(cookie).toBeTruthy();
    const viaCookie = authenticateRequest(
      requestWith({ Cookie: `${SESSION_COOKIE_NAME}=${cookie}` })
    );
    expect(viaCookie.ok).toBe(true);
    if (!viaCookie.ok) return;
    expect(viaCookie.user.id).toBe(authed.user.id);
  });

  it("rejects a tampered session cookie", () => {
    const authed = authenticateRequest(
      requestWith({ Authorization: bearer(TEST_ADMIN_TOKEN) })
    );
    expect(authed.ok).toBe(true);
    if (!authed.ok) return;
    const cookie = sessionCookieValue(authed.user) ?? "";
    const tampered = `${cookie.slice(0, -4)}abcd`;
    const result = authenticateRequest(
      requestWith({ Cookie: `${SESSION_COOKIE_NAME}=${tampered}` })
    );
    expect(result.ok).toBe(false);
  });
});

describe("assertCanReview", () => {
  it("enforces reviewer/admin role and separation of duties", () => {
    const reviewer = {
      id: "principal:reviewer",
      authRole: "reviewer" as const,
      opaRole: "data_admin" as const,
    };
    const requester = {
      id: REQUESTER_ID,
      authRole: "requester" as const,
      opaRole: "analyst" as const,
    };
    expect(assertCanReview(reviewer, { requesterId: REQUESTER_ID }).ok).toBe(
      true
    );
    expect(assertCanReview(requester, { requesterId: "someone-else" }).ok).toBe(
      false
    );
    const sod = assertCanReview(reviewer, {
      requesterId: "principal:reviewer",
    });
    expect(sod.ok).toBe(false);
    if (sod.ok) return;
    expect(sod.code).toBe("SEPARATION_OF_DUTY");
  });
});

describe("HITL confirm token", () => {
  it("round-trips for the same principal and tool", () => {
    const user = {
      id: REQUESTER_ID,
      authRole: "requester" as const,
      opaRole: "analyst" as const,
    };
    const token = issueHitlConfirmToken(user, SUBMIT_TOOL);
    expect(verifyHitlConfirmToken(token, user, SUBMIT_TOOL)).toBe(true);
    expect(verifyHitlConfirmToken(token, user, "metadata.search")).toBe(false);
    expect(verifyHitlConfirmToken("nope", user, SUBMIT_TOOL)).toBe(false);
  });
});
