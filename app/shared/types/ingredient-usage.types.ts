/**
 * IngredientUsage - 原料使用資訊
 * 用於 Dish 和 Recipe 中記錄原料的用量
 *
 * 這是共享類型，定義在 shared/types/ 中以避免跨 feature 依賴
 */
export interface IngredientUsage {
  ingredientId: string;
  ingredientName: string; // 快取，避免頻繁 join
  amount: number; // 用量
  unit: string; // 單位
}
