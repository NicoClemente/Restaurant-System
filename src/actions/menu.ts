"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/db";
import { assertRestaurantPermission } from "@/lib/authorization";
import { badRequest } from "@/lib/errors";
import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { sanitizeText } from "@/lib/security";
import { createCategorySchema, createMenuItemSchema } from "@/schemas/menu";

const modifierGroupSchema = z.object({
  restaurantId: z.string().min(1),
  name: z.string().min(2).max(80),
  minSelected: z.number().int().min(0).max(10).default(0),
  maxSelected: z.number().int().min(0).max(10).default(0),
});

const modifierOptionSchema = z.object({
  modifierGroupId: z.string().min(1),
  name: z.string().min(2).max(80),
  price: z.number().min(0),
});

export const createMenuCategory = async (
  _prevState: { success: boolean; error?: string } | null,
  formData: FormData,
) => {
  const session = await auth();
  const restaurantId = formData.get("restaurantId")?.toString() ?? "";
  assertRestaurantPermission(session, restaurantId, PERMISSIONS.MENU_MANAGE);

  const parsed = createCategorySchema.safeParse({
    restaurantId,
    name: formData.get("name")?.toString() ?? "",
    description: formData.get("description")?.toString() ?? undefined,
  });

  if (!parsed.success) {
    return { success: false, error: "Invalid data" };
  }

  await prisma.menuCategory.create({
    data: {
      restaurantId: parsed.data.restaurantId,
      name: sanitizeText(parsed.data.name),
      description: parsed.data.description
        ? sanitizeText(parsed.data.description)
        : undefined,
    },
  });

  revalidatePath("/admin/menu");
  return { success: true };
};

export const createMenuItem = async (
  _prevState: { success: boolean; error?: string } | null,
  formData: FormData,
) => {
  const session = await auth();
  const restaurantId = formData.get("restaurantId")?.toString() ?? "";
  assertRestaurantPermission(session, restaurantId, PERMISSIONS.MENU_MANAGE);

  const parsed = createMenuItemSchema.safeParse({
    restaurantId,
    name: formData.get("name")?.toString() ?? "",
    description: formData.get("description")?.toString() ?? undefined,
    price: Number(formData.get("price") ?? 0),
    categoryId: formData.get("categoryId")?.toString() || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: "Invalid data" };
  }

  await prisma.menuItem.create({
    data: {
      restaurantId: parsed.data.restaurantId,
      name: sanitizeText(parsed.data.name),
      description: parsed.data.description
        ? sanitizeText(parsed.data.description)
        : undefined,
      price: parsed.data.price.toString(),
      categoryId: parsed.data.categoryId ?? undefined,
    },
  });

  revalidatePath("/admin/menu");
  return { success: true };
};

export const attachMenuItemImage = async (params: {
  menuItemId: string;
  upload: {
    public_id: string;
    secure_url: string;
    url: string;
    format?: string;
    resource_type?: string;
    width?: number;
    height?: number;
    bytes?: number;
  };
}) => {
  const session = await auth();

  const menuItem = await prisma.menuItem.findUnique({
    where: { id: params.menuItemId },
    select: { restaurantId: true },
  });

  if (!menuItem) {
    throw badRequest("Menu item not found");
  }

  assertRestaurantPermission(
    session,
    menuItem.restaurantId,
    PERMISSIONS.MENU_MANAGE,
  );

  const image = await prisma.image.create({
    data: {
      restaurantId: menuItem.restaurantId,
      publicId: params.upload.public_id,
      url: params.upload.url,
      secureUrl: params.upload.secure_url,
      format: params.upload.format,
      resourceType: params.upload.resource_type,
      width: params.upload.width,
      height: params.upload.height,
      bytes: params.upload.bytes,
    },
  });

  await prisma.menuItemImage.create({
    data: {
      menuItemId: params.menuItemId,
      imageId: image.id,
      sortOrder: 0,
    },
  });

  revalidatePath("/admin/menu");
  return { success: true, imageId: image.id };
};

export const toggleMenuItemActive = async (menuItemId: string) => {
  const session = await auth();

  const item = await prisma.menuItem.findUnique({
    where: { id: menuItemId },
    select: { restaurantId: true, isActive: true },
  });

  if (!item) {
    throw badRequest("Menu item not found");
  }

  assertRestaurantPermission(
    session,
    item.restaurantId,
    PERMISSIONS.MENU_MANAGE,
  );

  await prisma.menuItem.update({
    where: { id: menuItemId },
    data: { isActive: !item.isActive },
  });

  revalidatePath("/admin/menu");
  return { success: true };
};

