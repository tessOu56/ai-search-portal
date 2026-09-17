import type { LoaderFunctionArgs } from "react-router";

import {
  getPackMetric,
  parsePackIdFromRequest,
} from "~/services/context-pack.server";
import { getContextMetricResponseSchema } from "~/shared/contracts";
import { resolveContentRoot } from "~/shared/services/context-pack-loader.server";

export function loader({ params, request }: LoaderFunctionArgs) {
  const metricId = params.metricId;
  if (!metricId) {
    return Response.json({ error: "Missing metricId" }, { status: 400 });
  }
  const packId = parsePackIdFromRequest(request);
  const metric = getPackMetric(packId, metricId, resolveContentRoot());
  if (!metric) {
    return Response.json({ error: "Metric not found" }, { status: 404 });
  }
  const body = getContextMetricResponseSchema.parse({ data: metric });
  return Response.json(body);
}
