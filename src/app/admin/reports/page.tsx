import { subDays, startOfDay } from "date-fns";

import { prisma } from "@/db";
import { assertRestaurantPermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/permissions";
import { getStaffContext } from "@/lib/staff";

type OrderTotalRow = { total: unknown };

const sumTotals = (orders: OrderTotalRow[]) =>
  orders.reduce((acc, order) => acc + Number(order.total), 0);

export default async function AdminReportsPage() {
  const { restaurantId, session } = await getStaffContext();
  assertRestaurantPermission(session, restaurantId, PERMISSIONS.BILLING_VIEW);

  const today = startOfDay(new Date());
  const last7 = subDays(today, 7);
  const last30 = subDays(today, 30);

  const [todayOrders, weekOrders, monthOrders, topItems] = await Promise.all([
    prisma.order.findMany({
      where: { restaurantId, placedAt: { gte: today } },
      select: { total: true },
    }),
    prisma.order.findMany({
      where: { restaurantId, placedAt: { gte: last7 } },
      select: { total: true },
    }),
    prisma.order.findMany({
      where: { restaurantId, placedAt: { gte: last30 } },
      select: { total: true },
    }),
    prisma.orderItem.groupBy({
      by: ["name"],
      where: { order: { restaurantId } },
      _sum: { quantity: true },
      _count: { _all: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 6,
    }),
  ]);

  const currency =
    (await prisma.restaurantSettings.findUnique({
      where: { restaurantId },
      select: { currency: true },
    }))?.currency ?? "ARS";

  const stats = [
    { label: "Hoy", total: sumTotals(todayOrders) },
    { label: "Últimos 7 días", total: sumTotals(weekOrders) },
    { label: "Últimos 30 días", total: sumTotals(monthOrders) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Reportes</h2>
        <p className="text-sm text-slate-500">
          Ventas y productos más vendidos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs uppercase tracking-wide text-slate-400">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {currency} {stat.total.toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">
          Productos más vendidos
        </h3>
        <div className="mt-4 space-y-3 text-sm">
          {topItems.map((item: { name: string; _sum: { quantity: number | null } }) => (
            <div
              key={item.name}
              className="flex items-center justify-between border-b border-slate-100 pb-2"
            >
              <span className="text-slate-700">{item.name}</span>
              <span className="text-slate-500">
                {item._sum.quantity ?? 0} uds
              </span>
            </div>
          ))}
          {!topItems.length ? (
            <p className="text-sm text-slate-500">Sin datos.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
