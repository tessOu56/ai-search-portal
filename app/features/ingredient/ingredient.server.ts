import type {
  CreateIngredientInput,
  Ingredient,
  UpdateIngredientInput,
} from "./ingredient.types";

// 模擬資料庫（使用記憶體 Map）
const ingredientsMap = new Map<string, Ingredient>();

/**
 * 獲取所有 Ingredient
 */
export function getAllIngredients(): Ingredient[] {
  return [...ingredientsMap.values()];
}

/**
 * 根據 ID 獲取 Ingredient
 */
export function getIngredient(id: string): Ingredient | null {
  return ingredientsMap.get(id) ?? null;
}

/**
 * 根據名稱搜尋 Ingredient
 */
export function searchIngredients(query: string): Ingredient[] {
  const allIngredients = getAllIngredients();
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
export function createIngredient(input: CreateIngredientInput): Ingredient {
  const now = new Date();
  const id = `ingredient_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

  const ingredient: Ingredient = {
    id,
    name: input.name,
    category: input.category,
    unit: input.unit,
    nutritionPerUnit: input.nutritionPerUnit,
    properties: input.properties ?? [],
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
export function updateIngredient(
  id: string,
  input: UpdateIngredientInput
): Ingredient | null {
  const ingredient = getIngredient(id);
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
export function deleteIngredient(id: string): boolean {
  return ingredientsMap.delete(id);
}
