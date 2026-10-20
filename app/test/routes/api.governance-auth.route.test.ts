import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { afterEach, describe, expect, it } from "vitest";

import { loader as auditLoader } from "~/routes/api.audit";
import { action as submitAction } from "~/routes/api.metadata.access-requests";
import { action as reviewAction } from "~/routes/api.metadata.access-requests.$requestId.review";
import {
  createAccessApplication,
  resetAccessApplicationStore,
} from "~/services/access-request-store.server";
import { API_AUDIT, API_METADATA_ACCESS_REQUESTS } from "~/shared/api/paths";
import { policyDecisionSchema, type UserRole } from "~/shared/contracts";
import {
  authHeaders,
  TEST_ADMIN_TOKEN,
  TEST_REQUESTER_TOKEN,
  TEST_REVIEWER_TOKEN,
} from "~/test/auth-fixtures";

function loaderArgs(url: string, headers?: HeadersInit): LoaderFunctionArgs {
  return {
    request: new Request(url, { headers }),
    params: {},
    context: {},
  } as LoaderFunctionArgs;
}

function actionArgs(
  url: string,
  init: RequestInit,
  params: Record<string, string> = {}
): ActionFunctionArgs {
  return {
    request: new Request(url, init),
    params,
    context: {},
  } as ActionFunctionArgs;
}

const AUDIT_URL = `http://localhost${API_AUDIT}`;
const ASSET_CUSTOMERS = "tbl-customers";
const REQUESTER_ID = "principal:requester";
const REVIEWER_ID = "principal:reviewer";
const REQ_ANON = "req-auth-1";
const REQ_CROSS = "req-auth-2";
const REQ_SELF = "req-auth-3";
const PENDING_STATUS = "pending_approval" as const;
const APPROVE_BODY = JSON.stringify({ decision: "approved" });
const JSON_HEADERS = { "Content-Type": "application/json" };
const POST = "POST" as const;

const decision = policyDecisionSchema.parse({
  allow: false,
  need_approval: true,
  mask_fields: ["email"],
  require_audit: true,
  decision_id: "dec-auth-1",
  reasons: ["policy: test"],
});

function reviewUrl(id: string) {
  return `http://localhost${API_METADATA_ACCESS_REQUESTS}/${id}/review`;
}

function seedPending(
  id: string,
  requesterId: string,
  role: UserRole = "analyst"
) {
  createAccessApplication({
    id,
    assetId: ASSET_CUSTOMERS,
    assetName: "Customers",
    purpose: "marketing",
    role,
    requesterId,
    status: PENDING_STATUS,
    owner: "owner",
    decision,
  });
}

describe("governance + audit route auth", () => {
  afterEach(() => {
    resetAccessApplicationStore();
  });

  it("GET /api/audit is 401 without credentials and 403 for non-admins", () => {
    const anon = auditLoader(loaderArgs(AUDIT_URL));
    expect(anon.status).toBe(401);

    const requester = auditLoader(
      loaderArgs(AUDIT_URL, authHeaders(TEST_REQUESTER_TOKEN))
    );
    expect(requester.status).toBe(403);

    const admin = auditLoader(
      loaderArgs(AUDIT_URL, authHeaders(TEST_ADMIN_TOKEN))
    );
    expect(admin.status).toBe(200);
  });

  it("anonymous POST cannot approve an access request", async () => {
    seedPending(REQ_ANON, REQUESTER_ID);

    const anon = await reviewAction(
      actionArgs(
        reviewUrl(REQ_ANON),
        {
          method: POST,
          headers: JSON_HEADERS,
          body: APPROVE_BODY,
        },
        { requestId: REQ_ANON }
      )
    );
    expect(anon.status).toBe(401);
  });

  it("requester cannot approve; reviewer can; self-review is blocked", async () => {
    seedPending(REQ_CROSS, REQUESTER_ID);

    const asRequester = await reviewAction(
      actionArgs(
        reviewUrl(REQ_CROSS),
        {
          method: POST,
          headers: authHeaders(TEST_REQUESTER_TOKEN),
          body: APPROVE_BODY,
        },
        { requestId: REQ_CROSS }
      )
    );
    expect(asRequester.status).toBe(403);

    const asReviewer = await reviewAction(
      actionArgs(
        reviewUrl(REQ_CROSS),
        {
          method: POST,
          headers: authHeaders(TEST_REVIEWER_TOKEN),
          body: APPROVE_BODY,
        },
        { requestId: REQ_CROSS }
      )
    );
    expect(asReviewer.status).toBe(200);

    seedPending(REQ_SELF, REVIEWER_ID, "data_admin");
    const selfReview = await reviewAction(
      actionArgs(
        reviewUrl(REQ_SELF),
        {
          method: POST,
          headers: authHeaders(TEST_REVIEWER_TOKEN),
          body: APPROVE_BODY,
        },
        { requestId: REQ_SELF }
      )
    );
    expect(selfReview.status).toBe(403);
    const body = (await selfReview.json()) as { code?: string };
    expect(body.code).toBe("SEPARATION_OF_DUTY");
  });

  it("submit stamps requesterId from the principal, not the body", async () => {
    const res = await submitAction(
      actionArgs(`http://localhost${API_METADATA_ACCESS_REQUESTS}`, {
        method: POST,
        headers: authHeaders(TEST_REQUESTER_TOKEN),
        body: JSON.stringify({
          assetId: ASSET_CUSTOMERS,
          purpose: "analytics",
          role: "data_admin",
          asDraft: true,
          requesterId: "forged-user",
        }),
      })
    );
    expect(res.status).toBe(201);
  });
});
