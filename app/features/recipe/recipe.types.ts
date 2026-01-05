import type { NutritionInfo } from "~/shared/types/nutrition.types";
import type { IngredientUsage } from "~/features/dish/dish.types";

/**
 * RecipeStep - 食譜步驟
 */
export interface RecipeStep {
  stepNumber: number;
  instruction: string; // 步驟說明
  duration?: number; // 該步驟所需時間（分鐘）
  temperature?: number; // 溫度（如果有）
  technique?: string; // 工法名稱（如：炒、煮、蒸等）
}

/**
 * Recipe（食譜）- 製作流程記錄（給想自煮者）
 * 必填 dishId，關聯到 Dish
 */
export interface Recipe {
  id: string;
  title: string;
  description?: string;
  region: string; // 地區分類

  // 關聯的 Dish（核心關聯）
  dishId: string; // 必填，關聯到 Dish
  dishName: string; // 快取 Dish 名稱

  // 原料清單（從 Dish 引用或獨立設定）
  ingredients: IngredientUsage[];

  // 製作工法（步驟）
  instructions: RecipeStep[];

  // 計算出的營養資訊（與 Dish 一致，優先使用 Dish 的營養）
  calculatedNutrition: NutritionInfo;

  // 功效（與 Dish 一致）
  properties: string[];

  cookingTime?: number; // 製作時間（分鐘）
  difficulty?: string; // 難度等級（如：簡單、中等、困難）
  servings?: number; // 份量

  createdAt: Date;
  updatedAt: Date;
}

/**
 * 建立 Recipe 的輸入類型
 */
export interface CreateRecipeInput {
  title: string;
  description?: string;
  region: string;
  dishId: string; // 必填
  ingredients?: IngredientUsage[]; // 可選，預設使用 Dish 的 ingredients
  instructions: RecipeStep[];
  cookingTime?: number;
  difficulty?: string;
  servings?: number;
}

/**
 * 更新 Recipe 的輸入類型
 */
export interface UpdateRecipeInput {
  title?: string;
  description?: string;
  region?: string;
  dishId?: string;
  ingredients?: IngredientUsage[];
  instructions?: RecipeStep[];
  cookingTime?: number;
  difficulty?: string;
  servings?: number;
}

