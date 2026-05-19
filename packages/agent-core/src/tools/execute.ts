/**
 * Tool execution (Phase 3). Calls domain HTTP APIs when enabled via env.
 */

import { listItemsResponseSchema } from "@ai-search-portal/contracts";

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
        message: "response failed contract parse",
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
    const message = e instanceof Error ? e.message : "fetch failed";
    return { ok: false, code: "ITEMS_FETCH_FAILED", message };
  } finally {
    clearTimeout(timer);
  }
}
