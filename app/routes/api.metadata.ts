import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import { parsePackIdFromRequest } from "~/services/context-pack.server";
import { listMetadataAssets } from "~/services/metadata.server";
import { listMetadataResponseSchema } from "~/shared/contracts";

export function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const type = url.searchParams.get("type") ?? undefined;
  const page = Number(url.searchParams.get("page") ?? "1");
  const packId = parsePackIdFromRequest(request);
  const result = listMetadataAssets({
    q,
    type,
    page: Number.isFinite(page) ? page : 1,
    packId,
  });
  const body = listMetadataResponseSchema.parse(result);
  return json(body);
}
