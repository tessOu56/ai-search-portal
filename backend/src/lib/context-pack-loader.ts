import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  type ContextGlossaryTermContract,
  type ContextMetricContract,
  contextMetricSchema,
  type ContextPackManifestContract,
  contextPackManifestSchema,
  DEFAULT_CONTEXT_PACK_ID,
  type DomainBindingContract,
  domainBindingsFileSchema,
  type MetadataAssetDetailContract,
  metadataAssetDetailSchema,
} from "@ai-search-portal/contracts";

const PACKS_DIR = "content/context-packs";

// Pack ids can arrive from a query string. Restrict to a safe slug so they
// can never traverse outside content/context-packs (e.g. "../../etc").
const SAFE_PACK_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/i;

function sanitizePackId(candidate: string | null | undefined): string | null {
  const trimmed = candidate?.trim();
  if (!trimmed || !SAFE_PACK_ID_PATTERN.test(trimmed)) return null;
  return trimmed;
}

type PackCache = {
  assets: Map<string, MetadataAssetDetailContract[]>;
  metrics: Map<string, ContextMetricContract[]>;
  glossary: Map<string, ContextGlossaryTermContract[]>;
  bindings: Map<string, DomainBindingContract[]>;
  manifests: ContextPackManifestContract[] | null;
};

function createPackCache(): PackCache {
  return {
    assets: new Map(),
    metrics: new Map(),
    glossary: new Map(),
    bindings: new Map(),
    manifests: null,
  };
}

const cache: PackCache = createPackCache();

function repoRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "..", "..", "..");
}

function readJsonFile(filePath: string): unknown {
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as unknown;
}

function packsRoot(): string {
  return path.join(repoRoot(), PACKS_DIR);
}

function packDir(packId: string): string {
  const root = packsRoot();
  // Defense in depth: even a validated id must resolve strictly inside root.
  const dir = path.resolve(root, packId);
  if (!dir.startsWith(root + path.sep)) {
    throw new Error(`Invalid context pack id: ${packId}`);
  }
  return dir;
}

function loadJsonArray<T>(
  filePath: string,
  parseItem: (item: unknown) => T
): T[] {
  if (!existsSync(filePath)) return [];
  const data = readJsonFile(filePath);
  if (!Array.isArray(data)) return [];
  return data.map((item) => parseItem(item));
}

export function listContextPackIds(): string[] {
  const root = packsRoot();
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((id) => existsSync(path.join(root, id, "pack.json")));
}

export function listContextPacks(): ContextPackManifestContract[] {
  if (cache.manifests) return cache.manifests;
  const ids = listContextPackIds();
  const manifests = ids.map((id) => {
    const manifestPath = path.join(packDir(id), "pack.json");
    return contextPackManifestSchema.parse(readJsonFile(manifestPath));
  });
  cache.manifests = manifests;
  return manifests;
}

export function loadPackAssets(packId: string): MetadataAssetDetailContract[] {
  const cached = cache.assets.get(packId);
  if (cached) return cached;
  const filePath = path.join(packDir(packId), "assets.json");
  const assets = loadJsonArray(filePath, (item) =>
    metadataAssetDetailSchema.parse(item)
  ).map((asset) => ({
    ...asset,
    packId: asset.packId ?? packId,
  }));
  cache.assets.set(packId, assets);
  return assets;
}

export function loadPackMetrics(packId: string): ContextMetricContract[] {
  const cached = cache.metrics.get(packId);
  if (cached) return cached;
  const filePath = path.join(packDir(packId), "metrics.json");
  const metrics = loadJsonArray(filePath, (item) =>
    contextMetricSchema.parse(item)
  );
  cache.metrics.set(packId, metrics);
  return metrics;
}

function loadPackBindings(packId: string): DomainBindingContract[] {
  const cached = cache.bindings.get(packId);
  if (cached) return cached;
  const filePath = path.join(packDir(packId), "bindings.json");
  if (!existsSync(filePath)) {
    cache.bindings.set(packId, []);
    return [];
  }
  const parsed = domainBindingsFileSchema.parse(readJsonFile(filePath));
  cache.bindings.set(packId, parsed.bindings);
  return parsed.bindings;
}

export function getPackMetric(
  packId: string,
  metricId: string
): ContextMetricContract | null {
  return loadPackMetrics(packId).find((m) => m.id === metricId) ?? null;
}

export function resolveDomainBindings(
  packId: string,
  contextRef?: string
): DomainBindingContract[] {
  const all = loadPackBindings(packId);
  if (!contextRef) return all;
  return all.filter((b) => b.contextRef === contextRef);
}

export function resolveActivePackId(packQuery?: string | null): string {
  // Untrusted query values fall through to env/default when they fail
  // sanitizePackId, so a hostile value can never reach the fs layer.
  const fromQuery = sanitizePackId(packQuery);
  if (fromQuery) return fromQuery;
  const fromEnv = sanitizePackId(process.env.CONTEXT_PACK);
  if (fromEnv) return fromEnv;
  return DEFAULT_CONTEXT_PACK_ID;
}

export { DEFAULT_CONTEXT_PACK_ID };
