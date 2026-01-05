import type { IngredientUsage } from "~/features/dish/dish.types";
import type { NutritionInfo } from "~/shared/types/nutrition.types";
import { getIngredient } from "~/features/ingredient/ingredient.server";

/**
 * 基於原料組合計算營養資訊
 * @param ingredients 原料使用清單
 * @returns 計算後的營養資訊
 */
export async function calculateNutrition(
  ingredients: IngredientUsage[]
): Promise<NutritionInfo> {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalFat = 0;
  let totalCarbs = 0;
  let totalFiber = 0;

  // 遍歷每個原料，計算總營養
  for (const usage of ingredients) {
    const ingredient = await getIngredient(usage.ingredientId);
    if (!ingredient) {
      continue; // 如果原料不存在，跳過
    }

    // 計算該原料的營養貢獻
    const nutrition = ingredient.nutritionPerUnit;
    const multiplier = usage.amount; // 用量倍數

    totalCalories += (nutrition.calories || 0) * multiplier;
    totalProtein += (nutrition.protein || 0) * multiplier;
    totalFat += (nutrition.fat || 0) * multiplier;
    totalCarbs += (nutrition.carbs || 0) * multiplier;
    totalFiber += (nutrition.fiber || 0) * multiplier;
  }

  return {
    totalCalories: Math.round(totalCalories * 100) / 100, // 保留兩位小數
    totalProtein: Math.round(totalProtein * 100) / 100,
    totalFat: Math.round(totalFat * 100) / 100,
    totalCarbs: Math.round(totalCarbs * 100) / 100,
    totalFiber: Math.round(totalFiber * 100) / 100,
  };
}

/**
 * 聚合原料的功效屬性
 * @param ingredients 原料使用清單
 * @returns 聚合後的功效列表（去重）
 */
export async function aggregateProperties(
  ingredients: IngredientUsage[]
): Promise<string[]> {
  const propertiesSet = new Set<string>();

  // 遍歷每個原料，收集功效屬性
  for (const usage of ingredients) {
    const ingredient = await getIngredient(usage.ingredientId);
    if (!ingredient || !ingredient.properties) {
      continue;
    }

    // 將原料的功效加入集合（自動去重）
    ingredient.properties.forEach((prop) => propertiesSet.add(prop));
  }

  return Array.from(propertiesSet).sort(); // 排序後返回陣列
}

