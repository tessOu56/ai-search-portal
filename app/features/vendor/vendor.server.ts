import { getDishById } from "~/shared/services/domain.server";
import { notFound } from "~/shared/utils/errors";

import type {
  CreateDishVendorInput,
  CreateVendorInput,
  DishVendor,
  UpdateVendorInput,
  Vendor,
} from "./vendor.types";

// 模擬資料庫（使用記憶體 Map）
const vendorsMap = new Map<string, Vendor>();
const dishVendorsMap = new Map<string, DishVendor[]>(); // dishId -> DishVendor[]

/**
 * 獲取所有 Vendor
 */
export function getAllVendors(): Vendor[] {
  return [...vendorsMap.values()];
}

/**
 * 根據 ID 獲取 Vendor
 */
export function getVendor(id: string): Vendor | null {
  return vendorsMap.get(id) ?? null;
}

/**
 * 根據 dishId 獲取所有相關的 Vendor
 */
export function getVendorsByDishId(dishId: string): Vendor[] {
  const dishVendors = dishVendorsMap.get(dishId) ?? [];
  const vendorIds = new Set(dishVendors.map((dv) => dv.vendorId));
  const vendors = [...vendorIds].map((id) => getVendor(id));
  return vendors.filter((vendor): vendor is Vendor => vendor !== null);
}

/**
 * 根據地區獲取 Vendor
 */
export function getVendorsByRegion(region: string): Vendor[] {
  const allVendors = getAllVendors();
  return allVendors.filter((vendor) => vendor.region === region);
}

/**
 * 搜尋 Vendor
 */
export function searchVendors(query: string): Vendor[] {
  const allVendors = getAllVendors();
  const lowerQuery = query.toLowerCase();
  return allVendors.filter(
    (vendor) =>
      vendor.name.toLowerCase().includes(lowerQuery) ||
      (vendor.description?.toLowerCase().includes(lowerQuery) ?? false) ||
      (vendor.address?.toLowerCase().includes(lowerQuery) ?? false)
  );
}

/**
 * 建立新的 Vendor
 */
export function createVendor(input: CreateVendorInput): Vendor {
  const now = new Date();
  const id = `vendor_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

  const vendor: Vendor = {
    id,
    name: input.name,
    type: input.type,
    description: input.description,
    region: input.region,
    address: input.address,
    phone: input.phone,
    website: input.website,
    rating: input.rating,
    dishes: input.dishes ?? [],
    createdAt: now,
    updatedAt: now,
  };

  vendorsMap.set(id, vendor);
  return vendor;
}

/**
 * 更新 Vendor
 */
export function updateVendor(
  id: string,
  input: UpdateVendorInput
): Vendor | null {
  const vendor = getVendor(id);
  if (!vendor) {
    return null;
  }

  const updated: Vendor = {
    ...vendor,
    ...input,
    updatedAt: new Date(),
  };

  vendorsMap.set(id, updated);
  return updated;
}

/**
 * 刪除 Vendor
 */
export function deleteVendor(id: string): boolean {
  // 同時清理 dishVendorsMap 中的關聯
  for (const [dishId, dishVendors] of dishVendorsMap.entries()) {
    const filtered = dishVendors.filter((dv) => dv.vendorId !== id);
    if (filtered.length === 0) {
      dishVendorsMap.delete(dishId);
    } else {
      dishVendorsMap.set(dishId, filtered);
    }
  }

  return vendorsMap.delete(id);
}

/**
 * 建立 Dish 與 Vendor 的關聯
 */
export async function createDishVendor(
  input: CreateDishVendorInput
): Promise<DishVendor> {
  // 驗證 dishId 和 vendorId 是否存在（並行查詢以提高效能）
  const [dish, vendor] = await Promise.all([
    getDishById(input.dishId),
    getVendor(input.vendorId),
  ]);

  if (!dish) {
    throw notFound("Dish", input.dishId);
  }

  if (!vendor) {
    throw notFound("Vendor", input.vendorId);
  }

  const dishVendor: DishVendor = {
    dishId: input.dishId,
    vendorId: input.vendorId,
    vendorName: vendor.name,
    price: input.price,
    currency: input.currency,
    availability: input.availability ?? true,
    notes: input.notes,
  };

  // 更新 dishVendorsMap
  const existing = dishVendorsMap.get(input.dishId) ?? [];
  // 檢查是否已存在相同的關聯
  const exists = existing.some(
    (dv) => dv.dishId === input.dishId && dv.vendorId === input.vendorId
  );
  if (!exists) {
    dishVendorsMap.set(input.dishId, [...existing, dishVendor]);
  }

  return dishVendor;
}

/**
 * 獲取 Dish 的所有 Vendor 關聯
 */
export function getDishVendors(dishId: string): DishVendor[] {
  return dishVendorsMap.get(dishId) ?? [];
}

/**
 * 刪除 Dish 與 Vendor 的關聯
 */
export function deleteDishVendor(dishId: string, vendorId: string): boolean {
  const dishVendors = dishVendorsMap.get(dishId) ?? [];
  const filtered = dishVendors.filter((dv) => dv.vendorId !== vendorId);
  dishVendorsMap.set(dishId, filtered);
  return filtered.length < dishVendors.length;
}
