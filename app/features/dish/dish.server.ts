import type {
  Dish,
  CreateDishInput,
  UpdateDishInput,
  IngredientUsage,
} from "./dish.types";
import { calculateNutrition, aggregateProperties } from "~/services/nutrition.server";
import { getIngredient } from "~/features/ingredient/ingredient.server";

// 模擬資料庫（使用記憶體 Map）
const dishesMap = new Map<string, Dish>();

/**
 * 驗證並補全 IngredientUsage 的 ingredientName
 */
async function enrichIngredientUsages(
  usages: IngredientUsage[]
): Promise<IngredientUsage[]> {
  return Promise.all(
    usages.map(async (usage) => {
      const ingredient = await getIngredient(usage.ingredientId);
      return {
        ...usage,
        ingredientName: ingredient?.name || usage.ingredientName || "未知原料",
      };
    })
  );
}

/**
 * 獲取所有 Dish
 */
export async function getAllDishes(): Promise<Dish[]> {
  return Array.from(dishesMap.values());
}

/**
 * 根據 ID 獲取 Dish
 */
export async function getDish(id: string): Promise<Dish | null> {
  return dishesMap.get(id) || null;
}

/**
 * 根據地區獲取 Dish
 */
export async function getDishesByRegion(region: string): Promise<Dish[]> {
  const allDishes = await getAllDishes();
  return allDishes.filter((dish) => dish.region === region);
}

/**
 * 搜尋 Dish
 */
export async function searchDishes(query: string): Promise<Dish[]> {
  const allDishes = await getAllDishes();
  const lowerQuery = query.toLowerCase();
  return allDishes.filter(
    (dish) =>
      dish.name.toLowerCase().includes(lowerQuery) ||
      dish.description?.toLowerCase().includes(lowerQuery) ||
      dish.properties.some((prop) => prop.toLowerCase().includes(lowerQuery))
  );
}

/**
 * 建立新的 Dish（包含營養計算和功效聚合）
 */
export async function createDish(input: CreateDishInput): Promise<Dish> {
  const now = new Date();
  const id = `dish_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 補全 ingredientName
  const enrichedIngredients = await enrichIngredientUsages(input.ingredients);

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
  const dish = await getDish(id);
  if (!dish) {
    return null;
  }

  const ingredients = input.ingredients || dish.ingredients;
  const enrichedIngredients = await enrichIngredientUsages(ingredients);

  // 如果 ingredients 有變更，重新計算營養和功效
  const needsRecalculation =
    input.ingredients !== undefined ||
    input.properties === undefined; // 如果沒有明確指定 properties，則重新聚合

  let calculatedNutrition = dish.calculatedNutrition;
  let properties = input.properties || dish.properties;

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
export async function deleteDish(id: string): Promise<boolean> {
  return dishesMap.delete(id);
}

