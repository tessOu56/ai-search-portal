import {
  getContextBindingsResponseSchema,
  getContextMetricResponseSchema,
  listContextPacksResponseSchema,
} from "@ai-search-portal/contracts";
import { Hono } from "hono";

import {
  getPackMetric,
  listContextPacks,
  resolveActivePackId,
  resolveDomainBindings,
} from "../lib/context-pack-loader.js";

const ERROR_METRIC_NOT_FOUND = "Metric not found";

export const contextApi = new Hono();

contextApi.get("/packs", (c) => {
  const body = listContextPacksResponseSchema.parse({
    data: listContextPacks(),
  });
  return c.json(body);
});

contextApi.get("/metrics/:metricId", (c) => {
  const metricId = c.req.param("metricId");
  const packId = resolveActivePackId(c.req.query("pack"));
  const metric = getPackMetric(packId, metricId);
  if (!metric) {
    return c.json({ error: ERROR_METRIC_NOT_FOUND }, 404);
  }
  const body = getContextMetricResponseSchema.parse({ data: metric });
  return c.json(body);
});

contextApi.get("/bindings", (c) => {
  const packId = resolveActivePackId(c.req.query("pack"));
  const contextRef = c.req.query("ref");
  const bindings = resolveDomainBindings(packId, contextRef);
  const data = bindings.map((binding) => ({
    ...binding,
    resolved: false,
  }));
  const body = getContextBindingsResponseSchema.parse({ data });
  return c.json(body);
});
