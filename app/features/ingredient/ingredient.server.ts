import type {
  Ingredient,
  CreateIngredientInput,
  UpdateIngredientInput,
} from "./ingredient.types";

// 模擬資料庫（使用記憶體 Map）
const ingredientsMap = new Map<string, Ingredient>();

/**
 * 獲取所有 Ingredient
 */
export async function getAllIngredients(): Promise<Ingredient[]> {
  return Array.from(ingredientsMap.values());
}

/**
 * 根據 ID 獲取 Ingredient
 */
export async function getIngredient(id: string): Promise<Ingredient | null> {
  return ingredientsMap.get(id) || null;
}

/**
 * 根據名稱搜尋 Ingredient
 */
export async function searchIngredients(
  query: string
): Promise<Ingredient[]> {
  const allIngredients = await getAllIngredients();
  const lowerQuery = query.toLowerCase();
  return allIngredients.filter(
    (ingredient) =>
      ingredient.name.toLowerCase().includes(lowerQuery) ||
      ingredient.category?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 建立新的 Ingredient
 */
export async function createIngredient(
  input: CreateIngredientInput
): Promise<Ingredient> {
  const now = new Date();
  const id = `ingredient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const ingredient: Ingredient = {
    id,
    name: input.name,
    category: input.category,
    unit: input.unit,
    nutritionPerUnit: input.nutritionPerUnit,
    properties: input.properties || [],
    region: input.region,
    createdAt: now,
    updatedAt: now,
  };

  ingredientsMap.set(id, ingredient);
  return ingredient;
}

/**
 * 更新 Ingredient
 */
export async function updateIngredient(
  id: string,
  input: UpdateIngredientInput
): Promise<Ingredient | null> {
  const ingredient = await getIngredient(id);
  if (!ingredient) {
    return null;
  }

  const updated: Ingredient = {
    ...ingredient,
    ...input,
    updatedAt: new Date(),
  };

  ingredientsMap.set(id, updated);
  return updated;
}

/**
 * 刪除 Ingredient
 */
export async function deleteIngredient(id: string): Promise<boolean> {
  return ingredientsMap.delete(id);
}

