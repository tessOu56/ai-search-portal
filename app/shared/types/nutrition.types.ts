/**
 * 共享營養資訊類型定義
 * 用於 Dish、Recipe 等需要營養資訊的實體
 */

export interface NutritionInfo {
  totalCalories: number; // 總熱量（卡路里）
  totalProtein?: number; // 總蛋白質（g）
  totalFat?: number; // 總脂肪（g）
  totalCarbs?: number; // 總碳水化合物（g）
  totalFiber?: number; // 總纖維（g）
  // 其他營養素可以在此擴充
}

export interface NutritionPerUnit {
  calories: number; // 熱量（卡路里）
  protein?: number; // 蛋白質（g）
  fat?: number; // 脂肪（g）
  carbs?: number; // 碳水化合物（g）
  fiber?: number; // 纖維（g）
  // 其他營養素可以在此擴充
}

