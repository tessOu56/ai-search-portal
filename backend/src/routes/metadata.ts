import { randomUUID } from "node:crypto";

import {
  cancelAccessResponseSchema,
  evaluateAccessResponseSchema,
  getMetadataAssetResponseSchema,
  governanceDeniedError,
  governanceHitlError,
  governanceInvalidTransitionError,
  governancePolicyErrorSchema,
  listAccessApplicationsResponseSchema,
  listMetadataResponseSchema,
  metadataAccessEvaluateRequestSchema,
  metadataAccessRequestSchema,
  metadataLineageResponseSchema,
  reviewAccessRequestSchema,
  reviewAccessResponseSchema,
  submitAccessResponseSchema,
} from "@ai-search-portal/contracts";
import { Hono } from "hono";

import { resolveActivePackId } from "../lib/context-pack-loader.js";
import { evaluateAccess } from "../policies/evaluate-access.js";
import {
  cancelApplication,
  createApplication,
  editApplication,
  getApplication,
  listApplications,
  rememberIdempotency,
  resolveIdempotency,
  reviewApplication,
  submitDraft,
} from "../store/access-requests.js";
import {
  getMetadataAsset,
  listMetadataAssets,
  resolveMetadataLineage,
} from "../store/metadata.js";

const ERROR_ASSET_NOT_FOUND = "Asset not found";
const ERROR_INVALID_JSON = "Invalid JSON payload";
const ERROR_INVALID_BODY = "Invalid request body";
const ERROR_ACCESS_REQUEST_NOT_FOUND = "Access request not found";

export const metadataApi = new Hono();

metadataApi.get("/", (c) => {
  const q = c.req.query("q") ?? "";
  const type = c.req.query("type");
  const page = Number(c.req.query("page") ?? "1");
  const packId = resolveActivePackId(c.req.query("pack"));
  const result = listMetadataAssets({
    q,
    type,
    page: Number.isFinite(page) ? page : 1,
    packId,
  });
  const body = listMetadataResponseSchema.parse(result);
  return c.json(body);
});

metadataApi.get("/:assetId/lineage", (c) => {
  const assetId = c.req.param("assetId");
  const packId = resolveActivePackId(c.req.query("pack"));
  const lineage = resolveMetadataLineage(assetId, packId);
  if (!lineage) {
    return c.json({ error: ERROR_ASSET_NOT_FOUND }, 404);
  }
  const body = metadataLineageResponseSchema.parse({
    data: {
      assetId,
      upstream: lineage.upstream,
      downstream: lineage.downstream,
      nodes: lineage.nodes,
      edges: lineage.edges,
    },
  });
  return c.json(body);
});

metadataApi.get("/:assetId", (c) => {
  const assetId = c.req.param("assetId");
  const packId = resolveActivePackId(c.req.query("pack"));
  const asset = getMetadataAsset(assetId, packId);
  if (!asset) {
    return c.json({ error: ERROR_ASSET_NOT_FOUND }, 404);
  }
  const body = getMetadataAssetResponseSchema.parse({ data: asset });
  return c.json(body);
});

export const accessRequestsApi = new Hono();

accessRequestsApi.get("/", (c) => {
  const requesterId = c.req.query("requesterId") ?? undefined;
  const pendingOnly = c.req.query("pendingOnly") === "1";
  const body = listAccessApplicationsResponseSchema.parse({
    data: listApplications({ requesterId, pendingOnly }),
  });
  return c.json(body);
});

accessRequestsApi.post("/evaluate", async (c) => {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return c.json({ error: ERROR_INVALID_JSON }, 400);
  }
  const parsed = metadataAccessEvaluateRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: ERROR_INVALID_BODY }, 400);
  }
  try {
    const packId = resolveActivePackId(c.req.query("pack"));
    const decision = await evaluateAccess({ ...parsed.data, packId });
    const body = evaluateAccessResponseSchema.parse({ data: decision });
    return c.json(body);
  } catch {
    return c.json({ error: ERROR_ASSET_NOT_FOUND }, 404);
  }
});

function replayIdempotentSubmit(
  c: { json: (body: unknown, status?: number) => Response },
  idempotencyKey: string | undefined
) {
  if (!idempotencyKey) return null;
  const existing = resolveIdempotency(idempotencyKey);
  if (!existing?.decision) return null;
  const body = submitAccessResponseSchema.parse({
    data: {
      requestId: existing.id,
      status: existing.status,
      decision: existing.decision,
      auditLogged: existing.decision.require_audit,
    },
  });
  return c.json(body, existing.status === "draft" ? 201 : 202);
}

function createDraftApplication(args: {
  assetId: string;
  assetName: string;
  purpose: Parameters<typeof createApplication>[0]["purpose"];
  role: Parameters<typeof createApplication>[0]["role"];
  requesterId: string;
  owner: string;
  decision: NonNullable<ReturnType<typeof resolveIdempotency>>["decision"];
  idempotencyKey?: string;
}) {
  const requestId = randomUUID();
  createApplication({
    id: requestId,
    assetId: args.assetId,
    assetName: args.assetName,
    purpose: args.purpose,
    role: args.role,
    requesterId: args.requesterId,
    status: "draft",
    owner: args.owner,
    decision: args.decision,
  });
  if (args.idempotencyKey) rememberIdempotency(args.idempotencyKey, requestId);
  return submitAccessResponseSchema.parse({
    data: {
      requestId,
      status: "draft",
      decision: args.decision,
      auditLogged: false,
    },
  });
}

