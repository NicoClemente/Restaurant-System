"use server";

import crypto from "crypto";

import { prisma } from "@/db";
import { assertRestaurantPermission } from "@/lib/authorization";
import { badRequest, notFound } from "@/lib/errors";
import { PERMISSIONS } from "@/lib/permissions";
import { normalizePhone, sanitizeText } from "@/lib/security";
import { auth } from "@/lib/auth";
import { publishOrderEvent } from "@/services/realtime";
import { sendOrderConfirmation } from "@/services/notifications";
import { env } from "@/lib/env";
import {
  CreateGuestOrderInput,
  createGuestOrderSchema,
} from "@/schemas/orders";

const toDecimal = (value: number | string) => Number(value);

type MenuItemRow = {
  id: string;
  name: string;
  price: unknown;
  taxRate: { rate: unknown; isInclusive: boolean } | null;
};

type ModifierOptionRow = {
  id: string;
  modifierGroupId: string;
  name: string;
  price: unknown;
};

type OrderItemModifierCreate = {
  modifierOptionId: string;
  name: string;
  price: string;
};

type OrderItemCreate = {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  taxAmount: string;
  notes: string | null;
  modifiers: { create: OrderItemModifierCreate[] };
};

type OrderItemRow = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: string | number;
  totalPrice: string | number;
  taxAmount: string | number;
};

type DecimalLike = { toString(): string } | string | number;

type OrderItemDb = {
  id: string;
  name: string;
  quantity: number;
  notes: string | null;
  unitPrice: DecimalLike;
  totalPrice: DecimalLike;
  taxAmount: DecimalLike;
};

const computeTotals = (params: {
  unitPrice: number;
  quantity: number;
  taxRate?: number | null;
  isInclusive?: boolean | null;
}) => {
  const rate = params.taxRate ?? 0;
  const qty = params.quantity;
  const unit = params.unitPrice;

  if (rate === 0) {
    const subtotal = unit * qty;
    return { subtotal, tax: 0, total: subtotal };
  }

  if (params.isInclusive) {
    const tax = (unit - unit / (rate + 1)) * qty;
    const subtotal = unit * qty - tax;
    const total = unit * qty;
    return { subtotal, tax, total };
  }

  const tax = unit * rate * qty;
  const subtotal = unit * qty;
  const total = subtotal + tax;
  return { subtotal, tax, total };
};

