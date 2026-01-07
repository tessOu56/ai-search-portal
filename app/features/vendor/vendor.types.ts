/**
 * VendorDish - Vendor 中販售的 Dish 資訊
 */
export interface VendorDish {
  dishId: string;
  dishName: string; // 快取
  price?: number; // 價格
  currency?: string; // 貨幣（如：TWD, USD）
  availability?: boolean; // 是否可購買
  notes?: string; // 備註（如：限時供應、季節限定等）
}

/**
 * DishVendor - Dish 中關聯的購買通路資訊
 * 簡化設計，將購買資訊直接關聯到 Dish
 */
export interface DishVendor {
  dishId: string;
  vendorId: string;
  vendorName: string; // 快取
  price?: number;
  currency?: string;
  availability?: boolean;
  notes?: string;
}

/**
 * Vendor（購買通路）- 給想購買者
 */
export interface Vendor {
  id: string;
  name: string;
  type: "restaurant" | "market" | "online" | "grocery"; // 通路類型
  description?: string;
  region?: string; // 地區
  address?: string;
  phone?: string;
  website?: string;
  rating?: number; // 評分（1-5）

  // 關聯的 Dish（販售哪些食物）
  dishes: VendorDish[];

  createdAt: Date;
  updatedAt: Date;
}

/**
 * 建立 Vendor 的輸入類型
 */
export interface CreateVendorInput {
  name: string;
  type: "restaurant" | "market" | "online" | "grocery";
  description?: string;
  region?: string;
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  dishes?: VendorDish[];
}

/**
 * 更新 Vendor 的輸入類型
 */
export interface UpdateVendorInput {
  name?: string;
  type?: "restaurant" | "market" | "online" | "grocery";
  description?: string;
  region?: string;
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  dishes?: VendorDish[];
}

/**
 * 建立 DishVendor 關聯的輸入類型
 */
export interface CreateDishVendorInput {
  dishId: string;
  vendorId: string;
  price?: number;
  currency?: string;
  availability?: boolean;
  notes?: string;
}


