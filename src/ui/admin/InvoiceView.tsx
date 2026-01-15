import { IssueInvoiceButton } from "@/ui/admin/IssueInvoiceButton";
import { PrintButton } from "@/ui/admin/PrintButton";

type InvoiceLine = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: string;
  total: string;
};

type Props = {
  invoice: {
    number: number;
    prefix: string | null;
    issuedAt: string;
    currency: string;
    subtotal: string;
    taxTotal: string;
    total: string;
    orderNumber: number;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    status: "DRAFT" | "ISSUED" | "VOIDED";
    afipCae: string | null;
    afipCaeDueAt: string | null;
    afipReceiptNumber: string | null;
  };
  lines: InvoiceLine[];
  orderId: string;
  afipEnabled: boolean;
};

export const InvoiceView = ({ invoice, lines, orderId, afipEnabled }: Props) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Factura
          </p>
          <h2 className="text-2xl font-semibold text-slate-900">
            {invoice.prefix ?? "FAC"}-{invoice.number}
          </h2>
          <p className="text-sm text-slate-500">
            Pedido #{invoice.orderNumber}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {afipEnabled ? (
            <IssueInvoiceButton orderId={orderId} status={invoice.status} />
          ) : null}
          <PrintButton />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Cliente
          </p>
          <p className="text-sm font-semibold text-slate-900">
            {invoice.customerName ?? "Sin nombre"}
          </p>
          <p className="text-xs text-slate-500">{invoice.customerEmail}</p>
          <p className="text-xs text-slate-500">{invoice.customerPhone}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Fecha
          </p>
          <p className="text-sm font-semibold text-slate-900">
            {new Date(invoice.issuedAt).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500">
            Estado: {invoice.status}
          </p>
          {invoice.afipCae ? (
            <p className="text-xs text-slate-500">CAE: {invoice.afipCae}</p>
          ) : null}
          {invoice.afipCaeDueAt ? (
            <p className="text-xs text-slate-500">
              Vto CAE: {new Date(invoice.afipCaeDueAt).toLocaleDateString()}
            </p>
          ) : null}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Totales
          </p>
          <p className="text-sm text-slate-500">
            Subtotal: {invoice.currency} {Number(invoice.subtotal).toFixed(2)}
          </p>
          <p className="text-sm text-slate-500">
            Impuestos: {invoice.currency} {Number(invoice.taxTotal).toFixed(2)}
          </p>
          <p className="text-base font-semibold text-slate-900">
            Total: {invoice.currency} {Number(invoice.total).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Ítems</h3>
        <div className="mt-4 space-y-3 text-sm">
          {lines.map((line) => (
            <div
              key={line.id}
              className="flex items-center justify-between border-b border-slate-100 pb-3"
            >
              <div>
                <p className="font-medium text-slate-900">
                  {line.description}
                </p>
                <p className="text-xs text-slate-500">
                  {line.quantity} × {invoice.currency}{" "}
                  {Number(line.unitPrice).toFixed(2)}
                </p>
              </div>
              <p className="font-semibold text-slate-900">
                {invoice.currency} {Number(line.total).toFixed(2)}
              </p>
            </div>
          ))}
          {!lines.length ? (
            <p className="text-sm text-slate-500">Sin líneas.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};
