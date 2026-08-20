/**
 * MSW handlers for metadata + MCP + access policy APIs.
 */

import { http, HttpResponse } from "msw";

import {
  cancelAccessApplication,
  createAccessApplication,
  editAccessApplication,
  listAccessApplications,
  reviewAccessApplication,
  submitDraftAccessApplication,
} from "~/services/access-request-store.server";
import {
  cancelAccessResponseSchema,
  evaluateAccessResponseSchema,
  getMetadataAssetResponseSchema,
  governanceDeniedError,
  governanceHitlError,
  governanceInvalidTransitionError,
  governancePolicyErrorSchema,
  listAccessApplicationsResponseSchema,
  listAuditEventsResponseSchema,
  listMetadataResponseSchema,
  mcpDiscoverSchema,
  mcpToolsCallResponseSchema,
  metadataLineageResponseSchema,
  policyDecisionSchema,
  reviewAccessResponseSchema,
  submitAccessResponseSchema,
} from "~/shared/contracts";
import {
  loadPackAssets,
  resolveActivePackId,
  resolveContentRoot,
} from "~/shared/services/context-pack-loader.server";

const ERROR_INVALID_BODY = "Invalid request body";
const ERROR_ASSET_NOT_FOUND = "Asset not found";
const ERROR_ACCESS_REQUEST_NOT_FOUND = "Access request not found";
const AUDIT_ACTION_SUBMIT = "access.request.submit";
const PAGE_SIZE = 5;
let mockRequestSeq = 0;

function nextMockRequestId(): string {
  mockRequestSeq += 1;
  return `mock-req-${mockRequestSeq}`;
}

/**
 * Realistic governance audit history (T-2026-024 / G2) — mirrors the seeded
 * applications in access-request-store.server.ts (MSW-only fixture; the real
 * audit-log.server.ts intentionally starts empty, see spec review §3).
 */
const ASSET_CUSTOMERS = "tbl-customers";

const MOCK_AUDIT_EVENTS = [
  {
    id: "aud-mock-1",
    at: "2026-07-09T00:00:00.000Z",
    action: AUDIT_ACTION_SUBMIT,
    actor: { role: "analyst" as const },
    resource: { type: "metadata_asset", id: ASSET_CUSTOMERS },
    decisionId: "dec-mock-1",
    requestId: "mock-req-seed",
    outcome: "pending_approval" as const,
    requireAudit: true,
    reasons: ["sensitive classification requires approval"],
  },
  {
    id: "aud-seed-pending-1",
    at: "2026-08-09T02:00:00.000Z",
    action: AUDIT_ACTION_SUBMIT,
    actor: { role: "analyst" as const },
    resource: { type: "metadata_asset", id: ASSET_CUSTOMERS },
    decisionId: "dec-seed-pending-1",
    requestId: "seed-req-pending-1",
    outcome: "pending_approval" as const,
    requireAudit: false,
    reasons: ["policy: marketing purpose on PII requires approval"],
  },
  {
    id: "aud-seed-denied-1",
    at: "2026-08-06T09:30:00.000Z",
    action: "access_request.deny",
    actor: { role: "analyst" as const },
    resource: { type: "metadata_asset", id: "dash-orders" },
    decisionId: "dec-seed-denied-1",
    requestId: "seed-req-denied-1",
    outcome: "denied" as const,
    requireAudit: true,
    reasons: [
      "review:denied",
      "policy: confidential classification requires audit log",
    ],
  },
  {
    id: "aud-seed-expired-1",
    at: "2026-07-28T01:00:00.000Z",
    action: "access_request.expire",
    actor: { role: "analyst" as const },
    resource: { type: "metadata_asset", id: ASSET_CUSTOMERS },
    decisionId: "dec-seed-expired-1",
    requestId: "seed-req-expired-1",
    outcome: "expired" as const,
    requireAudit: false,
    reasons: ["stale draft/pending_approval past TTL"],
  },
  {
    id: "aud-seed-permission-denied-1",
    at: "2026-08-07T03:15:00.000Z",
    action: AUDIT_ACTION_SUBMIT,
    actor: { role: "analyst" as const },
    resource: { type: "metadata_asset", id: "tbl-etl-orders" },
    decisionId: "dec-seed-permission-denied-1",
    requestId: "seed-req-permission-denied-1",
    outcome: "denied" as const,
    requireAudit: false,
    reasons: ["policy: default deny"],
  },
  {
    id: "aud-seed-deprecated-api-1",
    at: "2026-08-02T05:05:00.000Z",
    action: AUDIT_ACTION_SUBMIT,
    actor: { role: "engineer" as const },
    resource: { type: "metadata_asset", id: "api-legacy-orders" },
    decisionId: "dec-seed-deprecated-1",
    requestId: "seed-req-deprecated-api-1",
    outcome: "denied" as const,
    requireAudit: false,
    reasons: [
      "policy: asset deprecated — access blocked pending sunset",
      "see api-material-quote for the supported replacement",
    ],
  },
  {
    id: "aud-seed-missing-owner-1",
    at: "2026-08-10T08:00:00.000Z",
    action: AUDIT_ACTION_SUBMIT,
    actor: { role: "analyst" as const },
    resource: { type: "metadata_asset", id: "dim-vendor-directory" },
    decisionId: "dec-seed-missing-owner-1",
    requestId: "seed-req-missing-owner-1",
    outcome: "pending_approval" as const,
    requireAudit: false,
    reasons: ["policy: no owner on record — routed to admin escalation queue"],
  },
];

