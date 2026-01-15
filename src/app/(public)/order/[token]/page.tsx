import { notFound } from "next/navigation";

import { prisma } from "@/db";
import { OrderTrackingClient } from "@/ui/public/OrderTrackingClient";

type PageProps = {
  params: { token: string };
};

export default async function OrderTrackingPage({ params }: PageProps) {
  const order = await prisma.order.findUnique({
    where: { publicToken: params.token },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      currency: true,
      placedAt: true,
      items: {
        select: {
          id: true,
          name: true,
          quantity: true,
          unitPrice: true,
          totalPrice: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  type OrderItemRow = {
    id: string;
    name: string;
    quantity: number;
    unitPrice: unknown;
    totalPrice: unknown;
  };

  const initial = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total.toString(),
    currency: order.currency,
    placedAt: order.placedAt.toISOString(),
    items: (order.items as OrderItemRow[]).map((item) => ({
      ...item,
      unitPrice: String(item.unitPrice),
      totalPrice: String(item.totalPrice),
    })),
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="mb-6 space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">
            Seguimiento de pedido
          </h1>
          <p className="text-sm text-slate-500">
            Te avisaremos cuando tu pedido cambie de estado.
          </p>
        </header>
        <OrderTrackingClient token={params.token} initial={initial} />
      </div>
    </div>
  );
}
