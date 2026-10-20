import type { ActionFunctionArgs } from "react-router";

import { evaluateMetadataAccess } from "~/services/access-policy.server";
import {
  jsonBodyErrorResponse,
  readJsonBody,
} from "~/services/request-body.server";
import {
  rejectIfRateLimited,
  requirePrincipal,
} from "~/services/route-guard.server";
import {
  evaluateAccessResponseSchema,
  metadataAccessEvaluateRequestSchema,
} from "~/shared/contracts";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const limited = rejectIfRateLimited(request, "governanceWrite");
  if (limited) return limited;

  const auth = requirePrincipal(request);
  if ("response" in auth) return auth.response;

  const raw = await readJsonBody(request);
  if (!raw.ok) return jsonBodyErrorResponse(raw);

  const parsed = metadataAccessEvaluateRequestSchema.safeParse(raw.value);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const decision = evaluateMetadataAccess({
      ...parsed.data,
      role: auth.user.opaRole,
    });
    const body = evaluateAccessResponseSchema.parse({ data: decision });
    return Response.json(body);
  } catch {
    return Response.json({ error: "Asset not found" }, { status: 404 });
  }
}
