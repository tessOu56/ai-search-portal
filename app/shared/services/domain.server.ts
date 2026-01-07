/**
 * Domain Service Layer
 * 
 * 提供跨 feature 查詢的中介層，避免 features 之間直接依賴。
 * 
 * 這是唯一允許直接調用多個 feature server 的地方。
 * 所有 features 都應該通過此層進行跨 feature 通信。
 */

import type { Dish } from "~/features/dish/dish.types";
import type { Ingredient } from "~/features/ingredient/ingredient.types";
import type { Recipe } from "~/features/recipe/recipe.types";
import type { Vendor } from "~/features/vendor/vendor.types";
import { getDish } from "~/features/dish/dish.server";
import { getIngredient } from "~/features/ingredient/ingredient.server";
import { getRecipesByDishId as getRecipesByDishIdFromRecipe } from "~/features/recipe/recipe.server";
import { getVendorsByDishId as getVendorsByDishIdFromVendor } from "~/features/vendor/vendor.server";

/**
 * 根據 ID 獲取 Dish
 * 封裝 dish feature 的查詢，提供統一的 shared 介面
 */
export async function getDishById(id: string): Promise<Dish | null> {
  return getDish(id);
}

/**
 * 根據 ID 獲取 Ingredient
 * 封裝 ingredient feature 的查詢，提供統一的 shared 介面
 */
export async function getIngredientById(id: string): Promise<Ingredient | null> {
  return getIngredient(id);
}

/**
 * 根據 dishId 獲取所有相關的 Recipe
 * 封裝 recipe feature 的查詢，提供統一的 shared 介面
 */
export async function getRecipesByDishId(dishId: string): Promise<Recipe[]> {
  return getRecipesByDishIdFromRecipe(dishId);
}

/**
 * 根據 dishId 獲取所有相關的 Vendor
 * 封裝 vendor feature 的查詢，提供統一的 shared 介面
 */
export async function getVendorsByDishId(dishId: string): Promise<Vendor[]> {
  return getVendorsByDishIdFromVendor(dishId);
}

/**
 * 驗證 dishId 是否存在
 * 共享的驗證邏輯，避免在多個 feature 中重複定義
 */
export async function validateDishId(dishId: string): Promise<boolean> {
  const dish = await getDishById(dishId);
  return dish !== null;
}

