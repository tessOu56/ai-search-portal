import type { LoaderFunctionArgs } from "react-router";

import { parsePackIdFromRequest } from "~/services/context-pack.server";
import { getMetadataAsset } from "~/services/metadata.server";
import { getMetadataAssetResponseSchema } from "~/shared/contracts";

export function loader({ params, request }: LoaderFunctionArgs) {
  const assetId = params.assetId;
  if (!assetId) {
    return Response.json({ error: "Missing asset id" }, { status: 400 });
  }
  const packId = parsePackIdFromRequest(request);
  const asset = getMetadataAsset(assetId, packId);
  if (!asset) {
    return Response.json({ error: "Asset not found" }, { status: 404 });
  }
  const body = getMetadataAssetResponseSchema.parse({ data: asset });
  return Response.json(body);
}
