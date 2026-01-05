import type { NutritionPerUnit } from "~/shared/types/nutrition.types";

/**
 * Ingredient（原料）- 系統的基礎單元
 */
export interface Ingredient {
  id: string;
  name: string;
  category?: string; // 原料分類（如：蔬菜、肉類、調味料等）
  unit: string; // 基本單位（如：g, ml, 個）
  nutritionPerUnit: NutritionPerUnit; // 每單位營養資訊
  properties?: string[]; // 功效/屬性（如：清熱、補氣等）
  region?: string; // 地區關聯
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 建立 Ingredient 的輸入類型
 */
export interface CreateIngredientInput {
  name: string;
  category?: string;
  unit: string;
  nutritionPerUnit: NutritionPerUnit;
  properties?: string[];
  region?: string;
}

/**
 * 更新 Ingredient 的輸入類型
 */
export interface UpdateIngredientInput {
  name?: string;
  category?: string;
  unit?: string;
  nutritionPerUnit?: NutritionPerUnit;
  properties?: string[];
  region?: string;
}