function packFromRequest(request: Request): string {
  const url = new URL(request.url);
  return resolveActivePackId({
    packQuery: url.searchParams.get("pack"),
    cookieHeader: request.headers.get("Cookie"),
    envPack: process.env.CONTEXT_PACK ?? null,
  });
}

function assetsForPack(packId: string) {
  return loadPackAssets(packId, resolveContentRoot());
}

function listAssets(packId: string, q: string, type?: string, page = 1) {
  let rows = assetsForPack(packId);
  const query = q.trim().toLowerCase();
  if (query) {
    rows = rows.filter((row) => {
      const hay =
        `${row.name} ${row.description} ${row.fqn} ${row.tags.join(" ")}`.toLowerCase();
      return hay.includes(query);
    });
  }
  if (type) {
    rows = rows.filter((r) => r.assetType.toLowerCase() === type.toLowerCase());
  }
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  return {
    data: rows.slice(start, start + PAGE_SIZE).map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      assetType: a.assetType,
      owner: a.owner,
      department: a.department,
      tags: a.tags,
      classification: a.classification,
      updatedAt: a.updatedAt,
      fqn: a.fqn,
    })),
    pagination: {
      page: safePage,
      pageSize: PAGE_SIZE,
      total,
      totalPages,
    },
  };
}

function evaluatePolicy(input: {
  assetId: string;
  purpose: string;
  role?: string;
  packId: string;
}) {
  const asset = assetsForPack(input.packId).find((a) => a.id === input.assetId);
  if (!asset) return null;

  const role = input.role ?? "analyst";
  const classification = asset.classification;
  const purpose = input.purpose;
  const mask_fields = (asset.columns ?? [])
    .filter((c) => c.sensitive)
    .map((c) => c.name);

  let allow = false;
  let need_approval = false;
  const require_audit = classification === "confidential";
  const reasons: string[] = [];

  if (role === "data_admin") {
    allow = true;
    reasons.push("policy: data_admin allow");
  } else if (role === "engineer" && classification === "internal") {
    allow = true;
    reasons.push("policy: engineer_internal allow");
  }

  if (classification === "PII" && role === "analyst") {
    need_approval = true;
    reasons.push("policy: analyst requires approval for PII datasets");
  }

  if (purpose === "marketing" && classification === "PII") {
    need_approval = true;
    reasons.push("policy: marketing purpose on PII requires approval");
  }

  if (require_audit) {
    reasons.push("policy: confidential classification requires audit log");
  }

  return policyDecisionSchema.parse({
    allow,
    need_approval,
    mask_fields,
    require_audit,
    decision_id: `mock-${asset.id}`,
    reasons,
  });
}

