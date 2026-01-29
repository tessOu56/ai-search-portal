import {
  aggregateProperties,
  calculateNutrition,
} from "~/services/nutrition.server";
import { getIngredientById } from "~/shared/services/domain.server";
import type { IngredientUsage } from "~/shared/types/ingredient-usage.types";

import type { CreateDishInput, Dish, UpdateDishInput } from "./dish.types";

// 模擬資料庫（使用記憶體 Map）
const dishesMap = new Map<string, Dish>();

/**
 * 驗證並補全 IngredientUsage 的 ingredientName
 */
async function enrichIngredientUsages(
  usages: IngredientUsage[]
): Promise<IngredientUsage[]> {
  return Promise.all(
    usages.map(async (usage: IngredientUsage) => {
      const ingredient = await getIngredientById(usage.ingredientId);
      return {
        ...usage,
        ingredientName: ingredient?.name ?? usage.ingredientName,
      };
    })
  );
}

/**
 * 獲取所有 Dish
 */
export function getAllDishes(): Dish[] {
  return [...dishesMap.values()];
}

/**
 * 根據 ID 獲取 Dish
 */
export function getDish(id: string): Dish | null {
  return dishesMap.get(id) ?? null;
}

/**
 * 根據地區獲取 Dish
 */
export function getDishesByRegion(region: string): Dish[] {
  const allDishes = getAllDishes();
  return allDishes.filter((dish) => dish.region === region);
}

/**
 * 搜尋 Dish
 */
export function searchDishes(query: string): Dish[] {
  const allDishes = getAllDishes();
  const lowerQuery = query.toLowerCase();
  return allDishes.filter(
    (dish) =>
      dish.name.toLowerCase().includes(lowerQuery) ||
      (dish.description?.toLowerCase().includes(lowerQuery) ?? false) ||
      dish.properties.some((prop) => prop.toLowerCase().includes(lowerQuery))
  );
}

/**
 * 建立新的 Dish（包含營養計算和功效聚合）
 */
export async function createDish(input: CreateDishInput): Promise<Dish> {
  const now = new Date();
  const id = `dish_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

  // 補全 ingredientName
  const enrichedIngredients: IngredientUsage[] = await enrichIngredientUsages(
    input.ingredients
  );

  // 計算營養資訊
  const calculatedNutrition = await calculateNutrition(enrichedIngredients);

  // 聚合功效
  const properties =
    input.properties && input.properties.length > 0
      ? input.properties
      : await aggregateProperties(enrichedIngredients);

  const dish: Dish = {
    id,
    name: input.name,
    description: input.description,
    region: input.region,
    ingredients: enrichedIngredients,
    calculatedNutrition,
    properties,
    servings: input.servings,
    createdAt: now,
    updatedAt: now,
  };

  dishesMap.set(id, dish);
  return dish;
}

/**
 * 更新 Dish（如果 ingredients 有變更，重新計算營養和功效）
 */
export async function updateDish(
  id: string,
  input: UpdateDishInput
): Promise<Dish | null> {
  const dish = getDish(id);
  if (!dish) {
    return null;
  }

  const ingredients: IngredientUsage[] = input.ingredients ?? dish.ingredients;
  const enrichedIngredients: IngredientUsage[] =
    await enrichIngredientUsages(ingredients);

  // 如果 ingredients 有變更，重新計算營養和功效
  const needsRecalculation =
    input.ingredients !== undefined || input.properties === undefined; // 如果沒有明確指定 properties，則重新聚合

  let calculatedNutrition = dish.calculatedNutrition;
  let properties = input.properties ?? dish.properties;

  if (needsRecalculation) {
    calculatedNutrition = await calculateNutrition(enrichedIngredients);
    if (input.properties === undefined) {
      properties = await aggregateProperties(enrichedIngredients);
    }
  }

  const updated: Dish = {
    ...dish,
    ...input,
    ingredients: enrichedIngredients,
    calculatedNutrition,
    properties,
    updatedAt: new Date(),
  };

  dishesMap.set(id, updated);
  return updated;
}

/**
 * 刪除 Dish
 */
export function deleteDish(id: string): boolean {
  return dishesMap.delete(id);
}
