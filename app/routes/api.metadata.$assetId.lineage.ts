import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import { resolveMetadataLineage } from "~/services/metadata.server";
import { metadataLineageResponseSchema } from "~/shared/contracts";
import { resolveActivePackId } from "~/shared/services/context-pack-loader.server";

/**
 * GET /api/metadata/:assetId/lineage — mirrors Hono reference (T-186).
 */
export function loader({ request, params }: LoaderFunctionArgs) {
  const assetId = params.assetId;
  if (!assetId || assetId === "access-requests") {
    return json({ error: "Asset not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const packId = resolveActivePackId({
    packQuery: url.searchParams.get("pack"),
    cookieHeader: request.headers.get("Cookie"),
    envPack: process.env.CONTEXT_PACK ?? null,
  });

  const lineage = resolveMetadataLineage(assetId, packId);
  if (!lineage) {
    return json({ error: "Asset not found" }, { status: 404 });
  }

  const body = metadataLineageResponseSchema.parse({
    data: {
      assetId,
      upstream: lineage.upstream,
      downstream: lineage.downstream,
      nodes: lineage.nodes,
      edges: lineage.edges,
      ...(lineage.dependencyOrder
        ? { dependencyOrder: lineage.dependencyOrder }
        : {}),
      ...(lineage.cycleError ? { cycleError: lineage.cycleError } : {}),
    },
  });
  return json(body);
}
