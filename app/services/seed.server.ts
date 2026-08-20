/**
 * 示範領域種子：原料→菜餚→食譜→通路最小閉包（T-2026-249）。
 * 僅在 Map 為空時執行一次。詳見 docs/product/mock-data.md
 */

/* eslint-disable sonarjs/no-duplicate-string -- fixture ids and labels repeat by design */

import { putDish } from "~/features/dish/dish.server";
import {
  getAllIngredients,
  putIngredient,
} from "~/features/ingredient/ingredient.server";
import { putRecipe } from "~/features/recipe/recipe.server";
import { createDishVendor, putVendor } from "~/features/vendor/vendor.server";

let seeded = false;

const REGION_TW = "台灣";
const REGION_EN = "Taiwan";
const UNIT_G = "g";
const UNIT_ML = "ml";
const VENDOR_MARKET = "market";

const NUTRIENT = (
  calories: number,
  protein = 0,
  fat = 0,
  carbs = 0,
  fiber = 0
) => ({ calories, protein, fat, carbs, fiber });

export async function ensureSeeded(): Promise<void> {
  if (seeded) return;
  seeded = true;

  const existingIngredients = getAllIngredients();
  if (existingIngredients.length > 0) return;

  putIngredient("ingredient-jujube", {
    name: "紅棗",
    category: "中藥材",
    unit: UNIT_G,
    nutritionPerUnit: NUTRIENT(2.5, 0.2, 0.03, 0.65, 0.1),
    properties: ["補氣", "養血"],
    region: REGION_TW,
  });
  putIngredient("ingredient-goji", {
    name: "枸杞",
    category: "中藥材",
    unit: UNIT_G,
    nutritionPerUnit: NUTRIENT(3, 0.3, 0.1, 0.6, 0.2),
    properties: ["明目", "養肝"],
    region: REGION_TW,
  });
  putIngredient("ingredient-ginger", {
    name: "薑",
    category: "香辛",
    unit: UNIT_G,
    nutritionPerUnit: NUTRIENT(0.8, 0.02, 0.01, 0.18, 0.02),
    properties: ["驅寒"],
    region: REGION_TW,
  });
  putIngredient("ingredient-basil", {
    name: "Basil",
    category: "spice",
    unit: UNIT_G,
    nutritionPerUnit: NUTRIENT(0.23, 0.03, 0.004, 0.04, 0.016),
    properties: ["aromatic"],
    region: REGION_EN,
  });
  putIngredient("ingredient-chicken", {
    name: "雞肉",
    category: "肉類",
    unit: UNIT_G,
    nutritionPerUnit: NUTRIENT(1.2, 0.23, 0.03, 0, 0),
    properties: ["補蛋白質"],
    region: REGION_TW,
  });
  putIngredient("ingredient-soy", {
    name: "醬油",
    category: "調味",
    unit: UNIT_ML,
    nutritionPerUnit: NUTRIENT(0.5, 0.08, 0, 0.05, 0),
    properties: [],
    region: REGION_TW,
  });
  putIngredient("ingredient-sesame-oil", {
    name: "芝麻油",
    category: "調味",
    unit: UNIT_ML,
    nutritionPerUnit: NUTRIENT(8.8, 0, 1, 0, 0),
    properties: [],
    region: REGION_TW,
  });
  putIngredient("ingredient-rice-wine", {
    name: "米酒",
    category: "調味",
    unit: UNIT_ML,
    nutritionPerUnit: NUTRIENT(0.9, 0, 0, 0.01, 0),
    properties: [],
    region: REGION_TW,
  });

  putVendor("vendor-wellness-demo", {
    name: "示範養生館",
    type: VENDOR_MARKET,
    description: "種子資料用通路",
    region: REGION_TW,
  });
  putVendor("vendor-taipei-wholesale", {
    name: "Taipei wholesale market",
    type: VENDOR_MARKET,
    description: "Binding target for procurement context",
    region: REGION_EN,
  });
  putVendor("vendor-yunlin-basil-farm", {
    name: "Yunlin basil farm",
    type: VENDOR_MARKET,
    description: "Agri-supply binding target",
    region: REGION_EN,
  });
  putVendor("vendor-traditional-market", {
    name: "傳統市場",
    type: "grocery",
    description: "日常採買通路",
    region: REGION_TW,
  });

  await putDish("dish-jujube-goji-tea", {
    name: "紅棗枸杞茶",
    description: "簡易養生茶飲",
    region: REGION_TW,
    ingredients: [
      {
        ingredientId: "ingredient-jujube",
        ingredientName: "紅棗",
        amount: 10,
        unit: UNIT_G,
      },
      {
        ingredientId: "ingredient-goji",
        ingredientName: "枸杞",
        amount: 5,
        unit: UNIT_G,
      },
    ],
    servings: 2,
  });

  await putDish("dish-ginger-tea", {
    name: "薑茶",
    description: "驅寒熱飲",
    region: REGION_TW,
    ingredients: [
      {
        ingredientId: "ingredient-ginger",
        ingredientName: "薑",
        amount: 15,
        unit: UNIT_G,
      },
    ],
    servings: 1,
  });

  await putDish("dish-three-cup-chicken", {
    name: "Three-cup chicken",
    description: "Demo dish for recipe cost binding",
    region: REGION_EN,
    ingredients: [
      {
        ingredientId: "ingredient-chicken",
        ingredientName: "雞肉",
        amount: 400,
        unit: UNIT_G,
      },
      {
        ingredientId: "ingredient-basil",
        ingredientName: "Basil",
        amount: 20,
        unit: UNIT_G,
      },
      {
        ingredientId: "ingredient-soy",
        ingredientName: "醬油",
        amount: 30,
        unit: UNIT_ML,
      },
      {
        ingredientId: "ingredient-sesame-oil",
        ingredientName: "芝麻油",
        amount: 20,
        unit: UNIT_ML,
      },
      {
        ingredientId: "ingredient-rice-wine",
        ingredientName: "米酒",
        amount: 30,
        unit: UNIT_ML,
      },
    ],
    servings: 4,
  });

  await putRecipe("recipe-jujube-goji-tea", {
    title: "紅棗枸杞茶作法",
    description: "5 分鐘完成",
    region: REGION_TW,
    dishId: "dish-jujube-goji-tea",
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

  await putRecipe("recipe-ginger-tea", {
    title: "薑茶作法",
    description: "切片煮沸即可",
    region: REGION_TW,
    dishId: "dish-ginger-tea",
    instructions: [
      { stepNumber: 1, instruction: "薑切片", duration: 2 },
      {
        stepNumber: 2,
        instruction: "加水煮沸 5 分鐘",
        duration: 5,
        technique: "煮",
      },
    ],
    cookingTime: 7,
    difficulty: "簡單",
    servings: 1,
  });

  await putRecipe("recipe-three-cup-chicken", {
    title: "Three-cup chicken method",
    description: "Soy, sesame oil, and rice wine",
    region: REGION_EN,
    dishId: "dish-three-cup-chicken",
    instructions: [
      { stepNumber: 1, instruction: "Brown the chicken", duration: 8 },
      {
        stepNumber: 2,
        instruction: "Add soy, sesame oil, and rice wine; reduce",
        duration: 12,
        technique: "braise",
      },
      { stepNumber: 3, instruction: "Finish with basil", duration: 2 },
    ],
    cookingTime: 22,
    difficulty: "中等",
    servings: 4,
  });

  await createDishVendor({
    dishId: "dish-jujube-goji-tea",
    vendorId: "vendor-wellness-demo",
    price: 99,
    currency: "TWD",
    availability: true,
  });
  await createDishVendor({
    dishId: "dish-jujube-goji-tea",
    vendorId: "vendor-traditional-market",
    price: 80,
    currency: "TWD",
    availability: true,
  });
  await createDishVendor({
    dishId: "dish-ginger-tea",
    vendorId: "vendor-traditional-market",
    price: 45,
    currency: "TWD",
    availability: true,
  });
  await createDishVendor({
    dishId: "dish-three-cup-chicken",
    vendorId: "vendor-taipei-wholesale",
    price: 280,
    currency: "TWD",
    availability: true,
  });
  await createDishVendor({
    dishId: "dish-three-cup-chicken",
    vendorId: "vendor-traditional-market",
    price: 320,
    currency: "TWD",
    availability: true,
  });
}
