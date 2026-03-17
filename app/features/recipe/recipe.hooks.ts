import { useFetcher } from "@remix-run/react";
import { useMemo } from "react";

import { API_RECIPES, apiDishRecipes, apiRecipe } from "~/shared/api/paths";
import { submitFormPayload } from "~/shared/api/submitPayload";

import type {
  CreateRecipeInput,
  Recipe,
  UpdateRecipeInput,
} from "./recipe.types";

/**
 * 使用 Recipe 資料的 Hook
 */
export function useRecipe(id: string | null) {
  const fetcher = useFetcher<{ recipe: Recipe | null }>();

  const recipe = useMemo(() => {
    if (id && fetcher.data?.recipe) {
      return fetcher.data.recipe;
    }
    return null;
  }, [id, fetcher.data]);

  const isLoading = fetcher.state === "loading";

  return {
    recipe,
    isLoading,
    refetch: () => {
      if (id) {
        fetcher.load(apiRecipe(id));
      }
    },
  };
}

/**
 * 使用 Recipe 列表的 Hook
 */
export function useRecipes() {
  const fetcher = useFetcher<{ recipes: Recipe[] }>();

  const recipes = useMemo(() => {
    return fetcher.data?.recipes ?? [];
  }, [fetcher.data]);

  const isLoading = fetcher.state === "loading";

  return {
    recipes,
    isLoading,
    refetch: () => {
      fetcher.load(API_RECIPES);
    },
  };
}

/**
 * 根據 dishId 獲取 Recipe 列表的 Hook
 */
export function useRecipesByDishId(dishId: string | null) {
  const fetcher = useFetcher<{ recipes: Recipe[] }>();

  const recipes = useMemo(() => {
    return fetcher.data?.recipes ?? [];
  }, [fetcher.data]);

  const isLoading = fetcher.state === "loading";

  const refetch = () => {
    if (dishId) {
      fetcher.load(apiDishRecipes(dishId));
    }
  };

  return {
    recipes,
    isLoading,
    refetch,
  };
}

/**
 * 建立 Recipe 的 Hook
 */
export function useCreateRecipe() {
  const fetcher = useFetcher<{ recipe: Recipe | null; error?: string }>();

  const createRecipe = (input: CreateRecipeInput) => {
    submitFormPayload(
      fetcher,
      { ...input },
      { method: "POST", action: API_RECIPES }
    );
  };

  return {
    createRecipe,
    isLoading: fetcher.state === "submitting",
    recipe: fetcher.data?.recipe ?? null,
    error: fetcher.data?.error,
  };
}

/**
 * 更新 Recipe 的 Hook
 */
export function useUpdateRecipe() {
  const fetcher = useFetcher<{ recipe: Recipe | null; error?: string }>();

  const updateRecipe = (id: string, input: UpdateRecipeInput) => {
    submitFormPayload(
      fetcher,
      { ...input },
      { method: "PATCH", action: apiRecipe(id) }
    );
  };

  return {
    updateRecipe,
    isLoading: fetcher.state === "submitting",
    recipe: fetcher.data?.recipe ?? null,
    error: fetcher.data?.error,
  };
}

/**
 * 刪除 Recipe 的 Hook
 */
export function useDeleteRecipe() {
  const fetcher = useFetcher<{ success: boolean; error?: string }>();

  const deleteRecipe = (id: string) => {
    submitFormPayload(fetcher, {}, { method: "DELETE", action: apiRecipe(id) });
  };

  return {
    deleteRecipe,
    isLoading: fetcher.state === "submitting",
    success: fetcher.data?.success ?? false,
    error: fetcher.data?.error,
  };
}