function handleMcpGatewayMock(
  raw: {
    method?: string;
    params?: { name?: string; arguments?: Record<string, unknown> };
  },
  packId: string
) {
  if (raw.method !== "tools/call" || !raw.params?.name) {
    return mcpToolsCallResponseSchema.parse({ error: "Invalid request" });
  }
  const name = raw.params.name;
  const args = raw.params.arguments ?? {};
  if (name === "metadata.search") {
    return mcpToolsCallResponseSchema.parse({
      result: listAssets(
        packId,
        typeof args.q === "string" ? args.q : "",
        typeof args.type === "string" ? args.type : undefined,
        typeof args.page === "number" ? args.page : 1
      ),
    });
  }
  if (name === "metadata.get") {
    const asset = assetsForPack(packId).find((a) => a.id === args.assetId);
    if (!asset) {
      return mcpToolsCallResponseSchema.parse({ error: ERROR_ASSET_NOT_FOUND });
    }
    return mcpToolsCallResponseSchema.parse({ result: asset });
  }
  if (name === "policy.evaluate") {
    const decision = evaluatePolicy({
      assetId: String(args.assetId ?? ""),
      purpose: String(args.purpose ?? ""),
      role: typeof args.role === "string" ? args.role : undefined,
      packId,
    });
    if (!decision) {
      return mcpToolsCallResponseSchema.parse({ error: ERROR_ASSET_NOT_FOUND });
    }
    return mcpToolsCallResponseSchema.parse({ result: decision });
  }
  return mcpToolsCallResponseSchema.parse({ error: "Unknown tool" });
}

