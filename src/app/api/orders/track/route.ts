import { prisma } from "@/db";

export const runtime = "nodejs";

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return Response.json({ error: "token is required" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { publicToken: token },
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
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  type OrderItemRow = {
    id: string;
    name: string;
    quantity: number;
    unitPrice: unknown;
    totalPrice: unknown;
  };

  return Response.json({
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
    currency: order.currency,
    placedAt: order.placedAt,
    items: (order.items as OrderItemRow[]).map((item) => ({
      ...item,
      unitPrice: String(item.unitPrice),
      totalPrice: String(item.totalPrice),
    })),
  });
};
