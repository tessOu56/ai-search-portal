import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import { parsePackIdFromRequest } from "~/services/context-pack.server";
import { resolveBindingsForPack } from "~/services/domain-binding.server";
import { getContextBindingsResponseSchema } from "~/shared/contracts";

export function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const contextRef = url.searchParams.get("ref") ?? undefined;
  const packId = parsePackIdFromRequest(request);
  const data = resolveBindingsForPack(packId, contextRef);
  const body = getContextBindingsResponseSchema.parse({ data });
  return json(body);
}
