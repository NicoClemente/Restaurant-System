"use server";

import { prisma } from "@/db";
import { assertRestaurantPermission } from "@/lib/authorization";
import { badRequest } from "@/lib/errors";
import { PERMISSIONS } from "@/lib/permissions";
import { auth } from "@/lib/auth";
import { issueAfipInvoice } from "@/services/afip";
import { revalidatePath } from "next/cache";

type TaxCondition =
  | "RESPONSABLE_INSCRIPTO"
  | "MONOTRIBUTO"
  | "EXENTO"
  | "CONSUMIDOR_FINAL";

const mapDocType = (taxCondition: TaxCondition, taxId?: string | null) => {
  if (taxId) return 80; // CUIT
  if (taxCondition === "MONOTRIBUTO") return 96; // DNI
  return 99; // Consumidor Final
};

export const issueInvoiceForOrder = async (orderId: string) => {
  const session = await auth();

  const invoice = await prisma.invoice.findUnique({
    where: { orderId },
    include: {
      order: true,
      restaurant: { include: { settings: true } },
    },
  });

  if (!invoice) {
    throw badRequest("Invoice not found");
  }

  assertRestaurantPermission(
    session,
    invoice.restaurantId,
    PERMISSIONS.BILLING_MANAGE,
  );

  if (invoice.status !== "DRAFT") {
    return { success: false, error: "Invoice already issued" };
  }

  const settings = invoice.restaurant.settings;
  if (!settings?.pointOfSale) {
    throw badRequest("Point of sale not configured");
  }

  const cae = await issueAfipInvoice({
    pointOfSale: settings.pointOfSale,
    invoiceType: invoice.type,
    total: Number(invoice.total),
    net: Number(invoice.subtotal),
    tax: Number(invoice.taxTotal),
    customerDocType: mapDocType(
      invoice.order.customerTaxCondition,
      invoice.order.customerTaxId,
    ),
    customerDocNumber: invoice.order.customerTaxId ?? "0",
  });

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: "ISSUED",
      afipCae: cae.cae,
      afipCaeDueAt: cae.caeDueAt,
      afipReceiptNumber: cae.receiptNumber,
    },
  });

  revalidatePath(`/admin/invoices/${orderId}`);
  return { success: true };
};
