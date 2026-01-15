import { notFound } from "next/navigation";

import { prisma } from "@/db";
import { assertRestaurantPermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/permissions";
import { getStaffContext } from "@/lib/staff";
import { env } from "@/lib/env";
import { InvoiceView } from "@/ui/admin/InvoiceView";

type PageProps = {
  params: { orderId: string };
};

export default async function InvoicePage({ params }: PageProps) {
  const { restaurantId, session } = await getStaffContext();
  assertRestaurantPermission(session, restaurantId, PERMISSIONS.BILLING_VIEW);

  const invoice = await prisma.invoice.findUnique({
    where: { orderId: params.orderId },
    include: {
      order: {
        select: {
          orderNumber: true,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
        },
      },
      lines: { orderBy: { id: "asc" } },
    },
  });

  if (!invoice || invoice.restaurantId !== restaurantId) {
    notFound();
  }

  const normalizedInvoice = {
    number: invoice.number,
    prefix: invoice.prefix,
    issuedAt: invoice.issuedAt.toISOString(),
    currency: invoice.currency,
    subtotal: invoice.subtotal.toString(),
    taxTotal: invoice.taxTotal.toString(),
    total: invoice.total.toString(),
    orderNumber: invoice.order.orderNumber,
    customerName: invoice.order.customerName,
    customerEmail: invoice.order.customerEmail,
    customerPhone: invoice.order.customerPhone,
    status: invoice.status,
    afipCae: invoice.afipCae,
    afipCaeDueAt: invoice.afipCaeDueAt
      ? invoice.afipCaeDueAt.toISOString()
      : null,
    afipReceiptNumber: invoice.afipReceiptNumber,
  };

  type InvoiceLineRow = {
    id: string;
    description: string;
    quantity: number;
    unitPrice: unknown;
    total: unknown;
  };

  const lines = (invoice.lines as InvoiceLineRow[]).map((line) => ({
    id: line.id,
    description: line.description,
    quantity: line.quantity,
    unitPrice: String(line.unitPrice),
    total: String(line.total),
  }));

  return (
    <InvoiceView
      orderId={params.orderId}
      invoice={normalizedInvoice}
      lines={lines}
      afipEnabled={Boolean(env.AFIP_ENABLED)}
    />
  );
}
