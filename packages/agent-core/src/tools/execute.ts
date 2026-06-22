/**
 * Tool execution (Phase 3). Calls domain HTTP APIs when enabled via env.
 */

import {
  DEFAULT_CONTEXT_PACK_ID,
  getContextBindingsResponseSchema,
  getContextMetricResponseSchema,
  listItemsResponseSchema,
  listMetadataResponseSchema,
} from "@ai-search-portal/contracts";

const MSG_CONTRACT_PARSE = "response failed contract parse";
const MSG_FETCH_FAILED = "fetch failed";

export type ItemsLookupMatch = {
  id: string;
  name: string;
  description: string | null;
};

export type ItemsLookupResult =
  | { ok: true; matches: ItemsLookupMatch[]; total: number }
  | { ok: false; code: string; message: string };

export function isItemsLookupEnabled(): boolean {
  if (
    process.env.AGENT_EXECUTE_TOOLS === "1" ||
    process.env.AGENT_EXECUTE_TOOLS === "true"
  ) {
    return true;
  }
  return Boolean(process.env.ITEMS_API_URL?.trim());
}

function itemsApiUrl(): string {
  const trimmed = process.env.ITEMS_API_URL?.trim();
  const base = trimmed ?? "http://127.0.0.1:3001/api/v1/items";
  return base.replace(/\/$/, "");
}

function matchItems(
  items: ItemsLookupMatch[],
  query: string
): ItemsLookupMatch[] {
  const tokens = query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 1);
  if (tokens.length === 0) {
    return items.slice(0, 5);
  }
  return items
    .filter((item) => {
      const hay = `${item.name} ${item.description ?? ""}`.toLowerCase();
      return tokens.some((t) => hay.includes(t));
    })
    .slice(0, 5);
}

/** GET Items API and keyword-filter list (in-memory; no search endpoint yet). */
export async function executeItemsLookup(
  query: string
): Promise<ItemsLookupResult> {
  const url = itemsApiUrl();
  const timeoutMs = Number.parseInt(
    process.env.ITEMS_API_TIMEOUT_MS ?? "3000",
    10
  );
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: ac.signal,
    });
    if (!res.ok) {
      return {
        ok: false,
        code: "ITEMS_HTTP_ERROR",
        message: `HTTP ${res.status}`,
      };
    }
    const body: unknown = await res.json();
    const parsed = listItemsResponseSchema.safeParse(body);
    if (!parsed.success) {
      return {
        ok: false,
        code: "ITEMS_CONTRACT_ERROR",
        message: MSG_CONTRACT_PARSE,
      };
    }
    const items = parsed.data.data.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
    }));
    return {
      ok: true,
      matches: matchItems(items, query),
      total: items.length,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : MSG_FETCH_FAILED;
    return { ok: false, code: "ITEMS_FETCH_FAILED", message };
  } finally {
    clearTimeout(timer);
  }
}

export type MetadataLookupMatch = {
  id: string;
  name: string;
  description: string;
  assetType: string;
};

export type MetadataLookupResult =
  | { ok: true; matches: MetadataLookupMatch[]; total: number }
  | { ok: false; code: string; message: string };

export function isMetadataLookupEnabled(): boolean {
  if (
    process.env.AGENT_EXECUTE_TOOLS === "1" ||
    process.env.AGENT_EXECUTE_TOOLS === "true"
  ) {
    return true;
  }
  return Boolean(process.env.METADATA_API_URL?.trim());
}

function metadataApiUrl(): string {
  const trimmed = process.env.METADATA_API_URL?.trim();
  const base = trimmed ?? "http://127.0.0.1:3001/api/metadata";
  return base.replace(/\/$/, "");
}

function matchMetadata(
  items: MetadataLookupMatch[],
  query: string
): MetadataLookupMatch[] {
  const tokens = query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 1);
  if (tokens.length === 0) {
    return items.slice(0, 5);
  }
  return items
    .filter((item) => {
      const hay =
        `${item.name} ${item.description} ${item.assetType}`.toLowerCase();
      return tokens.some((t) => hay.includes(t));
    })
    .slice(0, 5);
}

