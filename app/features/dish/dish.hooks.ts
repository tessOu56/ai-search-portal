import { useFetcher } from "@remix-run/react";
import { useMemo } from "react";

import type { CreateDishInput, Dish, UpdateDishInput } from "./dish.types";

/**
 * 使用 Dish 資料的 Hook
 */
export function useDish(id: string | null) {
  const fetcher = useFetcher<{ dish: Dish | null }>();

  const dish = useMemo(() => {
    if (id && fetcher.data?.dish) {
      return fetcher.data.dish;
    }
    return null;
  }, [id, fetcher.data]);

  const isLoading = fetcher.state === "loading";

  return {
    dish,
    isLoading,
    refetch: () => {
      if (id) {
        fetcher.load(`/api/dishes/${id}`);
      }
    },
  };
}

/**
 * 使用 Dish 列表的 Hook
 */
export function useDishes() {
  const fetcher = useFetcher<{ dishes: Dish[] }>();

  const dishes = useMemo(() => {
    return fetcher.data?.dishes ?? [];
  }, [fetcher.data]);

  const isLoading = fetcher.state === "loading";

  return {
    dishes,
    isLoading,
    refetch: () => {
      fetcher.load("/api/dishes");
    },
  };
}

/**
 * 建立 Dish 的 Hook
 */
export function useCreateDish() {
  const fetcher = useFetcher<{ dish: Dish | null; error?: string }>();

  const createDish = (input: CreateDishInput) => {
    // SubmitTarget (object payload) not exported from react-router-dom
    fetcher.submit(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      { ...input } as any,
      {
        method: "POST",
        action: "/api/dishes",
      }
    );
  };

  return {
    createDish,
    isLoading: fetcher.state === "submitting",
    dish: fetcher.data?.dish ?? null,
    error: fetcher.data?.error,
  };
}

/**
 * 更新 Dish 的 Hook
 */
export function useUpdateDish() {
  const fetcher = useFetcher<{ dish: Dish | null; error?: string }>();

  const updateDish = (id: string, input: UpdateDishInput) => {
    fetcher.submit(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      { ...input } as any,
      {
        method: "PATCH",
        action: `/api/dishes/${id}`,
      }
    );
  };

  return {
    updateDish,
    isLoading: fetcher.state === "submitting",
    dish: fetcher.data?.dish ?? null,
    error: fetcher.data?.error,
  };
}

/**
 * 刪除 Dish 的 Hook
 */
export function useDeleteDish() {
  const fetcher = useFetcher<{ success: boolean; error?: string }>();

  const deleteDish = (id: string) => {
    fetcher.submit(
      {},
      {
        method: "DELETE",
        action: `/api/dishes/${id}`,
      }
    );
  };

  return {
    deleteDish,
    isLoading: fetcher.state === "submitting",
    success: fetcher.data?.success ?? false,
    error: fetcher.data?.error,
  };
}

/**
 * 搜尋 Dish 的 Hook
 */
export function useSearchDishes() {
  const fetcher = useFetcher<{ dishes: Dish[] }>();

  const searchDishes = (query: string) => {
    fetcher.load(`/api/dishes/search?q=${encodeURIComponent(query)}`);
  };

  const dishes = useMemo(() => {
    return fetcher.data?.dishes ?? [];
  }, [fetcher.data]);

  return {
    dishes,
    isLoading: fetcher.state === "loading",
    searchDishes,
  };
}