async function completeAccessSubmit(
  c: {
    json: (body: unknown, status?: number) => Response;
    req: { query: (name: string) => string | undefined };
  },
  parsed: ReturnType<typeof metadataAccessRequestSchema.safeParse> & {
    success: true;
  },
  idempotencyKey: string | undefined
) {
  let decision;
  let asset;
  try {
    const packId = resolveActivePackId(c.req.query("pack"));
    decision = await evaluateAccess({ ...parsed.data, packId });
    asset = getMetadataAsset(parsed.data.assetId, packId);
  } catch {
    return c.json({ error: ERROR_ASSET_NOT_FOUND }, 404);
  }
  if (!asset) {
    return c.json({ error: ERROR_ASSET_NOT_FOUND }, 404);
  }

  const role = parsed.data.role ?? "analyst";
  const requesterId = parsed.data.requesterId ?? `requester:${role}`;

  if (parsed.data.asDraft) {
    const body = createDraftApplication({
      assetId: parsed.data.assetId,
      assetName: asset.name,
      purpose: parsed.data.purpose,
      role,
      requesterId,
      owner: asset.owner,
      decision,
      idempotencyKey,
    });
    return c.json(body, 201);
  }

  if (decision.need_approval && !parsed.data.approved) {
    return c.json(
      governanceHitlError("Human approval required", decision),
      422
    );
  }

  if (!decision.allow && !decision.need_approval) {
    return c.json(
      governanceDeniedError("Access denied by policy", decision),
      403
    );
  }

  const status =
    decision.need_approval && parsed.data.approved
      ? "pending_approval"
      : decision.allow
        ? "approved"
        : "denied";

  const requestId = randomUUID();
  createApplication({
    id: requestId,
    assetId: parsed.data.assetId,
    assetName: asset.name,
    purpose: parsed.data.purpose,
    role,
    requesterId,
    status,
    owner: asset.owner,
    decision,
  });
  if (idempotencyKey) rememberIdempotency(idempotencyKey, requestId);

  const body = submitAccessResponseSchema.parse({
    data: {
      requestId,
      status,
      decision,
      auditLogged: decision.require_audit,
    },
  });
  return c.json(body, 202);
}

accessRequestsApi.post("/", async (c) => {
  const idempotencyKey = c.req.header("Idempotency-Key")?.trim();
  const replay = replayIdempotentSubmit(c, idempotencyKey);
  if (replay) return replay;

  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return c.json({ error: ERROR_INVALID_JSON }, 400);
  }
  const parsed = metadataAccessRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: ERROR_INVALID_BODY }, 400);
  }
  return completeAccessSubmit(c, parsed, idempotencyKey);
});

accessRequestsApi.post("/:requestId/review", async (c) => {
  const requestId = c.req.param("requestId");
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return c.json({ error: ERROR_INVALID_JSON }, 400);
  }
  const parsed = reviewAccessRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: ERROR_INVALID_BODY }, 400);
  }
  const current = getApplication(requestId);
  if (!current) {
    return c.json(
      governancePolicyErrorSchema.parse({
        error: ERROR_ACCESS_REQUEST_NOT_FOUND,
        code: "NOT_FOUND",
      }),
      404
    );
  }

  const updated =
    parsed.data.decision === "edited"
      ? editApplication({
          id: requestId,
          purpose: parsed.data.purpose,
          role: parsed.data.role,
        })
      : reviewApplication({
          id: requestId,
          decision: parsed.data.decision,
        });

  if (!updated.ok) {
    if (updated.reason === "not_found") {
      return c.json(
        governancePolicyErrorSchema.parse({
          error: ERROR_ACCESS_REQUEST_NOT_FOUND,
          code: "NOT_FOUND",
        }),
        404
      );
    }
    return c.json(
      governanceInvalidTransitionError(
        `Cannot ${parsed.data.decision} when status is ${current.status}`
      ),
      409
    );
  }
  return c.json(reviewAccessResponseSchema.parse({ data: updated.data }));
});

accessRequestsApi.post("/:requestId/submit", (c) => {
  const requestId = c.req.param("requestId");
  const updated = submitDraft(requestId);
  if (!updated.ok) {
    if (updated.reason === "not_found") {
      return c.json(
        governancePolicyErrorSchema.parse({
          error: ERROR_ACCESS_REQUEST_NOT_FOUND,
          code: "NOT_FOUND",
        }),
        404
      );
    }
    return c.json(
      governanceInvalidTransitionError("Cannot submit non-draft"),
      409
    );
  }
  const decision = updated.data.decision;
  if (!decision) {
    return c.json({ error: "Missing policy decision on draft" }, 500);
  }
  return c.json(
    submitAccessResponseSchema.parse({
      data: {
        requestId: updated.data.id,
        status: updated.data.status,
        decision,
        auditLogged: decision.require_audit,
      },
    }),
    202
  );
});

accessRequestsApi.post("/:requestId/cancel", (c) => {
  const requestId = c.req.param("requestId");
  const updated = cancelApplication(requestId);
  if (!updated.ok) {
    if (updated.reason === "not_found") {
      return c.json(
        governancePolicyErrorSchema.parse({
          error: ERROR_ACCESS_REQUEST_NOT_FOUND,
          code: "NOT_FOUND",
        }),
        404
      );
    }
    return c.json(
      governanceInvalidTransitionError("Cannot cancel in current status"),
      409
    );
  }
  return c.json(cancelAccessResponseSchema.parse({ data: updated.data }));
});