/** GET Metadata API and keyword-filter list. */
export async function executeMetadataLookup(
  query: string
): Promise<MetadataLookupResult> {
  const url = new URL(metadataApiUrl());
  url.searchParams.set("q", query.trim());
  const timeoutMs = Number.parseInt(
    process.env.METADATA_API_TIMEOUT_MS ?? "3000",
    10
  );
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: ac.signal,
    });
    if (!res.ok) {
      return {
        ok: false,
        code: "METADATA_HTTP_ERROR",
        message: `HTTP ${res.status}`,
      };
    }
    const body: unknown = await res.json();
    const parsed = listMetadataResponseSchema.safeParse(body);
    if (!parsed.success) {
      return {
        ok: false,
        code: "METADATA_CONTRACT_ERROR",
        message: MSG_CONTRACT_PARSE,
      };
    }
    const items = parsed.data.data.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      assetType: row.assetType,
    }));
    return {
      ok: true,
      matches: matchMetadata(items, query),
      total: parsed.data.pagination.total,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : MSG_FETCH_FAILED;
    return { ok: false, code: "METADATA_FETCH_FAILED", message };
  } finally {
    clearTimeout(timer);
  }
}

export type ContextMetricLookupResult =
  | { ok: true; metric: { id: string; definition: string; owner: string } }
  | { ok: false; code: string; message: string };

export type ContextBindingsLookupResult =
  | {
      ok: true;
      bindings: {
        contextRef: string;
        module: string;
        entityId: string;
        relation: string;
        resolved: boolean;
        entityName?: string;
      }[];
    }
  | { ok: false; code: string; message: string };

function contextApiBase(): string {
  const trimmed = process.env.CONTEXT_API_URL?.trim();
  if (trimmed) return trimmed.replace(/\/$/, "");
  const meta =
    process.env.METADATA_API_URL?.trim() ??
    "http://127.0.0.1:3001/api/metadata";
  return meta.replace(/\/metadata$/, "/context");
}

export function isContextToolsEnabled(): boolean {
  if (
    process.env.AGENT_EXECUTE_TOOLS === "1" ||
    process.env.AGENT_EXECUTE_TOOLS === "true"
  ) {
    return true;
  }
  return Boolean(
    process.env.CONTEXT_API_URL?.trim() ?? process.env.METADATA_API_URL?.trim()
  );
}

/** GET context metric definition from active pack. */
export async function executeContextResolveMetric(
  metricId: string,
  packId = DEFAULT_CONTEXT_PACK_ID
): Promise<ContextMetricLookupResult> {
  const url = new URL(
    `${contextApiBase()}/metrics/${encodeURIComponent(metricId)}`
  );
  url.searchParams.set("pack", packId);
  const timeoutMs = Number.parseInt(
    process.env.METADATA_API_TIMEOUT_MS ?? "3000",
    10
  );
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: ac.signal,
    });
    if (!res.ok) {
      return {
        ok: false,
        code: "CONTEXT_METRIC_HTTP_ERROR",
        message: `HTTP ${res.status}`,
      };
    }
    const body: unknown = await res.json();
    const parsed = getContextMetricResponseSchema.safeParse(body);
    if (!parsed.success) {
      return {
        ok: false,
        code: "CONTEXT_METRIC_CONTRACT_ERROR",
        message: MSG_CONTRACT_PARSE,
      };
    }
    return {
      ok: true,
      metric: {
        id: parsed.data.data.id,
        definition: parsed.data.data.definition,
        owner: parsed.data.data.owner,
      },
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : MSG_FETCH_FAILED;
    return { ok: false, code: "CONTEXT_METRIC_FETCH_FAILED", message };
  } finally {
    clearTimeout(timer);
  }
}

/** GET domain bindings for a context ref in the active pack. */
export async function executeContextBindings(
  contextRef?: string,
  packId = DEFAULT_CONTEXT_PACK_ID
): Promise<ContextBindingsLookupResult> {
  const url = new URL(`${contextApiBase()}/bindings`);
  url.searchParams.set("pack", packId);
  if (contextRef) url.searchParams.set("ref", contextRef);
  const timeoutMs = Number.parseInt(
    process.env.METADATA_API_TIMEOUT_MS ?? "3000",
    10
  );
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: ac.signal,
    });
    if (!res.ok) {
      return {
        ok: false,
        code: "CONTEXT_BINDINGS_HTTP_ERROR",
        message: `HTTP ${res.status}`,
      };
    }
    const body: unknown = await res.json();
    const parsed = getContextBindingsResponseSchema.safeParse(body);
    if (!parsed.success) {
      return {
        ok: false,
        code: "CONTEXT_BINDINGS_CONTRACT_ERROR",
        message: MSG_CONTRACT_PARSE,
      };
    }
    return { ok: true, bindings: parsed.data.data };
  } catch (e) {
    const message = e instanceof Error ? e.message : MSG_FETCH_FAILED;
    return { ok: false, code: "CONTEXT_BINDINGS_FETCH_FAILED", message };
  } finally {
    clearTimeout(timer);
  }
}
