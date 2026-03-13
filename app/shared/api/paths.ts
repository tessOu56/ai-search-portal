/**
 * API 路徑常數 — 程式內單一來源，與 specs/api/handler-mapping.md 對齊。
 * 所有 useFetcher / loader / component 請由此 import，勿硬編碼路徑字串。
 */

export const API_ITEMS = "/api/items";
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
