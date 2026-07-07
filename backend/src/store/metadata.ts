import {
  type MetadataAssetDetailContract,
  type MetadataAssetSummaryContract,
} from "@ai-search-portal/contracts";

import {
  loadPackAssets,
  resolveActivePackId,
} from "../lib/context-pack-loader.js";

const PAGE_SIZE = 5;

export type ListMetadataParams = {
  q?: string;
  type?: string;
  page?: number;
  packId?: string;
};

function toSummary(
  asset: MetadataAssetDetailContract
): MetadataAssetSummaryContract {
  return {
    id: asset.id,
    name: asset.name,
    description: asset.description,
    assetType: asset.assetType,
    owner: asset.owner,
    tags: asset.tags,
    classification: asset.classification,
    updatedAt: asset.updatedAt,
    fqn: asset.fqn,
  };
}

function loadAssetsForPack(packId: string): MetadataAssetDetailContract[] {
  return loadPackAssets(packId);
}

export function listMetadataAssets(params: ListMetadataParams = {}) {
  const q = params.q?.trim().toLowerCase() ?? "";
  const typeFilter = params.type?.trim();
  const page = Math.max(1, params.page ?? 1);
  const packId = params.packId ?? resolveActivePackId();

  let rows = loadAssetsForPack(packId);
  if (q.length > 0) {
    rows = rows.filter((row) => {
      const hay =
        `${row.name} ${row.description} ${row.fqn} ${row.tags.join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }
  if (typeFilter) {
    rows = rows.filter(
      (row) => row.assetType.toLowerCase() === typeFilter.toLowerCase()
    );
  }

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;

  return {
    data: rows.slice(start, start + PAGE_SIZE).map(toSummary),
    pagination: {
      page: safePage,
      pageSize: PAGE_SIZE,
      total,
      totalPages,
    },
  };
}

export function getMetadataAsset(assetId: string, packId?: string) {
  const activePack = packId ?? resolveActivePackId();
  return loadAssetsForPack(activePack).find((a) => a.id === assetId) ?? null;
}

export function resolveMetadataLineage(assetId: string, packId?: string) {
  const activePack = packId ?? resolveActivePackId();
  const asset = getMetadataAsset(assetId, activePack);
  if (!asset) return null;

  const all = loadAssetsForPack(activePack);
  const upstream = asset.upstreamIds
    .map((id) => all.find((a) => a.id === id))
    .filter((a): a is MetadataAssetDetailContract => a != null)
    .map(toSummary);
  const downstream = asset.downstreamIds
    .map((id) => all.find((a) => a.id === id))
    .filter((a): a is MetadataAssetDetailContract => a != null)
    .map(toSummary);

  const nodes = [
    ...upstream.map((u) => ({
      id: u.id,
      label: u.name,
      type: u.assetType.toLowerCase() as
        | "table"
        | "column"
        | "api"
        | "dashboard"
        | "database",
    })),
    {
      id: asset.id,
      label: asset.name,
      type: asset.assetType.toLowerCase() as
        | "table"
        | "column"
        | "api"
        | "dashboard"
        | "database",
    },
    ...downstream.map((d) => ({
      id: d.id,
      label: d.name,
      type: d.assetType.toLowerCase() as
        | "table"
        | "column"
        | "api"
        | "dashboard"
        | "database",
    })),
  ];

  const edges = [
    ...asset.upstreamIds.map((source) => ({ source, target: asset.id })),
    ...asset.downstreamIds.map((target) => ({ source: asset.id, target })),
  ];

  return { asset, upstream, downstream, nodes, edges };
}