export const deleteMenuItem = async (menuItemId: string) => {
  const session = await auth();

  const item = await prisma.menuItem.findUnique({
    where: { id: menuItemId },
    select: { restaurantId: true },
  });

  if (!item) {
    throw badRequest("Menu item not found");
  }

  assertRestaurantPermission(
    session,
    item.restaurantId,
    PERMISSIONS.MENU_MANAGE,
  );

  await prisma.menuItem.delete({ where: { id: menuItemId } });

  revalidatePath("/admin/menu");
  return { success: true };
};

export const deleteMenuCategory = async (categoryId: string) => {
  const session = await auth();

  const category = await prisma.menuCategory.findUnique({
    where: { id: categoryId },
    select: { restaurantId: true },
  });

  if (!category) {
    throw badRequest("Category not found");
  }

  assertRestaurantPermission(
    session,
    category.restaurantId,
    PERMISSIONS.MENU_MANAGE,
  );

  await prisma.menuCategory.delete({ where: { id: categoryId } });

  revalidatePath("/admin/menu");
  return { success: true };
};

export const createModifierGroup = async (
  _prevState: { success: boolean; error?: string } | null,
  formData: FormData,
) => {
  const session = await auth();
  const restaurantId = formData.get("restaurantId")?.toString() ?? "";
  assertRestaurantPermission(session, restaurantId, PERMISSIONS.MENU_MANAGE);

  const parsed = modifierGroupSchema.safeParse({
    restaurantId,
    name: formData.get("name")?.toString() ?? "",
    minSelected: Number(formData.get("minSelected") ?? 0),
    maxSelected: Number(formData.get("maxSelected") ?? 0),
  });

  if (!parsed.success) {
    return { success: false, error: "Invalid data" };
  }

  await prisma.modifierGroup.create({
    data: {
      restaurantId: parsed.data.restaurantId,
      name: sanitizeText(parsed.data.name),
      minSelected: parsed.data.minSelected,
      maxSelected: parsed.data.maxSelected,
      isRequired: parsed.data.minSelected > 0,
    },
  });

  revalidatePath("/admin/menu");
  return { success: true };
};

export const createModifierOption = async (
  _prevState: { success: boolean; error?: string } | null,
  formData: FormData,
) => {
  const session = await auth();
  const modifierGroupId = formData.get("modifierGroupId")?.toString() ?? "";

  const parsed = modifierOptionSchema.safeParse({
    modifierGroupId,
    name: formData.get("name")?.toString() ?? "",
    price: Number(formData.get("price") ?? 0),
  });

  if (!parsed.success) {
    return { success: false, error: "Invalid data" };
  }

  const group = await prisma.modifierGroup.findUnique({
    where: { id: parsed.data.modifierGroupId },
    select: { restaurantId: true },
  });

  if (!group) {
    throw badRequest("Modifier group not found");
  }

  assertRestaurantPermission(session, group.restaurantId, PERMISSIONS.MENU_MANAGE);

  await prisma.modifierOption.create({
    data: {
      modifierGroupId: parsed.data.modifierGroupId,
      name: sanitizeText(parsed.data.name),
      price: parsed.data.price.toString(),
    },
  });

  revalidatePath("/admin/menu");
  return { success: true };
};

export const attachModifierGroupToItem = async (params: {
  menuItemId: string;
  modifierGroupId: string;
}) => {
  const session = await auth();

  const menuItem = await prisma.menuItem.findUnique({
    where: { id: params.menuItemId },
    select: { restaurantId: true },
  });

  if (!menuItem) {
    throw badRequest("Menu item not found");
  }

  assertRestaurantPermission(
    session,
    menuItem.restaurantId,
    PERMISSIONS.MENU_MANAGE,
  );

  await prisma.menuItemModifierGroup.upsert({
    where: {
      menuItemId_modifierGroupId: {
        menuItemId: params.menuItemId,
        modifierGroupId: params.modifierGroupId,
      },
    },
    update: {},
    create: {
      menuItemId: params.menuItemId,
      modifierGroupId: params.modifierGroupId,
    },
  });

  revalidatePath("/admin/menu");
  return { success: true };
};

export const detachModifierGroupFromItem = async (params: {
  menuItemId: string;
  modifierGroupId: string;
}) => {
  const session = await auth();

  const menuItem = await prisma.menuItem.findUnique({
    where: { id: params.menuItemId },
    select: { restaurantId: true },
  });

  if (!menuItem) {
    throw badRequest("Menu item not found");
  }

  assertRestaurantPermission(
    session,
    menuItem.restaurantId,
    PERMISSIONS.MENU_MANAGE,
  );

  await prisma.menuItemModifierGroup.delete({
    where: {
      menuItemId_modifierGroupId: {
        menuItemId: params.menuItemId,
        modifierGroupId: params.modifierGroupId,
      },
    },
  });

  revalidatePath("/admin/menu");
  return { success: true };
};
