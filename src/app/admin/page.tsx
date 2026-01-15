import { prisma } from "@/db";
import { assertRestaurantPermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/permissions";
import { getStaffContext } from "@/lib/staff";
import { OrdersBoard } from "@/ui/admin/OrdersBoard";

export default async function AdminPage() {
  const { restaurantId, session } = await getStaffContext();

  assertRestaurantPermission(session, restaurantId, PERMISSIONS.ORDERS_MANAGE);

  const orders = await prisma.order.findMany({
    where: { restaurantId },
    orderBy: { placedAt: "desc" },
    take: 20,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      currency: true,
      customerName: true,
      placedAt: true,
    },
  });

  type OrderStatus =
    | "PENDING"
    | "CONFIRMED"
    | "IN_PREP"
    | "READY"
    | "COMPLETED"
    | "CANCELLED";

  const normalized = orders.map((order: {
    id: string;
    orderNumber: number;
    status: OrderStatus;
    total: unknown;
    currency: string;
    customerName: string | null;
    placedAt: Date;
  }) => ({
    ...order,
    status: order.status as OrderStatus,
    total: String(order.total),
    placedAt: order.placedAt.toISOString(),
  }));

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          Pedidos recientes
        </h2>
        <p className="text-sm text-slate-500">
          Cambia estados y controla el flujo de cocina.
        </p>
      </div>
      <OrdersBoard orders={normalized} />
    </section>
  );
}
