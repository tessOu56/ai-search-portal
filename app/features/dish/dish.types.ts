import type { NutritionInfo } from "~/shared/types/nutrition.types";

/**
 * IngredientUsage - 原料使用資訊
 * 用於 Dish 和 Recipe 中記錄原料的用量
 */
export interface IngredientUsage {
  ingredientId: string;
  ingredientName: string; // 快取，避免頻繁 join
  amount: number; // 用量
  unit: string; // 單位
}

/**
 * Dish（食物）- 核心實體
 * 作為中心節點，連結 Recipe 和 Vendor
 */
export interface Dish {
  id: string;
  name: string;
  description?: string;
  region: string; // 地區分類（與 recipe 一致）

  // 原料組合
  ingredients: IngredientUsage[];

  // 計算出的營養資訊（基於原料組合）
  calculatedNutrition: NutritionInfo;

  // 功效（從原料屬性聚合或手動設定）
  properties: string[]; // 功效列表（如：清熱、補氣、養顏等）

  servings?: number; // 份量（如：2人份）

  // 關聯資訊（可選，通常透過 Service Layer 計算）
  recipeCount?: number; // 相關食譜數量（給想自煮者）
  vendorCount?: number; // 相關購買通路數量（給想購買者）

  createdAt: Date;
  updatedAt: Date;
}

/**
 * 建立 Dish 的輸入類型
 */
export interface CreateDishInput {
  name: string;
  description?: string;
  region: string;
  ingredients: IngredientUsage[];
  properties?: string[];
  servings?: number;
}

/**
 * 更新 Dish 的輸入類型
 */
export interface UpdateDishInput {
  name?: string;
  description?: string;
  region?: string;
  ingredients?: IngredientUsage[];
  properties?: string[];
  servings?: number;
}