export const metadataHandlers = [
  http.get("/api/metadata", ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? "";
    const type = url.searchParams.get("type") ?? undefined;
    const page = Number(url.searchParams.get("page") ?? "1");
    const packId = packFromRequest(request);
    const body = listMetadataResponseSchema.parse(
      listAssets(packId, q, type, Number.isFinite(page) ? page : 1)
    );
    return HttpResponse.json(body);
  }),

  // Must precede `/api/metadata/:assetId` or `access-requests` is captured as an id.
  http.get("/api/metadata/access-requests", ({ request }) => {
    const url = new URL(request.url);
    const requesterId = url.searchParams.get("requesterId") ?? undefined;
    const pendingOnly = url.searchParams.get("pendingOnly") === "1";
    const rows = listAccessApplications({ requesterId, pendingOnly });
    return HttpResponse.json(
      listAccessApplicationsResponseSchema.parse({ data: rows })
    );
  }),

  http.get("/api/metadata/:assetId", ({ params, request }) => {
    if (params.assetId === "access-requests") {
      return HttpResponse.json(
        { error: ERROR_ASSET_NOT_FOUND },
        { status: 404 }
      );
    }
    const packId = packFromRequest(request);
    const asset = assetsForPack(packId).find((a) => a.id === params.assetId);
    if (!asset) {
      return HttpResponse.json(
        { error: ERROR_ASSET_NOT_FOUND },
        { status: 404 }
      );
    }
    const body = getMetadataAssetResponseSchema.parse({ data: asset });
    return HttpResponse.json(body);
  }),

  http.post("/api/metadata/access-requests/evaluate", async ({ request }) => {
    const packId = packFromRequest(request);
    const raw = (await request.json()) as {
      assetId?: string;
      purpose?: string;
      role?: string;
    };
    if (!raw.assetId || !raw.purpose) {
      return HttpResponse.json({ error: ERROR_INVALID_BODY }, { status: 400 });
    }
    const decision = evaluatePolicy({
      assetId: raw.assetId,
      purpose: raw.purpose,
      role: raw.role,
      packId,
    });
    if (!decision) {
      return HttpResponse.json(
        { error: ERROR_ASSET_NOT_FOUND },
        { status: 404 }
      );
    }
    return HttpResponse.json(
      evaluateAccessResponseSchema.parse({ data: decision })
    );
  }),

  http.post("/api/metadata/access-requests", async ({ request }) => {
    const packId = packFromRequest(request);
    const raw = (await request.json()) as {
      assetId?: string;
      purpose?: string;
      role?: string;
      approved?: boolean;
      requesterId?: string;
      asDraft?: boolean;
    };
    if (!raw.assetId || !raw.purpose) {
      return HttpResponse.json({ error: ERROR_INVALID_BODY }, { status: 400 });
    }
    const decision = evaluatePolicy({
      assetId: raw.assetId,
      purpose: raw.purpose,
      role: raw.role,
      packId,
    });
    if (!decision) {
      return HttpResponse.json(
        { error: ERROR_ASSET_NOT_FOUND },
        { status: 404 }
      );
    }
    if (raw.asDraft) {
      const asset = assetsForPack(packId).find((a) => a.id === raw.assetId);
      const role =
        raw.role === "data_admin" || raw.role === "engineer"
          ? raw.role
          : "analyst";
      const purpose =
        raw.purpose === "marketing" || raw.purpose === "operations"
          ? raw.purpose
          : "analytics";
      const requestId = nextMockRequestId();
      if (asset) {
        createAccessApplication({
          id: requestId,
          assetId: raw.assetId,
          assetName: asset.name,
          purpose,
          role,
          requesterId: raw.requesterId ?? `requester:${role}`,
          status: "draft",
          owner: asset.owner,
          decision,
          termsAccepted: asset.termsOfUse,
        });
      }
      const draftBody = submitAccessResponseSchema.parse({
        data: {
          requestId,
          status: "draft",
          decision,
          auditLogged: false,
        },
      });
      return HttpResponse.json(draftBody, { status: 201 });
    }
    if (decision.need_approval && !raw.approved) {
      return HttpResponse.json(
        governanceHitlError("Human approval required", decision),
        { status: 422 }
      );
    }
    if (!decision.allow && !decision.need_approval) {
      return HttpResponse.json(
        governanceDeniedError("Access denied by policy", decision),
        { status: 403 }
      );
    }
    const status =
      decision.need_approval && raw.approved
        ? "pending_approval"
        : decision.allow
          ? "approved"
          : "denied";
    const asset = assetsForPack(packId).find((a) => a.id === raw.assetId);
    const role =
      raw.role === "data_admin" || raw.role === "engineer"
        ? raw.role
        : "analyst";
    const purpose =
      raw.purpose === "marketing" || raw.purpose === "operations"
        ? raw.purpose
        : "analytics";
    const requestId = nextMockRequestId();
    if (asset) {
      createAccessApplication({
        id: requestId,
        assetId: raw.assetId,
        assetName: asset.name,
        purpose,
        role,
        requesterId: raw.requesterId ?? `requester:${role}`,
        status,
        owner: asset.owner,
        decision,
        termsAccepted: asset.termsOfUse,
      });
    }
    const body = submitAccessResponseSchema.parse({
      data: {
        requestId,
        status,
        decision,
        auditLogged: decision.require_audit,
      },
    });
    return HttpResponse.json(body, { status: 202 });
  }),

  http.post(
    "/api/metadata/access-requests/:requestId/review",
    async ({ params, request }) => {
      const raw = (await request.json()) as {
        decision?: string;
        purpose?: string;
        role?: string;
      };
      if (
        raw.decision !== "approved" &&
        raw.decision !== "denied" &&
        raw.decision !== "edited"
      ) {
        return HttpResponse.json(
          { error: ERROR_INVALID_BODY },
          { status: 400 }
        );
      }
      const id = String(params.requestId);
      const updated =
        raw.decision === "edited"
          ? editAccessApplication({
              id,
              purpose:
                raw.purpose === "analytics" ||
                raw.purpose === "marketing" ||
                raw.purpose === "operations"
                  ? raw.purpose
                  : undefined,
              role:
                raw.role === "analyst" ||
                raw.role === "engineer" ||
                raw.role === "data_admin"
                  ? raw.role
                  : undefined,
            })
          : reviewAccessApplication({
              id,
              decision: raw.decision,
            });
      if (!updated.ok) {
        if (updated.reason === "not_found") {
          return HttpResponse.json(
            governancePolicyErrorSchema.parse({
              error: ERROR_ACCESS_REQUEST_NOT_FOUND,
              code: "NOT_FOUND",
            }),
            { status: 404 }
          );
        }
        return HttpResponse.json(
          governanceInvalidTransitionError(
            `Cannot ${raw.decision} in current status`
          ),
          { status: 409 }
        );
      }
      return HttpResponse.json(
        reviewAccessResponseSchema.parse({ data: updated.data })
      );
    }
  ),

  http.post("/api/metadata/access-requests/:requestId/submit", ({ params }) => {
    const id = String(params.requestId);
    const updated = submitDraftAccessApplication(id);
    if (!updated.ok) {
      return HttpResponse.json(
        updated.reason === "not_found"
          ? governancePolicyErrorSchema.parse({
              error: ERROR_ACCESS_REQUEST_NOT_FOUND,
              code: "NOT_FOUND",
            })
          : governanceInvalidTransitionError("Cannot submit non-draft"),
        { status: updated.reason === "not_found" ? 404 : 409 }
      );
    }
    const decision = updated.data.decision;
    if (!decision) {
      return HttpResponse.json(
        { error: "Missing policy decision on draft" },
        { status: 500 }
      );
    }
    return HttpResponse.json(
      submitAccessResponseSchema.parse({
        data: {
          requestId: updated.data.id,
          status: updated.data.status,
          decision,
          auditLogged: decision.require_audit,
        },
      }),
      { status: 202 }
    );
  }),

  http.post("/api/metadata/access-requests/:requestId/cancel", ({ params }) => {
    const id = String(params.requestId);
    const updated = cancelAccessApplication({ id });
    if (!updated.ok) {
      return HttpResponse.json(
        updated.reason === "not_found"
          ? governancePolicyErrorSchema.parse({
              error: ERROR_ACCESS_REQUEST_NOT_FOUND,
              code: "NOT_FOUND",
            })
          : governanceInvalidTransitionError("Cannot cancel in current status"),
        { status: updated.reason === "not_found" ? 404 : 409 }
      );
    }
    return HttpResponse.json(
      cancelAccessResponseSchema.parse({ data: updated.data })
    );
  }),

  http.get("/api/metadata/:assetId/lineage", ({ params, request }) => {
    if (params.assetId === "access-requests") {
      return HttpResponse.json(
        { error: ERROR_ASSET_NOT_FOUND },
        { status: 404 }
      );
    }
    const packId = packFromRequest(request);
    const asset = assetsForPack(packId).find((a) => a.id === params.assetId);
    if (!asset) {
      return HttpResponse.json(
        { error: ERROR_ASSET_NOT_FOUND },
        { status: 404 }
      );
    }
    const type =
      asset.assetType === "API"
        ? ("api" as const)
        : asset.assetType === "Dashboard"
          ? ("dashboard" as const)
          : ("table" as const);
    const body = metadataLineageResponseSchema.parse({
      data: {
        assetId: asset.id,
        upstream: [],
        downstream: [],
        nodes: [{ id: asset.id, label: asset.name, type }],
        edges: [],
      },
    });
    return HttpResponse.json(body);
  }),

  http.get("/api/audit", ({ request }) => {
    const url = new URL(request.url);
    const rawLimit = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);
    const limit = Number.isNaN(rawLimit) ? 50 : Math.max(0, rawLimit);
    const data = MOCK_AUDIT_EVENTS.slice(0, limit);
    const body = listAuditEventsResponseSchema.parse({
      data,
      total: MOCK_AUDIT_EVENTS.length,
    });
    return HttpResponse.json(body);
  }),

  http.post("/api/mcp/gateway", async ({ request }) => {
    const packId = packFromRequest(request);
    const raw = (await request.json()) as {
      method?: string;
      params?: { name?: string; arguments?: Record<string, unknown> };
    };
    return HttpResponse.json(handleMcpGatewayMock(raw, packId));
  }),

  http.get("/.well-known/mcp.json", () => {
    const body = mcpDiscoverSchema.parse({
      protocolVersion: "2026-07-28-rc1",
      serverInfo: { name: "ai-search-portal-mcp", version: "0.1.0" },
      tools: [
        { name: "metadata.search", description: "Search metadata" },
        { name: "policy.evaluate", description: "Evaluate policy" },
      ],
      ttlMs: 60_000,
    });
    return HttpResponse.json(body);
  }),

  http.get("/api/mcp/tasks/:taskId", () => {
    return HttpResponse.json(
      { error: "No active task in mock" },
      { status: 404 }
    );
  }),
];
