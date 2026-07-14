import { randomUUID } from "node:crypto";

import {
  evaluateAccessResponseSchema,
  getMetadataAssetResponseSchema,
  listMetadataResponseSchema,
  metadataAccessEvaluateRequestSchema,
  metadataAccessRequestSchema,
  metadataLineageResponseSchema,
  submitAccessResponseSchema,
} from "@ai-search-portal/contracts";
import { Hono } from "hono";

import { resolveActivePackId } from "../lib/context-pack-loader.js";
import { evaluateAccess } from "../policies/evaluate-access.js";
import {
  getMetadataAsset,
  listMetadataAssets,
  resolveMetadataLineage,
} from "../store/metadata.js";

const ERROR_ASSET_NOT_FOUND = "Asset not found";

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

accessRequestsApi.post("/evaluate", async (c) => {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON payload" }, 400);
  }
  const parsed = metadataAccessEvaluateRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: "Invalid request body" }, 400);
  }
  try {
    // Pack-aware evaluation: mirror the sibling metadata routes (and the
    // Remix BFF, which passes packId) so non-default packs can be evaluated.
    const packId = resolveActivePackId(c.req.query("pack"));
    const decision = await evaluateAccess({ ...parsed.data, packId });
    const body = evaluateAccessResponseSchema.parse({ data: decision });
    return c.json(body);
  } catch {
    return c.json({ error: ERROR_ASSET_NOT_FOUND }, 404);
  }
});

accessRequestsApi.post("/", async (c) => {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON payload" }, 400);
  }
  const parsed = metadataAccessRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: "Invalid request body" }, 400);
  }

  let decision;
  try {
    const packId = resolveActivePackId(c.req.query("pack"));
    decision = await evaluateAccess({ ...parsed.data, packId });
  } catch {
    return c.json({ error: ERROR_ASSET_NOT_FOUND }, 404);
  }

  if (decision.need_approval && !parsed.data.approved) {
    return c.json({ error: "Human approval required", decision }, 422);
  }

  if (!decision.allow && !decision.need_approval) {
    return c.json({ error: "Access denied by policy", decision }, 403);
  }

  const status =
    decision.need_approval && parsed.data.approved
      ? "pending_approval"
      : decision.allow
        ? "approved"
        : "denied";

  const body = submitAccessResponseSchema.parse({
    data: {
      requestId: randomUUID(),
      status,
      decision,
      auditLogged: decision.require_audit,
    },
  });
  return c.json(body, 202);
});
