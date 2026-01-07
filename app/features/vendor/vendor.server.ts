import type {
  Vendor,
  CreateVendorInput,
  UpdateVendorInput,
  DishVendor,
  CreateDishVendorInput,
} from "./vendor.types";
import { getDishById } from "~/shared/services/domain.server";
import { notFound } from "~/shared/utils/errors";

// 模擬資料庫（使用記憶體 Map）
const vendorsMap = new Map<string, Vendor>();
const dishVendorsMap = new Map<string, DishVendor[]>(); // dishId -> DishVendor[]

/**
 * 獲取所有 Vendor
 */
export async function getAllVendors(): Promise<Vendor[]> {
  return Array.from(vendorsMap.values());
}

/**
 * 根據 ID 獲取 Vendor
 */
export async function getVendor(id: string): Promise<Vendor | null> {
  return vendorsMap.get(id) || null;
}

/**
 * 根據 dishId 獲取所有相關的 Vendor
 */
export async function getVendorsByDishId(dishId: string): Promise<Vendor[]> {
  const dishVendors = dishVendorsMap.get(dishId) || [];
  const vendorIds = new Set(dishVendors.map((dv) => dv.vendorId));
  const vendors = await Promise.all(
    Array.from(vendorIds).map((id) => getVendor(id))
  );
  return vendors.filter((v): v is Vendor => v !== null);
}

/**
 * 根據地區獲取 Vendor
 */
export async function getVendorsByRegion(region: string): Promise<Vendor[]> {
  const allVendors = await getAllVendors();
  return allVendors.filter((vendor) => vendor.region === region);
}

/**
 * 搜尋 Vendor
 */
export async function searchVendors(query: string): Promise<Vendor[]> {
  const allVendors = await getAllVendors();
  const lowerQuery = query.toLowerCase();
  return allVendors.filter(
    (vendor) =>
      vendor.name.toLowerCase().includes(lowerQuery) ||
      vendor.description?.toLowerCase().includes(lowerQuery) ||
      vendor.address?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 建立新的 Vendor
 */
export async function createVendor(input: CreateVendorInput): Promise<Vendor> {
  const now = new Date();
  const id = `vendor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
    dishes: input.dishes || [],
    createdAt: now,
    updatedAt: now,
  };

  vendorsMap.set(id, vendor);
  return vendor;
}

/**
 * 更新 Vendor
 */
export async function updateVendor(
  id: string,
  input: UpdateVendorInput
): Promise<Vendor | null> {
  const vendor = await getVendor(id);
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
export async function deleteVendor(id: string): Promise<boolean> {
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
  const existing = dishVendorsMap.get(input.dishId) || [];
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
export async function getDishVendors(dishId: string): Promise<DishVendor[]> {
  return dishVendorsMap.get(dishId) || [];
}

/**
 * 刪除 Dish 與 Vendor 的關聯
 */
export async function deleteDishVendor(
  dishId: string,
  vendorId: string
): Promise<boolean> {
  const dishVendors = dishVendorsMap.get(dishId) || [];
  const filtered = dishVendors.filter((dv) => dv.vendorId !== vendorId);
  dishVendorsMap.set(dishId, filtered);
  return filtered.length < dishVendors.length;
}


