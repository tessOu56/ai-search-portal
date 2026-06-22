import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import { parsePackIdFromRequest } from "~/services/context-pack.server";
import { getMetadataAsset } from "~/services/metadata.server";
import { getMetadataAssetResponseSchema } from "~/shared/contracts";

export function loader({ params, request }: LoaderFunctionArgs) {
  const assetId = params.assetId;
  if (!assetId) {
    return json({ error: "Missing asset id" }, { status: 400 });
  }
  const packId = parsePackIdFromRequest(request);
  const asset = getMetadataAsset(assetId, packId);
  if (!asset) {
    return json({ error: "Asset not found" }, { status: 404 });
  }
  const body = getMetadataAssetResponseSchema.parse({ data: asset });
  return json(body);
}
