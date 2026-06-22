import { describe, expect, it } from "vitest";

import {
  contextMetricSchema,
  contextPackManifestSchema,
  listContextPacksResponseSchema,
} from "~/shared/contracts";

const PACK_ENTERPRISE_MAU = "enterprise-mau";

describe("GET /api/context/packs — MSW mock", () => {
  it("returns pack manifests", async () => {
    const res = await fetch("/api/context/packs");
    expect(res.ok).toBe(true);
    const body: unknown = await res.json();
    const parsed = listContextPacksResponseSchema.safeParse(body);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.data.length).toBeGreaterThanOrEqual(2);
      expect(parsed.data.data.some((p) => p.id === PACK_ENTERPRISE_MAU)).toBe(
        true
      );
      expect(parsed.data.data.some((p) => p.id === "agri-supply")).toBe(true);
    }
  });
});

describe("GET /api/context/metrics — MSW mock", () => {
  it("returns MAU metric for enterprise-mau pack", async () => {
    const res = await fetch(
      `/api/context/metrics/metric-monthly-active-users?pack=${PACK_ENTERPRISE_MAU}`
    );
    expect(res.ok).toBe(true);
    const body: unknown = await res.json();
    const metric = contextMetricSchema.safeParse(
      (body as { data?: unknown }).data
    );
    expect(metric.success).toBe(true);
    if (metric.success) {
      expect(metric.data.sourceAssetId).toBe("tbl-customers");
    }
  });

  it("returns agri metric for agri-supply pack", async () => {
    const res = await fetch(
      "/api/context/metrics/metric-wholesale-basil-north?pack=agri-supply"
    );
    expect(res.ok).toBe(true);
    const body: unknown = await res.json();
    const metric = contextMetricSchema.safeParse(
      (body as { data?: unknown }).data
    );
    expect(metric.success).toBe(true);
  });
});

describe("GET /api/metadata — pack query", () => {
  it("lists agri-supply assets when pack query set", async () => {
    const res = await fetch("/api/metadata?pack=agri-supply");
    expect(res.ok).toBe(true);
    const body = (await res.json()) as { data: { name: string }[] };
    expect(body.data.some((row) => row.name === "fact_procurement_lot")).toBe(
      true
    );
  });
});

describe("GET /api/context/bindings — agri pack", () => {
  it("returns bindings for agri-supply", async () => {
    const res = await fetch("/api/context/bindings?pack=agri-supply");
    expect(res.ok).toBe(true);
    const body = (await res.json()) as {
      data: { contextRef: string; module: string }[];
    };
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0]?.module).toBe("ingredient");
  });
});

describe("context pack manifests", () => {
  it("parses enterprise-mau pack.json shape", () => {
    const manifest = contextPackManifestSchema.parse({
      id: PACK_ENTERPRISE_MAU,
      name: "Enterprise analytics",
      description: "demo",
      defaultLocale: "en",
    });
    expect(manifest.id).toBe(PACK_ENTERPRISE_MAU);
  });
});
