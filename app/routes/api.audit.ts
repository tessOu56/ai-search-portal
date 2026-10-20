import type { LoaderFunctionArgs } from "react-router";

import { listAuditEvents } from "~/services/audit-log.server";
import {
  rejectIfRateLimited,
  requirePrincipal,
} from "~/services/route-guard.server";
import { listAuditEventsResponseSchema } from "~/shared/contracts";

/** GET /api/audit?limit=50 — admin-only audit query. */
export function loader({ request }: LoaderFunctionArgs) {
  const limited = rejectIfRateLimited(request, "audit");
  if (limited) return limited;

  const auth = requirePrincipal(request, ["admin"]);
  if ("response" in auth) return auth.response;

  const url = new URL(request.url);
  const rawLimit = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);
  const limit = Number.isNaN(rawLimit) ? 50 : rawLimit;

  const body = listAuditEventsResponseSchema.parse(listAuditEvents(limit));
  return Response.json(body);
}
