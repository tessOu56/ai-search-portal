import { useFetcher } from "@remix-run/react";
import { useMemo } from "react";

import {
  API_DISH_VENDORS,
  API_VENDORS,
  apiDishVendors,
  apiVendor,
} from "~/shared/api/paths";
import { submitFormPayload } from "~/shared/api/submitPayload";

import type {
  CreateDishVendorInput,
  CreateVendorInput,
  DishVendor,
  UpdateVendorInput,
  Vendor,
} from "./vendor.types";

/**
 * 使用 Vendor 資料的 Hook
 */
export function useVendor(id: string | null) {
  const fetcher = useFetcher<{ vendor: Vendor | null }>();

  const vendor = useMemo(() => {
    if (id && fetcher.data?.vendor) {
      return fetcher.data.vendor;
    }
    return null;
  }, [id, fetcher.data]);

  const isLoading = fetcher.state === "loading";

  return {
    vendor,
    isLoading,
    refetch: () => {
      if (id) {
        fetcher.load(apiVendor(id));
      }
    },
  };
}

/**
 * 使用 Vendor 列表的 Hook
 */
export function useVendors() {
  const fetcher = useFetcher<{ vendors: Vendor[] }>();

  const vendors = useMemo(() => {
    return fetcher.data?.vendors ?? [];
  }, [fetcher.data]);

  const isLoading = fetcher.state === "loading";

  return {
    vendors,
    isLoading,
    refetch: () => {
      fetcher.load(API_VENDORS);
    },
  };
}

/**
 * 根據 dishId 獲取 Vendor 列表的 Hook
 */
export function useVendorsByDishId(dishId: string | null) {
  const fetcher = useFetcher<{ vendors: Vendor[] }>();

  const vendors = useMemo(() => {
    return fetcher.data?.vendors ?? [];
  }, [fetcher.data]);

  const isLoading = fetcher.state === "loading";

  const refetch = () => {
    if (dishId) {
      fetcher.load(apiDishVendors(dishId));
    }
  };

  return {
    vendors,
    isLoading,
    refetch,
  };
}

/**
 * 建立 Vendor 的 Hook
 */
export function useCreateVendor() {
  const fetcher = useFetcher<{ vendor: Vendor | null; error?: string }>();

  const createVendor = (input: CreateVendorInput) => {
    submitFormPayload(
      fetcher,
      { ...input },
      { method: "POST", action: API_VENDORS }
    );
  };

  return {
    createVendor,
    isLoading: fetcher.state === "submitting",
    vendor: fetcher.data?.vendor ?? null,
    error: fetcher.data?.error,
  };
}

/**
 * 更新 Vendor 的 Hook
 */
export function useUpdateVendor() {
  const fetcher = useFetcher<{ vendor: Vendor | null; error?: string }>();

  const updateVendor = (id: string, input: UpdateVendorInput) => {
    submitFormPayload(
      fetcher,
      { ...input },
      { method: "PATCH", action: apiVendor(id) }
    );
  };

  return {
    updateVendor,
    isLoading: fetcher.state === "submitting",
    vendor: fetcher.data?.vendor ?? null,
    error: fetcher.data?.error,
  };
}

/**
 * 刪除 Vendor 的 Hook
 */
export function useDeleteVendor() {
  const fetcher = useFetcher<{ success: boolean; error?: string }>();

  const deleteVendor = (id: string) => {
    submitFormPayload(fetcher, {}, { method: "DELETE", action: apiVendor(id) });
  };

  return {
    deleteVendor,
    isLoading: fetcher.state === "submitting",
    success: fetcher.data?.success ?? false,
    error: fetcher.data?.error,
  };
}

/**
 * 建立 Dish 與 Vendor 關聯的 Hook
 */
export function useCreateDishVendor() {
  const fetcher = useFetcher<{
    dishVendor: DishVendor | null;
    error?: string;
  }>();

  const createDishVendor = (input: CreateDishVendorInput) => {
    submitFormPayload(
      fetcher,
      { ...input },
      { method: "POST", action: API_DISH_VENDORS }
    );
  };

  return {
    createDishVendor,
    isLoading: fetcher.state === "submitting",
    dishVendor: fetcher.data?.dishVendor ?? null,
    error: fetcher.data?.error,
  };
}
