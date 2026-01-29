import { useFetcher } from "@remix-run/react";
import { useMemo } from "react";

import type {
  CreateIngredientInput,
  Ingredient,
  UpdateIngredientInput,
} from "./ingredient.types";

/**
 * 使用 Ingredient 資料的 Hook
 * 注意：這是基礎 Hook，實際使用時可能需要配合 Remix loader/action
 */
export function useIngredient(id: string | null) {
  const fetcher = useFetcher<{ ingredient: Ingredient | null }>();

  const ingredient = useMemo(() => {
    if (id && fetcher.data?.ingredient) {
      return fetcher.data.ingredient;
    }
    return null;
  }, [id, fetcher.data]);

  const isLoading = fetcher.state === "loading";

  return {
    ingredient,
    isLoading,
    refetch: () => {
      if (id) {
        fetcher.load(`/api/ingredients/${id}`);
      }
    },
  };
}

/**
 * 使用 Ingredient 列表的 Hook
 */
export function useIngredients() {
  const fetcher = useFetcher<{ ingredients: Ingredient[] }>();

  const ingredients = useMemo(() => {
    return fetcher.data?.ingredients ?? [];
  }, [fetcher.data]);

  const isLoading = fetcher.state === "loading";

  return {
    ingredients,
    isLoading,
    refetch: () => {
      fetcher.load("/api/ingredients");
    },
  };
}

/**
 * 建立 Ingredient 的 Hook
 */
export function useCreateIngredient() {
  const fetcher = useFetcher<{
    ingredient: Ingredient | null;
    error?: string;
  }>();

  const createIngredient = (input: CreateIngredientInput) => {
    fetcher.submit(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      { ...input } as any,
      {
        method: "POST",
        action: "/api/ingredients",
      }
    );
  };

  return {
    createIngredient,
    isLoading: fetcher.state === "submitting",
    ingredient: fetcher.data?.ingredient ?? null,
    error: fetcher.data?.error,
  };
}

/**
 * 更新 Ingredient 的 Hook
 */
export function useUpdateIngredient() {
  const fetcher = useFetcher<{
    ingredient: Ingredient | null;
    error?: string;
  }>();

  const updateIngredient = (id: string, input: UpdateIngredientInput) => {
    fetcher.submit(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      { ...input } as any,
      {
        method: "PATCH",
        action: `/api/ingredients/${id}`,
      }
    );
  };

  return {
    updateIngredient,
    isLoading: fetcher.state === "submitting",
    ingredient: fetcher.data?.ingredient ?? null,
    error: fetcher.data?.error,
  };
}

/**
 * 刪除 Ingredient 的 Hook
 */
export function useDeleteIngredient() {
  const fetcher = useFetcher<{ success: boolean; error?: string }>();

  const deleteIngredient = (id: string) => {
    fetcher.submit(
      {},
      {
        method: "DELETE",
        action: `/api/ingredients/${id}`,
      }
    );
  };

  return {
    deleteIngredient,
    isLoading: fetcher.state === "submitting",
    success: fetcher.data?.success ?? false,
    error: fetcher.data?.error,
  };
}
