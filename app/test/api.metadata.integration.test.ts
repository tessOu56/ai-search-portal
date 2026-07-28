/**
 * Metadata API integration tests — MSW mock.
 */

import { describe, expect, it } from "vitest";

import {
  API_MCP_GATEWAY,
  API_METADATA,
  API_METADATA_ACCESS_EVALUATE,
  API_METADATA_ACCESS_REQUESTS,
  apiMetadataAccessRequestReview,
  apiMetadataAsset,
} from "~/shared/api/paths";
import {
  evaluateAccessResponseSchema,
  getMetadataAssetResponseSchema,
  listAccessApplicationsResponseSchema,
  listMetadataResponseSchema,
  mcpToolsCallResponseSchema,
  reviewAccessResponseSchema,
  submitAccessResponseSchema,
} from "~/shared/contracts";

const ASSET_CUSTOMERS = "tbl-customers";

describe("GET /api/metadata", () => {
  it("returns list shaped by listMetadataResponseSchema", async () => {
    const res = await fetch(API_METADATA);
    expect(res.ok).toBe(true);
    const json = (await res.json()) as unknown;
    const parsed = listMetadataResponseSchema.safeParse(json);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.data.length).toBeGreaterThan(0);
    }
  });

  it("filters by type=Table", async () => {
    const res = await fetch(`${API_METADATA}?type=Table`);
    const json = (await res.json()) as unknown;
    const parsed = listMetadataResponseSchema.parse(json);
    expect(parsed.data.every((r) => r.assetType === "Table")).toBe(true);
  });
});

describe("GET /api/metadata/:assetId", () => {
  it("returns customer_profile asset", async () => {
    const res = await fetch(apiMetadataAsset(ASSET_CUSTOMERS));
    expect(res.ok).toBe(true);
    const parsed = getMetadataAssetResponseSchema.parse(await res.json());
    expect(parsed.data.name).toBe("customer_profile");
    expect(parsed.data.owner).toBe("crm-owner@example.com");
    expect(parsed.data.classification).toBe("PII");
    expect(parsed.data.termsOfUse?.length).toBeGreaterThan(0);
    expect(parsed.data.columns?.some((c) => c.sensitive)).toBe(true);
  });

  it("returns 404 for unknown id", async () => {
    const res = await fetch(apiMetadataAsset("missing"));
    expect(res.status).toBe(404);
  });
});

describe("POST access policy", () => {
  it("evaluate returns need_approval for analyst + PII", async () => {
    const res = await fetch(API_METADATA_ACCESS_EVALUATE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetId: ASSET_CUSTOMERS,
        purpose: "analytics",
        role: "analyst",
      }),
    });
    const parsed = evaluateAccessResponseSchema.parse(await res.json());
    expect(parsed.data.need_approval).toBe(true);
    expect(parsed.data.mask_fields).toContain("email");
  });

  it("submit without approval returns 422", async () => {
    const res = await fetch(API_METADATA_ACCESS_REQUESTS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetId: ASSET_CUSTOMERS,
        purpose: "analytics",
        role: "analyst",
      }),
    });
    expect(res.status).toBe(422);
  });

  it("submit with approval returns 202", async () => {
    const res = await fetch(API_METADATA_ACCESS_REQUESTS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetId: ASSET_CUSTOMERS,
        purpose: "analytics",
        role: "analyst",
        approved: true,
      }),
    });
    expect(res.status).toBe(202);
    const parsed = submitAccessResponseSchema.parse(await res.json());
    expect(parsed.data.status).toBe("pending_approval");
  });

  it("lists persisted applications and supports review", async () => {
    const listRes = await fetch(
      `${API_METADATA_ACCESS_REQUESTS}?pendingOnly=1`
    );
    expect(listRes.ok).toBe(true);
    const listed = listAccessApplicationsResponseSchema.parse(
      await listRes.json()
    );
    expect(listed.data.length).toBeGreaterThan(0);
    const pending = listed.data.find((r) => r.status === "pending_approval");
    expect(pending).toBeDefined();
    if (!pending) return;

    const reviewRes = await fetch(apiMetadataAccessRequestReview(pending.id), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "approved" }),
    });
    expect(reviewRes.ok).toBe(true);
    const reviewed = reviewAccessResponseSchema.parse(await reviewRes.json());
    expect(reviewed.data.status).toBe("approved");
    expect(reviewed.data.permissionStatus).toBe("granted");
  });
});

describe("POST /api/mcp/gateway", () => {
  it("metadata.search tool returns results", async () => {
    const res = await fetch(API_MCP_GATEWAY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: "tools/call",
        params: { name: "metadata.search", arguments: { q: "customer" } },
        _meta: {
          protocolVersion: "2026-07-28-rc1",
          clientInfo: { name: "test", version: "1" },
        },
      }),
    });
    const parsed = mcpToolsCallResponseSchema.parse(await res.json());
    expect(parsed.result).toBeDefined();
  });
});
