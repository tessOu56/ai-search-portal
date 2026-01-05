import { useFetcher } from "@remix-run/react";
import { useMemo } from "react";
import type {
  Recipe,
  CreateRecipeInput,
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
        fetcher.load(`/api/recipes/${id}`);
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
    return fetcher.data?.recipes || [];
  }, [fetcher.data]);

  const isLoading = fetcher.state === "loading";

  return {
    recipes,
    isLoading,
    refetch: () => {
      fetcher.load("/api/recipes");
    },
  };
}

/**
 * 根據 dishId 獲取 Recipe 列表的 Hook
 */
export function useRecipesByDishId(dishId: string | null) {
  const fetcher = useFetcher<{ recipes: Recipe[] }>();

  const recipes = useMemo(() => {
    return fetcher.data?.recipes || [];
  }, [fetcher.data]);

  const isLoading = fetcher.state === "loading";

  const refetch = () => {
    if (dishId) {
      fetcher.load(`/api/dishes/${dishId}/recipes`);
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
    fetcher.submit(
      { ...input },
      {
        method: "POST",
        action: "/api/recipes",
      }
    );
  };

  return {
    createRecipe,
    isLoading: fetcher.state === "submitting",
    recipe: fetcher.data?.recipe || null,
    error: fetcher.data?.error,
  };
}

/**
 * 更新 Recipe 的 Hook
 */
export function useUpdateRecipe() {
  const fetcher = useFetcher<{ recipe: Recipe | null; error?: string }>();

  const updateRecipe = (id: string, input: UpdateRecipeInput) => {
    fetcher.submit(
      { ...input },
      {
        method: "PATCH",
        action: `/api/recipes/${id}`,
      }
    );
  };

  return {
    updateRecipe,
    isLoading: fetcher.state === "submitting",
    recipe: fetcher.data?.recipe || null,
    error: fetcher.data?.error,
  };
}

/**
 * 刪除 Recipe 的 Hook
 */
export function useDeleteRecipe() {
  const fetcher = useFetcher<{ success: boolean; error?: string }>();

  const deleteRecipe = (id: string) => {
    fetcher.submit(
      {},
      {
        method: "DELETE",
        action: `/api/recipes/${id}`,
      }
    );
  };

  return {
    deleteRecipe,
    isLoading: fetcher.state === "submitting",
    success: fetcher.data?.success || false,
    error: fetcher.data?.error,
  };
}

