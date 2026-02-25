/**
 * Items API 契約：request/response 的 runtime schema（Zod）。
 * Handler 與 route 回傳前應以對應 schema parse，確保 mock 與 production 一致。
 * 見 .cursor/wiki/Ref-Contract-與-Schema-規範.md
 */

import { z } from "zod";

export const mockItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type MockItemContract = z.infer<typeof mockItemSchema>;

export const listItemsResponseSchema = z.object({
  data: z.array(mockItemSchema),
});

export const getItemResponseSchema = z.object({
  data: mockItemSchema,
});

export const createItemRequestSchema = z.object({
  name: z
    .string()
    .min(1)
    .transform((s) => s.trim()),
  description: z.string().nullable().optional(),
});

export const updateItemRequestSchema = z.object({
  name: z
    .string()
    .min(1)
    .transform((s) => s.trim())
    .optional(),
  description: z.string().nullable().optional(),
});

export const errorResponseSchema = z.object({
  error: z.string(),
});
