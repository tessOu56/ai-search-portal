import type { DishStats } from "~/shared/types/dish-stats.types";
import {
  getRecipesByDishId,
  getVendorsByDishId,
} from "~/shared/services/domain.server";

/**
 * 獲取 Dish 的關聯統計
 * 聚合 Recipe 和 Vendor 的數量，避免循環依賴
 * @param dishId Dish ID
 * @returns 統計資訊
 */
export async function getDishStats(dishId: string): Promise<DishStats> {
  // 並行查詢 Recipe 和 Vendor
  const [recipes, vendors] = await Promise.all([
    getRecipesByDishId(dishId),
    getVendorsByDishId(dishId),
  ]);

  return {
    recipeCount: recipes.length,
    vendorCount: vendors.length,
  };
}


