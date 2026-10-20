import { describe, expect, it } from "vitest";

import {
  getMetadataAsset,
  listAllMetadataSummaries,
  listMetadataAssets,
  resolveMetadataLineage,
} from "./metadata.server";

const PACK = "enterprise-mau";
const CUSTOMERS = "tbl-customers";

describe("listMetadataAssets", () => {
  it("paginates the default pack and clamps overflow pages", () => {
    const first = listMetadataAssets({ packId: PACK });
    expect(first.data.length).toBeGreaterThan(0);
    expect(first.data.length).toBeLessThanOrEqual(first.pagination.pageSize);
    expect(first.pagination.page).toBe(1);
    expect(first.pagination.total).toBeGreaterThan(first.pagination.pageSize);

    const overflow = listMetadataAssets({ packId: PACK, page: 99 });
    expect(overflow.pagination.page).toBe(overflow.pagination.totalPages);
    expect(overflow.data.length).toBeGreaterThan(0);
  });

  it("filters by query and asset type", () => {
    const byName = listMetadataAssets({ packId: PACK, q: "customer" });
    expect(byName.data.some((row) => row.id === CUSTOMERS)).toBe(true);
    expect(byName.pagination.total).toBeGreaterThan(0);

    const tables = listMetadataAssets({
      packId: PACK,
      type: "Table",
      q: "customer",
    });
    expect(tables.data.every((row) => row.assetType === "Table")).toBe(true);

    const empty = listMetadataAssets({ packId: PACK, q: "zzz-no-match-xyz" });
    expect(empty.data).toEqual([]);
    expect(empty.pagination.total).toBe(0);
  });
});

describe("getMetadataAsset", () => {
  it("returns the PII customer profile with sensitive columns", () => {
    const asset = getMetadataAsset(CUSTOMERS, PACK);
    expect(asset?.name).toBe("customer_profile");
    expect(asset?.classification).toBe("PII");
    expect(asset?.columns?.some((column) => column.sensitive)).toBe(true);
  });

  it("returns null for an unknown id", () => {
    expect(getMetadataAsset("missing-asset", PACK)).toBeNull();
  });
});

describe("resolveMetadataLineage", () => {
  it("walks upstream and downstream for customer_profile", () => {
    const lineage = resolveMetadataLineage(CUSTOMERS, PACK);
    expect(lineage).not.toBeNull();
    if (!lineage) return;

    expect(lineage.asset.id).toBe(CUSTOMERS);
    expect(lineage.upstream.some((row) => row.id === "db-analytics")).toBe(
      true
    );
    expect(lineage.downstream.length).toBeGreaterThan(0);
    expect(lineage.nodes.some((node) => node.id === CUSTOMERS)).toBe(true);
    expect(
      lineage.edges.some(
        (edge) => edge.source === "db-analytics" && edge.target === CUSTOMERS
      )
    ).toBe(true);
    expect(lineage.cycleError).toBeNull();
    expect(lineage.dependencyOrder.map((node) => node.id)).toContain(CUSTOMERS);
  });

  it("returns null when the asset is missing", () => {
    expect(resolveMetadataLineage("missing-asset", PACK)).toBeNull();
  });
});

describe("listAllMetadataSummaries", () => {
  it("returns unpaginated summaries for the pack", () => {
    const all = listAllMetadataSummaries(PACK);
    const paged = listMetadataAssets({ packId: PACK });
    expect(all.length).toBe(paged.pagination.total);
    expect(all.some((row) => row.id === CUSTOMERS)).toBe(true);
  });
});
