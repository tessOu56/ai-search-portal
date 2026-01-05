import type {
  Recipe,
  CreateRecipeInput,
  UpdateRecipeInput,
  RecipeStep,
} from "./recipe.types";
import { getDish } from "~/features/dish/dish.server";
import { calculateNutrition } from "~/services/nutrition.server";

// 模擬資料庫（使用記憶體 Map）
const recipesMap = new Map<string, Recipe>();

/**
 * 驗證 dishId 是否存在
 */
async function validateDishId(dishId: string): Promise<boolean> {
  const dish = await getDish(dishId);
  return dish !== null;
}

/**
 * 獲取所有 Recipe
 */
export async function getAllRecipes(): Promise<Recipe[]> {
  return Array.from(recipesMap.values());
}

/**
 * 根據 ID 獲取 Recipe
 */
export async function getRecipe(id: string): Promise<Recipe | null> {
  return recipesMap.get(id) || null;
}

/**
 * 根據 dishId 獲取所有相關的 Recipe
 */
export async function getRecipesByDishId(dishId: string): Promise<Recipe[]> {
  const allRecipes = await getAllRecipes();
  return allRecipes.filter((recipe) => recipe.dishId === dishId);
}

/**
 * 根據地區獲取 Recipe
 */
export async function getRecipesByRegion(region: string): Promise<Recipe[]> {
  const allRecipes = await getAllRecipes();
  return allRecipes.filter((recipe) => recipe.region === region);
}

/**
 * 搜尋 Recipe
 */
export async function searchRecipes(query: string): Promise<Recipe[]> {
  const allRecipes = await getAllRecipes();
  const lowerQuery = query.toLowerCase();
  return allRecipes.filter(
    (recipe) =>
      recipe.title.toLowerCase().includes(lowerQuery) ||
      recipe.description?.toLowerCase().includes(lowerQuery) ||
      recipe.dishName.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 建立新的 Recipe（驗證 dishId，優先使用 Dish 的營養）
 */
export async function createRecipe(input: CreateRecipeInput): Promise<Recipe> {
  // 驗證 dishId 必填且存在
  if (!input.dishId) {
    throw new Error("dishId is required");
  }

  const dishExists = await validateDishId(input.dishId);
  if (!dishExists) {
    throw new Error(`Dish with id ${input.dishId} not found`);
  }

  const dish = await getDish(input.dishId);
  if (!dish) {
    throw new Error(`Dish with id ${input.dishId} not found`);
  }

  const now = new Date();
  const id = `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 使用 Dish 的 ingredients 或提供的 ingredients
  const ingredients = input.ingredients || dish.ingredients;

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
  const recipe = await getRecipe(id);
  if (!recipe) {
    return null;
  }

  // 如果 dishId 有變更，需要驗證新的 dishId
  if (input.dishId && input.dishId !== recipe.dishId) {
    const dishExists = await validateDishId(input.dishId);
    if (!dishExists) {
      throw new Error(`Dish with id ${input.dishId} not found`);
    }
  }

  const dishId = input.dishId || recipe.dishId;
  const dish = await getDish(dishId);
  if (!dish) {
    throw new Error(`Dish with id ${dishId} not found`);
  }

  const ingredients = input.ingredients || recipe.ingredients;

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
export async function deleteRecipe(id: string): Promise<boolean> {
  return recipesMap.delete(id);
}

