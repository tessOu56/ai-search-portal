/**
 * 領域種子資料：僅在 Map 為空時執行一次，供最小維護開發與展示用。
 * 詳見 docs/product/mock-data.md
 */

import { createDish } from "~/features/dish/dish.server";
import {
  createIngredient,
  getAllIngredients,
} from "~/features/ingredient/ingredient.server";
import { createRecipe } from "~/features/recipe/recipe.server";
import {
  createDishVendor,
  createVendor,
} from "~/features/vendor/vendor.server";

let seeded = false;

export async function ensureSeeded(): Promise<void> {
  if (seeded) return;
  seeded = true;

  // 若已有資料（例如測試注入），不覆寫
  const existingIngredients = getAllIngredients();
  if (existingIngredients.length > 0) return;

  const ing1 = createIngredient({
    name: "紅棗",
    category: "中藥材",
    unit: "g",
    nutritionPerUnit: {
      calories: 2.5,
      protein: 0.2,
      fat: 0.03,
      carbs: 0.65,
      fiber: 0.1,
    },
    properties: ["補氣", "養血"],
    region: "台灣",
  });

  const ing2 = createIngredient({
    name: "枸杞",
    category: "中藥材",
    unit: "g",
    nutritionPerUnit: {
      calories: 3,
      protein: 0.3,
      fat: 0.1,
      carbs: 0.6,
      fiber: 0.2,
    },
    properties: ["明目", "養肝"],
    region: "台灣",
  });

  const dish = await createDish({
    name: "紅棗枸杞茶",
    description: "簡易養生茶飲",
    region: "台灣",
    ingredients: [
      {
        ingredientId: ing1.id,
        ingredientName: ing1.name,
        amount: 10,
        unit: "g",
      },
      {
        ingredientId: ing2.id,
        ingredientName: ing2.name,
        amount: 5,
        unit: "g",
      },
    ],
    servings: 2,
  });

  await createRecipe({
    title: "紅棗枸杞茶作法",
    description: "5 分鐘完成",
    region: "台灣",
    dishId: dish.id,
    instructions: [
      { stepNumber: 1, instruction: "紅棗、枸杞洗淨", duration: 1 },
      {
        stepNumber: 2,
        instruction: "沸水沖泡，燜 3 分鐘",
        duration: 3,
        technique: "沖泡",
      },
    ],
    cookingTime: 5,
    difficulty: "簡單",
    servings: 2,
  });

  const vendor = createVendor({
    name: "示範養生館",
    type: "market",
    description: "種子資料用通路",
    region: "台灣",
  });

  await createDishVendor({
    dishId: dish.id,
    vendorId: vendor.id,
    price: 99,
    currency: "TWD",
    availability: true,
  });

  await seedAgriBindingEntities();
}

async function seedAgriBindingEntities(): Promise<void> {
  const { putIngredient } =
    await import("~/features/ingredient/ingredient.server");
  const { putVendor } = await import("~/features/vendor/vendor.server");
  const { putDish } = await import("~/features/dish/dish.server");

  putIngredient("ingredient-basil", {
    name: "Basil",
    category: "spice",
    unit: "g",
    nutritionPerUnit: {
      calories: 0.23,
      protein: 0.03,
      fat: 0.004,
      carbs: 0.04,
      fiber: 0.016,
    },
    properties: ["aromatic"],
    region: "Taiwan",
  });

  putVendor("vendor-taipei-wholesale", {
    name: "Taipei wholesale market",
    type: "market",
    description: "Binding target for procurement context",
    region: "Taiwan",
  });

  await putDish("dish-three-cup-chicken", {
    name: "Three-cup chicken",
    description: "Demo dish for recipe cost binding",
    region: "Taiwan",
    ingredients: [
      {
        ingredientId: "ingredient-basil",
        ingredientName: "Basil",
        amount: 20,
        unit: "g",
      },
    ],
    servings: 4,
  });
}
