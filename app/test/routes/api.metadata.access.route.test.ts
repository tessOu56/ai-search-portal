import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { describe, expect, it } from "vitest";

import {
  action as submitAction,
  loader as listLoader,
} from "~/routes/api.metadata.access-requests";
import { action as cancelAction } from "~/routes/api.metadata.access-requests.$requestId.cancel";
import { action as reviewAction } from "~/routes/api.metadata.access-requests.$requestId.review";
import { action as submitDraftAction } from "~/routes/api.metadata.access-requests.$requestId.submit";
import { action as evaluateAction } from "~/routes/api.metadata.access-requests.evaluate";
import {
  evaluateAccessResponseSchema,
  listAccessApplicationsResponseSchema,
  submitAccessResponseSchema,
} from "~/shared/contracts";

const CUSTOMERS = "tbl-customers";
const EVALUATE_URL = "http://localhost/api/metadata/access-requests/evaluate";
const REQUESTS_URL = "http://localhost/api/metadata/access-requests";

function asAction(
  url: string,
  init: RequestInit,
  params: Record<string, string> = {}
): ActionFunctionArgs {
  return {
    request: new Request(url, init),
    params,
    context: {},
  } as unknown as ActionFunctionArgs;
}

function jsonPost(url: string, body: unknown, params?: Record<string, string>) {
  return asAction(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    params
  );
}

describe("POST /api/metadata/access-requests/evaluate", () => {
  it("returns a HITL decision for analyst + PII", async () => {
    const response = await evaluateAction(
      jsonPost(EVALUATE_URL, {
        assetId: CUSTOMERS,
        purpose: "marketing",
        role: "analyst",
      })
    );
    expect(response.status).toBe(200);
    const body = evaluateAccessResponseSchema.parse(await response.json());
    expect(body.data.need_approval).toBe(true);
  });

  it("returns 404 for an unknown asset and 400 for invalid JSON", async () => {
    const missing = await evaluateAction(
      jsonPost(EVALUATE_URL, {
        assetId: "missing",
        purpose: "analytics",
        role: "analyst",
      })
    );
    expect(missing.status).toBe(404);

    const invalid = await evaluateAction(
      asAction(EVALUATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      })
    );
    expect(invalid.status).toBe(400);
  });

  it("rejects non-POST methods", async () => {
    const response = await evaluateAction(
      asAction(EVALUATE_URL, {
        method: "GET",
      })
    );
    expect(response.status).toBe(405);
  });
});

describe("POST /api/metadata/access-requests", () => {
  it("returns HITL 422 without approval and 202 when confirmed", async () => {
    const blocked = await submitAction(
      jsonPost(REQUESTS_URL, {
        assetId: CUSTOMERS,
        purpose: "marketing",
        role: "analyst",
      })
    );
    expect(blocked.status).toBe(422);

    const submitted = await submitAction(
      jsonPost(REQUESTS_URL, {
        assetId: CUSTOMERS,
        purpose: "marketing",
        role: "analyst",
        approved: true,
      })
    );
    expect(submitted.status).toBe(202);
    const body = submitAccessResponseSchema.parse(await submitted.json());
    expect(body.data.status).toBe("pending_approval");
  });

  it("replays an Idempotency-Key to the same request id", async () => {
    const payload = {
      assetId: CUSTOMERS,
      purpose: "marketing" as const,
      role: "analyst" as const,
      approved: true,
    };
    const headers = {
      "Content-Type": "application/json",
      "Idempotency-Key": "idem-route-test-1",
    };
    const first = await submitAction(
      asAction(REQUESTS_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      })
    );
    const firstBody = submitAccessResponseSchema.parse(await first.json());
    const second = await submitAction(
      asAction(REQUESTS_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      })
    );
    const secondBody = submitAccessResponseSchema.parse(await second.json());
    expect(secondBody.data.requestId).toBe(firstBody.data.requestId);
  });
});

describe("access-request draft submit, review, cancel", () => {
  it("promotes a draft, reviews it, and rejects cancel after approve", async () => {
    const drafted = await submitAction(
      jsonPost(REQUESTS_URL, {
        assetId: CUSTOMERS,
        purpose: "analytics",
        role: "analyst",
        asDraft: true,
      })
    );
    expect(drafted.status).toBe(201);
    const draftBody = submitAccessResponseSchema.parse(await drafted.json());

    const promoted = await submitDraftAction(
      jsonPost(
        `http://localhost/api/metadata/access-requests/${draftBody.data.requestId}/submit`,
        {},
        { requestId: draftBody.data.requestId }
      )
    );
    expect(promoted.ok).toBe(true);
    const promotedBody = submitAccessResponseSchema.parse(
      await promoted.json()
    );
    expect(promotedBody.data.status).toBe("pending_approval");

    const reviewed = await reviewAction(
      jsonPost(
        `http://localhost/api/metadata/access-requests/${draftBody.data.requestId}/review`,
        { decision: "approved" },
        { requestId: draftBody.data.requestId }
      )
    );
    expect(reviewed.ok).toBe(true);

    const cancelled = await cancelAction(
      jsonPost(
        `http://localhost/api/metadata/access-requests/${draftBody.data.requestId}/cancel`,
        {},
        { requestId: draftBody.data.requestId }
      )
    );
    expect(cancelled.status).toBe(409);
  });

  it("lists pending applications", async () => {
    const response = await Promise.resolve(
      listLoader({
        request: new Request(
          "http://localhost/api/metadata/access-requests?pendingOnly=1"
        ),
        params: {},
        context: {},
      } as LoaderFunctionArgs)
    );
    expect(response.status).toBe(200);
    const body = listAccessApplicationsResponseSchema.parse(
      await response.json()
    );
    expect(body.data.every((row) => row.status === "pending_approval")).toBe(
      true
    );
  });
});
