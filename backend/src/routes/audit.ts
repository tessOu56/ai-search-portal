/**
 * Audit API — implements the OpenAPI `GET /api/audit` contract
 * (listAuditEvents) for the reference HTTP API. Closes drift gap B1:
 * the endpoint existed in the spec and the Remix BFF but not here.
 */

import { listAuditEventsResponseSchema } from "@ai-search-portal/contracts";
import { Hono } from "hono";

import { listAuditEvents } from "../store/audit.js";

export const auditApi = new Hono();

auditApi.get("/", (c) => {
  const rawLimit = Number(c.req.query("limit") ?? "50");
  const limit = Number.isFinite(rawLimit) ? rawLimit : 50;
  const body = listAuditEventsResponseSchema.parse(listAuditEvents(limit));
  return c.json(body);
});
