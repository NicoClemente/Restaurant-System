import { prisma } from "@/db";
import { getStaffContext } from "@/lib/staff";
import { OrdersBoard } from "@/ui/admin/OrdersBoard";

export default async function KitchenPage() {
  const { restaurantId } = await getStaffContext();

  const orders = await prisma.order.findMany({
    where: {
      restaurantId,
      status: { in: ["PENDING", "CONFIRMED", "IN_PREP"] },
    },
    orderBy: { placedAt: "desc" },
    take: 30,
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
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Kitchen</h1>
            <p className="text-sm text-slate-500">
              Pedidos en preparación
            </p>
          </div>
        </div>
        <OrdersBoard orders={normalized} />
      </div>
    </div>
  );
}
