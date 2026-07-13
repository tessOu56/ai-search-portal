import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import { listAuditEvents } from "~/services/audit-log.server";
import { listAuditEventsResponseSchema } from "~/shared/contracts";

/** GET /api/audit?limit=50 — audit 事件查詢（in-memory 最小版，階段五升級耐久儲存）。 */
export function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const rawLimit = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);
  const limit = Number.isNaN(rawLimit) ? 50 : rawLimit;

  const body = listAuditEventsResponseSchema.parse(listAuditEvents(limit));
  return json(body);
}
