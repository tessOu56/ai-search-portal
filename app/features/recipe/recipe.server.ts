import { calculateNutrition } from "~/services/nutrition.server";
import { getDishById } from "~/shared/services/domain.server";
import { notFound, validationError } from "~/shared/utils/errors";

import type {
  CreateRecipeInput,
  Recipe,
  UpdateRecipeInput,
} from "./recipe.types";

// 模擬資料庫（使用記憶體 Map）
const recipesMap = new Map<string, Recipe>();

/**
 * 獲取所有 Recipe
 */
export function getAllRecipes(): Recipe[] {
  return [...recipesMap.values()];
}

/**
 * 根據 ID 獲取 Recipe
 */
export function getRecipe(id: string): Recipe | null {
  return recipesMap.get(id) ?? null;
}

/**
 * 根據 dishId 獲取所有相關的 Recipe
 */
export function getRecipesByDishId(dishId: string): Recipe[] {
  const allRecipes = getAllRecipes();
  return allRecipes.filter((recipe) => recipe.dishId === dishId);
}

/**
 * 根據地區獲取 Recipe
 */
export function getRecipesByRegion(region: string): Recipe[] {
  const allRecipes = getAllRecipes();
  return allRecipes.filter((recipe) => recipe.region === region);
}

/**
 * 搜尋 Recipe
 */
export function searchRecipes(query: string): Recipe[] {
  const allRecipes = getAllRecipes();
  const lowerQuery = query.toLowerCase();
  return allRecipes.filter(
    (recipe) =>
      recipe.title.toLowerCase().includes(lowerQuery) ||
      (recipe.description?.toLowerCase().includes(lowerQuery) ?? false) ||
      recipe.dishName.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 建立新的 Recipe（驗證 dishId，優先使用 Dish 的營養）
 */
export async function createRecipe(input: CreateRecipeInput): Promise<Recipe> {
  // 驗證 dishId 必填且存在
  if (!input.dishId) {
    throw validationError("dishId is required");
  }

  // 直接獲取 dish，避免重複查詢
  const dish = await getDishById(input.dishId);
  if (!dish) {
    throw notFound("Dish", input.dishId);
  }

  const now = new Date();
  const id = `recipe_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

  // 使用 Dish 的 ingredients 或提供的 ingredients
  const ingredients = input.ingredients ?? dish.ingredients;

  // 優先使用 Dish 的營養資訊，但如果 ingredients 不同則重新計算
  let calculatedNutrition = dish.calculatedNutrition;
  if (input.ingredients && input.ingredients.length > 0) {
    // 如果提供了不同的 ingredients，重新計算營養
    calculatedNutrition = await calculateNutrition(ingredients);
  }

  // 使用 Dish 的 properties
  const properties = dish.properties;

  const recipe: Recipe = {
    id,
    title: input.title,
    description: input.description,
    region: input.region,
    dishId: input.dishId,
    dishName: dish.name,
    ingredients,
    instructions: input.instructions,
    calculatedNutrition,
    properties,
    cookingTime: input.cookingTime,
    difficulty: input.difficulty,
    servings: input.servings,
    createdAt: now,
    updatedAt: now,
  };

  recipesMap.set(id, recipe);
  return recipe;
}

/**
 * 更新 Recipe
 */
export async function updateRecipe(
  id: string,
  input: UpdateRecipeInput
): Promise<Recipe | null> {
  const recipe = getRecipe(id);
  if (!recipe) {
    return null;
  }

  // 如果 dishId 有變更，需要獲取新的 dish
  const dishId = input.dishId ?? recipe.dishId;
  const dish = await getDishById(dishId);
  if (!dish) {
    throw notFound("Dish", dishId);
  }

  const ingredients = input.ingredients ?? recipe.ingredients;

  // 如果 ingredients 有變更，重新計算營養
  let calculatedNutrition = recipe.calculatedNutrition;
  if (input.ingredients !== undefined) {
    calculatedNutrition = await calculateNutrition(ingredients);
  }

  const updated: Recipe = {
    ...recipe,
    ...input,
    dishId,
    dishName: dish.name,
    ingredients,
    calculatedNutrition,
    properties: dish.properties, // 始終使用 Dish 的 properties
    updatedAt: new Date(),
  };

  recipesMap.set(id, updated);
  return updated;
}

/**
 * 刪除 Recipe
 */
export function deleteRecipe(id: string): boolean {
  return recipesMap.delete(id);
}
