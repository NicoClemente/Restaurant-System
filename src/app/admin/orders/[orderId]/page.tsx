import { notFound } from "next/navigation";

import { prisma } from "@/db";
import { assertRestaurantPermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/permissions";
import { getStaffContext } from "@/lib/staff";
import { OrderDetailView } from "@/ui/admin/OrderDetailView";

type PageProps = {
  params: { orderId: string };
};

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { restaurantId, session } = await getStaffContext();
  assertRestaurantPermission(session, restaurantId, PERMISSIONS.ORDERS_VIEW);

  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: {
      items: {
        include: {
          modifiers: true,
        },
      },
    },
  });

  if (!order || order.restaurantId !== restaurantId) {
    notFound();
  }

  const normalizedOrder = {
    orderNumber: order.orderNumber,
    status: order.status,
    placedAt: order.placedAt.toISOString(),
    total: order.total.toString(),
    currency: order.currency,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    notes: order.notes,
  };

  type OrderItemRow = {
    id: string;
    name: string;
    quantity: number;
    unitPrice: unknown;
    totalPrice: unknown;
    notes: string | null;
    modifiers: Array<{ id: string; name: string; price: unknown }>;
  };

  const items = (order.items as OrderItemRow[]).map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    unitPrice: String(item.unitPrice),
    totalPrice: String(item.totalPrice),
    notes: item.notes,
    modifiers: item.modifiers.map((modifier) => ({
      id: modifier.id,
      name: modifier.name,
      price: String(modifier.price),
    })),
  }));

  return <OrderDetailView order={normalizedOrder} items={items} />;
}
