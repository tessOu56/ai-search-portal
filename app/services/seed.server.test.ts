import { describe, expect, it } from "vitest";

import { getAllDishes, getDish } from "~/features/dish/dish.server";
import { getAllIngredients } from "~/features/ingredient/ingredient.server";
import { getRecipesByDishId } from "~/features/recipe/recipe.server";
import { getVendorsByDishId } from "~/features/vendor/vendor.server";
import { ensureSeeded } from "~/services/seed.server";

describe("demo catalog seed closure (T-2026-249)", () => {
  it("has at least 3 dishes, each with recipe, vendor, and ingredients", async () => {
    await ensureSeeded();
    const dishes = getAllDishes();
    expect(dishes.length).toBeGreaterThanOrEqual(3);

    const threeCup = getDish("dish-three-cup-chicken");
    expect(threeCup).not.toBeNull();
    expect(threeCup?.ingredients.length).toBeGreaterThan(0);

    for (const dish of dishes) {
      expect(dish.ingredients.length, dish.id).toBeGreaterThan(0);
      expect(getRecipesByDishId(dish.id).length, dish.id).toBeGreaterThan(0);
      expect(getVendorsByDishId(dish.id).length, dish.id).toBeGreaterThan(0);
    }

    const usedIngredientIds = new Set(
      dishes.flatMap((dish) =>
        dish.ingredients.map((usage) => usage.ingredientId)
      )
    );
    const ingredients = getAllIngredients();
    expect(ingredients.length).toBeGreaterThanOrEqual(3);
    expect(
      ingredients.every((ingredient) => usedIngredientIds.has(ingredient.id))
    ).toBe(true);
  });
});
