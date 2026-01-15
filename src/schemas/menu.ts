import { z } from "zod";

export const createCategorySchema = z.object({
  restaurantId: z.string().min(1),
  name: z.string().min(2).max(80),
  description: z.string().max(200).optional(),
});

export const createMenuItemSchema = z.object({
  restaurantId: z.string().min(1),
  name: z.string().min(2).max(120),
  description: z.string().max(400).optional(),
  price: z.number().min(0),
  categoryId: z.string().min(1).optional(),
});

export const createModifierGroupSchema = z.object({
  restaurantId: z.string().min(1),
  name: z.string().min(2).max(80),
  minSelected: z.number().int().min(0).max(10).default(0),
  maxSelected: z.number().int().min(0).max(10).default(0),
});

export const createModifierOptionSchema = z.object({
  modifierGroupId: z.string().min(1),
  name: z.string().min(2).max(80),
  price: z.number().min(0),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type CreateModifierGroupInput = z.infer<typeof createModifierGroupSchema>;
export type CreateModifierOptionInput = z.infer<typeof createModifierOptionSchema>;