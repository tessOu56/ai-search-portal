/**
 * API 路徑常數 — 程式內單一來源，與 specs/api/handler-mapping.md 對齊。
 * 所有 useFetcher / loader / component 請由此 import，勿硬編碼路徑字串。
 */

export const API_ITEMS = "/api/items";
export const API_METADATA = "/api/metadata";
export const API_CONTEXT_PACKS = "/api/context/packs";
export const API_CONTEXT_BINDINGS = "/api/context/bindings";
export const API_CONTEXT_PACK_SELECT = "/api/context/pack-select";
export const API_METADATA_ACCESS_REQUESTS = "/api/metadata/access-requests";
export const API_METADATA_ACCESS_EVALUATE =
  "/api/metadata/access-requests/evaluate";
export const API_AUDIT = "/api/audit";
export const API_MCP_GATEWAY = "/api/mcp/gateway";
export const API_CHAT = "/api/chat";
export const API_LOCALE = "/api/locale";
export const API_RELEASE_NOTES = "/api/release-notes";
export const API_SITE_META = "/api/site-meta";

export const API_DISHES = "/api/dishes";
export const API_INGREDIENTS = "/api/ingredients";
export const API_RECIPES = "/api/recipes";
export const API_VENDORS = "/api/vendors";
export const API_DISH_VENDORS = "/api/dish-vendors";

export function apiItem(id: string) {
  return `${API_ITEMS}/${id}`;
}

export function apiMetadataAsset(id: string) {
  return `${API_METADATA}/${id}`;
}

export function apiContextMetric(metricId: string, packId?: string) {
  const base = `/api/context/metrics/${metricId}`;
  if (!packId) return base;
  return `${base}?pack=${encodeURIComponent(packId)}`;
}

export function apiContextBindings(ref?: string, packId?: string) {
  const sp = new URLSearchParams();
  if (ref) sp.set("ref", ref);
  if (packId) sp.set("pack", packId);
  const qs = sp.toString();
  return qs ? `${API_CONTEXT_BINDINGS}?${qs}` : API_CONTEXT_BINDINGS;
}

export function apiDish(id: string) {
  return `${API_DISHES}/${id}`;
}

export function apiDishSearch(query: string) {
  return `${API_DISHES}/search?q=${encodeURIComponent(query)}`;
}

export function apiDishVendors(dishId: string) {
  return `${API_DISHES}/${dishId}/vendors`;
}

export function apiDishRecipes(dishId: string) {
  return `${API_DISHES}/${dishId}/recipes`;
}

export function apiIngredient(id: string) {
  return `${API_INGREDIENTS}/${id}`;
}

export function apiRecipe(id: string) {
  return `${API_RECIPES}/${id}`;
}

export function apiVendor(id: string) {
  return `${API_VENDORS}/${id}`;
}

export function apiChatQuery(query: string) {
  return `${API_CHAT}?q=${encodeURIComponent(query)}`;
}
