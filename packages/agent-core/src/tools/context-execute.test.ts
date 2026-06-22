import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  executeContextBindings,
  executeContextResolveMetric,
  isContextToolsEnabled,
} from "./execute.js";

const PACK_ENTERPRISE_MAU = "enterprise-mau";
const PACK_AGRI_SUPPLY = "agri-supply";

const METRIC_MAU = "metric-monthly-active-users";

describe("context pack agent tools", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    process.env.METADATA_API_URL = "http://127.0.0.1:3001/api/metadata";
  });

  afterEach(() => {
    process.env = { ...envBackup };
    vi.unstubAllGlobals();
  });

  it("isContextToolsEnabled when METADATA_API_URL is set", () => {
    expect(isContextToolsEnabled()).toBe(true);
  });

  it("resolves enterprise-mau MAU metric (golden)", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            id: METRIC_MAU,
            definition: "Count of unique members with at least one login",
            owner: "CRM Team",
            sourceAssetId: "tbl-customers",
            upstreamJobIds: ["ods_login_event_etl"],
            downstreamDashboardIds: ["Executive Growth Dashboard"],
            qualityRules: ["login_time cannot be null"],
            accessPolicy: "Growth and CRM teams",
            recentChanges: [
              { date: "2026-06-10", change: "Excluded suspended users" },
            ],
          },
        }),
    } as Response);

    const result = await executeContextResolveMetric(
      METRIC_MAU,
      PACK_ENTERPRISE_MAU
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.metric.id).toBe(METRIC_MAU);
      expect(result.metric.owner).toBe("CRM Team");
    }
  });

  it("resolves agri-supply bindings (golden)", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [
            {
              contextRef: "metric-wholesale-basil-north",
              module: "ingredient",
              entityId: "ingredient-basil",
              relation: "measures",
              resolved: true,
              entityName: "Basil",
            },
          ],
        }),
    } as Response);

    const result = await executeContextBindings(
      "metric-wholesale-basil-north",
      PACK_AGRI_SUPPLY
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.bindings).toHaveLength(1);
      expect(result.bindings[0]?.module).toBe("ingredient");
    }
  });
});