export const createGuestOrder = async (rawInput: CreateGuestOrderInput) => {
  const input = createGuestOrderSchema.parse(rawInput);

  type TransactionClient = Parameters<typeof prisma.$transaction>[0] extends (
    arg: infer T,
  ) => unknown
    ? T
    : never;

  return prisma.$transaction(async (tx: TransactionClient) => {
    const restaurant = await tx.restaurant.findUnique({
      where: { id: input.restaurantId },
      include: { settings: true },
    });

    if (!restaurant) {
      throw notFound("Restaurant not found");
    }

    const menuItemIds = input.items.map((item) => item.menuItemId);
    const menuItems: MenuItemRow[] = await tx.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        restaurantId: restaurant.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        price: true,
        taxRate: { select: { rate: true, isInclusive: true } },
      },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw badRequest("Some menu items are invalid or inactive");
    }

    const modifierOptionIds = input.items.flatMap((item) =>
      item.modifiers?.map((mod) => mod.modifierOptionId) ?? [],
    );

    const modifierOptions: ModifierOptionRow[] = modifierOptionIds.length
      ? await tx.modifierOption.findMany({
          where: { id: { in: modifierOptionIds }, isActive: true },
          select: {
            id: true,
            name: true,
            price: true,
            modifierGroupId: true,
          },
        })
      : [];

    const menuItemGroups: Array<{ menuItemId: string; modifierGroupId: string }> =
      await tx.menuItemModifierGroup.findMany({
        where: { menuItemId: { in: menuItemIds } },
        select: { menuItemId: true, modifierGroupId: true },
      });

    const modifierGroupIds = [
      ...new Set(menuItemGroups.map((group) => group.modifierGroupId)),
    ];

    const modifierGroups: Array<{
      id: string;
      minSelected: number;
      maxSelected: number;
    }> = modifierGroupIds.length
      ? await tx.modifierGroup.findMany({
          where: { id: { in: modifierGroupIds } },
          select: { id: true, minSelected: true, maxSelected: true },
        })
      : [];

    const allowedGroupsByItem = new Map<string, Set<string>>();
    for (const link of menuItemGroups) {
      if (!allowedGroupsByItem.has(link.menuItemId)) {
        allowedGroupsByItem.set(link.menuItemId, new Set());
      }
      allowedGroupsByItem.get(link.menuItemId)?.add(link.modifierGroupId);
    }

    const menuItemMap = new Map<string, MenuItemRow>(
      menuItems.map((item) => [item.id, item]),
    );
    const modifierMap = new Map<string, ModifierOptionRow>(
      modifierOptions.map((option) => [option.id, option]),
    );
    const modifierGroupMap = new Map(
      modifierGroups.map((group) => [group.id, group]),
    );

    let subtotal = 0;
    let taxTotal = 0;
    let total = 0;

    const orderItemsData: OrderItemCreate[] = input.items.map((item) => {
      const menuItem = menuItemMap.get(item.menuItemId);
      if (!menuItem) {
        throw badRequest("Menu item not found");
      }

      const modifiers =
        item.modifiers?.map((mod) => {
          const option = modifierMap.get(mod.modifierOptionId);
          if (!option) {
            throw badRequest("Invalid modifier option");
          }
          const allowedGroups = allowedGroupsByItem.get(menuItem.id) ?? new Set();
          if (!allowedGroups.has(option.modifierGroupId)) {
            throw badRequest("Modifier not allowed for this item");
          }
          return { option, quantity: mod.quantity };
        }) ?? [];

      const countsByGroup = new Map<string, number>();
      for (const mod of modifiers) {
        countsByGroup.set(
          mod.option.modifierGroupId,
          (countsByGroup.get(mod.option.modifierGroupId) ?? 0) + mod.quantity,
        );
      }

      const requiredGroups = allowedGroupsByItem.get(menuItem.id) ?? new Set();
      for (const groupId of requiredGroups) {
        const group = modifierGroupMap.get(groupId);
        if (!group) continue;
        const selected = countsByGroup.get(groupId) ?? 0;
        if (group.minSelected > 0 && selected < group.minSelected) {
          throw badRequest("Missing required modifiers");
        }
        if (group.maxSelected > 0 && selected > group.maxSelected) {
          throw badRequest("Too many modifiers selected");
        }
      }

      const modifierTotal = modifiers.reduce(
        (acc, mod) => acc + Number(mod.option.price) * mod.quantity,
        0,
      );

      const unitPrice = Number(menuItem.price) + modifierTotal;
      const lineTotals = computeTotals({
        unitPrice,
        quantity: item.quantity,
        taxRate: menuItem.taxRate ? Number(menuItem.taxRate.rate) : null,
        isInclusive: menuItem.taxRate?.isInclusive,
      });

      subtotal += lineTotals.subtotal;
      taxTotal += lineTotals.tax;
      total += lineTotals.total;

      return {
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity: item.quantity,
        unitPrice: unitPrice.toString(),
        totalPrice: lineTotals.total.toString(),
        taxAmount: lineTotals.tax.toString(),
        notes: item.notes ? sanitizeText(item.notes) : null,
        modifiers: {
          create: modifiers.map((mod) => ({
            modifierOptionId: mod.option.id,
            name: mod.option.name,
            price: String(mod.option.price),
          })),
        },
      };
    });

    const orderPrefix = restaurant.settings?.orderPrefix ?? "ORD";
    const invoicePrefix = restaurant.settings?.invoicePrefix ?? "FAC";

    const orderSeries = await tx.orderSeries.upsert({
      where: { restaurantId: restaurant.id },
      update: { lastNumber: { increment: 1 } },
      create: { restaurantId: restaurant.id, prefix: orderPrefix, lastNumber: 1 },
    });

    const invoiceSeries = await tx.invoiceSeries.upsert({
      where: { restaurantId: restaurant.id },
      update: { lastNumber: { increment: 1 } },
      create: {
        restaurantId: restaurant.id,
        prefix: invoicePrefix,
        lastNumber: 1,
      },
    });

    let customerId: string | null = null;
    if (input.customer?.name) {
      const normalizedPhone = normalizePhone(input.customer.phone);
      const existingCustomer =
        normalizedPhone || input.customer.email
          ? await tx.customer.findFirst({
              where: {
                restaurantId: restaurant.id,
                OR: [
                  normalizedPhone ? { phone: normalizedPhone } : undefined,
                  input.customer.email ? { email: input.customer.email } : undefined,
                ].filter(Boolean) as Array<{ phone?: string; email?: string }>,
              },
            })
          : null;

      const customer =
        existingCustomer ??
        (await tx.customer.create({
          data: {
            restaurantId: restaurant.id,
            name: sanitizeText(input.customer.name),
            email: input.customer.email,
            phone: normalizedPhone ?? undefined,
          },
        }));

      customerId = customer.id;
    }

    const deliveryAddress = input.deliveryAddress
      ? await tx.address.create({
          data: {
            line1: sanitizeText(input.deliveryAddress.line1),
            line2: input.deliveryAddress.line2
              ? sanitizeText(input.deliveryAddress.line2)
              : undefined,
            city: sanitizeText(input.deliveryAddress.city),
            state: input.deliveryAddress.state
              ? sanitizeText(input.deliveryAddress.state)
              : undefined,
            postal: input.deliveryAddress.postal,
            country: input.deliveryAddress.country,
          },
        })
      : null;

    const order = await tx.order.create({
      data: {
        restaurantId: restaurant.id,
        publicToken: crypto.randomUUID(),
        orderNumber: orderSeries.lastNumber,
        type: input.type,
        channel: input.channel,
        status: "PENDING",
        tableId: input.tableId ?? undefined,
        customerId: customerId ?? undefined,
        deliveryAddressId: deliveryAddress?.id,
        customerName: input.customer?.name
          ? sanitizeText(input.customer.name)
          : undefined,
        customerPhone: normalizePhone(input.customer?.phone) ?? undefined,
        customerEmail: input.customer?.email,
        notes: input.notes ? sanitizeText(input.notes) : undefined,
      subtotal: subtotal.toString(),
      taxTotal: taxTotal.toString(),
      total: total.toString(),
        currency: restaurant.settings?.currency ?? "ARS",
        items: { create: orderItemsData },
        statusHistory: { create: { status: "PENDING" } },
      },
      include: { items: true },
    });

    const orderItemsDb = order.items as OrderItemDb[];

    await tx.kitchenTicket.create({
      data: {
        orderId: order.id,
        items: {
          create: orderItemsDb.map((item) => ({
            orderItemId: item.id,
            quantity: item.quantity,
            notes: item.notes,
          })),
        },
      },
    });

    await tx.invoice.create({
      data: {
        restaurantId: restaurant.id,
        orderId: order.id,
        number: invoiceSeries.lastNumber,
        prefix: invoiceSeries.prefix,
        subtotal: subtotal.toString(),
        taxTotal: taxTotal.toString(),
        total: total.toString(),
        currency: restaurant.settings?.currency ?? "ARS",
        status: "DRAFT",
        type: "B",
        lines: {
          create: orderItemsDb.map((item) => ({
            orderItemId: item.id,
            description: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toString(),
            total: item.totalPrice.toString(),
            taxAmount: item.taxAmount.toString(),
            taxLabel: Number(item.taxAmount) > 0 ? "Tax" : null,
          })),
        },
      },
    });

    publishOrderEvent({
      restaurantId: restaurant.id,
      type: "ORDER_PLACED",
      orderId: order.id,
      payload: {
        orderNumber: order.orderNumber,
        status: order.status,
        total: Number(order.total),
      },
    });

    if (order.customerEmail) {
      await sendOrderConfirmation({
        to: order.customerEmail,
        restaurantName: restaurant.name,
        orderNumber: order.orderNumber,
        trackingUrl: `${env.NEXTAUTH_URL}/order/${order.publicToken}`,
      });
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      publicToken: order.publicToken,
      status: order.status,
      total: order.total,
    };
  });
};

type OrderStatus = "PENDING" | "CONFIRMED" | "IN_PREP" | "READY" | "COMPLETED" | "CANCELLED";

export const updateOrderStatus = async (params: {
  orderId: string;
  status: OrderStatus;
}) => {
  const session = await auth();

  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    select: { id: true, restaurantId: true, status: true },
  });

  if (!order) {
    throw notFound("Order not found");
  }

  assertRestaurantPermission(
    session,
    order.restaurantId,
    PERMISSIONS.ORDERS_MANAGE,
  );

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: params.status,
      statusHistory: {
        create: { status: params.status, changedById: session?.user?.id },
      },
    },
  });

  publishOrderEvent({
    restaurantId: order.restaurantId,
    type: "ORDER_UPDATED",
    orderId: order.id,
    payload: { status: updated.status },
  });

  return { orderId: order.id, status: updated.status };
};
