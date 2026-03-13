# 領域模型：食物與食譜

**類型**：reference | **權重**：2

本文件描述「食物與食譜」領域的現況規格：實體、關聯、資料流與跨模組查詢。

---

## 實體關係概覽

```
Ingredient（原料）──┬── IngredientUsage ──► Dish（食物）
                    │         │                    │
                    │         │                    ├── Recipe（食譜，給自煮者）
                    │         │                    └── Vendor（購買通路，給購買者）
                    │         └── NutritionInfo（營養，由原料用量計算）
                    └── NutritionPerUnit（每單位營養）
```

- **Ingredient**：系統基礎單元；單位、每單位營養、功效、地區。
- **Dish**：中心節點；由多筆 IngredientUsage 組成，具計算後營養與功效；可關聯多個 Recipe、多個 Vendor。
- **Recipe**：必關聯一 Dish；含步驟（RecipeStep）、製作時間與難度；營養/功效優先沿用 Dish。
- **Vendor**：通路（restaurant | market | online | grocery）；透過 VendorDish / DishVendor 與 Dish 關聯，含價格、供應狀態。

---

## 型別與檔案對應

| 實體 / 類型                 | 說明                                                                                                                                     | 型別定義位置                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **Ingredient**              | id, name, category, unit, nutritionPerUnit, properties, region                                                                           | `app/features/ingredient/ingredient.types.ts` |
| **IngredientUsage**         | ingredientId, ingredientName, amount, unit                                                                                               | `app/shared/types/ingredient-usage.types.ts`  |
| **NutritionPerUnit**        | calories, protein, fat, carbs, fiber                                                                                                     | `app/shared/types/nutrition.types.ts`         |
| **NutritionInfo**           | totalCalories, totalProtein, …                                                                                                           | `app/shared/types/nutrition.types.ts`         |
| **Dish**                    | id, name, region, ingredients, calculatedNutrition, properties, servings, recipeCount?, vendorCount?                                     | `app/features/dish/dish.types.ts`             |
| **Recipe**                  | id, title, dishId, dishName, ingredients, instructions(RecipeStep[]), calculatedNutrition, properties, cookingTime, difficulty, servings | `app/features/recipe/recipe.types.ts`         |
| **Vendor**                  | id, name, type, dishes(VendorDish[]), region, address, …                                                                                 | `app/features/vendor/vendor.types.ts`         |
| **DishVendor / VendorDish** | dishId, vendorId, price, currency, availability, notes                                                                                   | `app/features/vendor/vendor.types.ts`         |
| **DishStats**               | recipeCount, vendorCount                                                                                                                 | `app/shared/types/dish-stats.types.ts`        |

---

## 資料流與跨模組查詢

- **Feature 邊界**：各 feature 的 CRUD 與查詢在 `app/features/{feature}/*.server.ts`；**禁止** feature 之間直接 import 對方 server。
- **跨模組**：一律經由 `app/shared/services/domain.server.ts`：
  - `getDishById(id)`
  - `getIngredientById(id)`
  - `getRecipesByDishId(dishId)`
  - `getVendorsByDishId(dishId)`
  - `validateDishId(dishId)`
- **營養與功效**：`app/services/nutrition.server.ts` 提供 `calculateNutrition(ingredientUsages)`、`aggregateProperties(ingredientUsages)`；Dish / Recipe 建立或更新時由此計算。

---

## 現況儲存

- 全部為 **in-memory Map**，重啟後清空。
- 無預設種子資料（Dish / Recipe / Ingredient / Vendor 的 Map 初始為空）；若要最小維護可從 [mock-data](mock-data.md) 引入種子。
