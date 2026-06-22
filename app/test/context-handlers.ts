/**
 * MSW handlers for context pack APIs.
 */

import { http, HttpResponse } from "msw";

import { resolveBindingsForPack } from "~/services/domain-binding.server";
import {
  getContextBindingsResponseSchema,
  getContextMetricResponseSchema,
  listContextPacksResponseSchema,
} from "~/shared/contracts";
import {
  getPackMetric,
  listContextPacks,
  resolveActivePackId,
  resolveContentRoot,
} from "~/shared/services/context-pack-loader.server";

function packFromRequest(request: Request): string {
  const url = new URL(request.url);
  return resolveActivePackId({
    packQuery: url.searchParams.get("pack"),
    cookieHeader: request.headers.get("Cookie"),
    envPack: process.env.CONTEXT_PACK ?? null,
  });
}

export const contextHandlers = [
  http.get("/api/context/packs", () => {
    const body = listContextPacksResponseSchema.parse({
      data: listContextPacks(resolveContentRoot()),
    });
    return HttpResponse.json(body);
  }),

  http.get("/api/context/metrics/:metricId", ({ params, request }) => {
    const packId = packFromRequest(request);
    const metric = getPackMetric(
      packId,
      String(params.metricId),
      resolveContentRoot()
    );
    if (!metric) {
      return HttpResponse.json({ error: "Metric not found" }, { status: 404 });
    }
    const body = getContextMetricResponseSchema.parse({ data: metric });
    return HttpResponse.json(body);
  }),

  http.get("/api/context/bindings", ({ request }) => {
    const url = new URL(request.url);
    const packId = packFromRequest(request);
    const contextRef = url.searchParams.get("ref") ?? undefined;
    const data = resolveBindingsForPack(packId, contextRef);
    const body = getContextBindingsResponseSchema.parse({ data });
    return HttpResponse.json(body);
  }),

  http.post("/api/context/pack-select", () => {
    return HttpResponse.json(
      { ok: true },
      {
        status: 303,
        headers: { Location: "/metadata?pack=enterprise-mau" },
      }
    );
  }),
];
