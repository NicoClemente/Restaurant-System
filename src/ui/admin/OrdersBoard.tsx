"use client";

import { useState, useTransition } from "react";

import { updateOrderStatus } from "@/actions/orders";
import Link from "next/link";

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PREP"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

type OrderRow = {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  total: string;
  currency: string;
  customerName: string | null;
  placedAt: string;
};

type Props = {
  orders: OrderRow[];
};

const STATUS_FLOW: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "IN_PREP",
  "READY",
  "COMPLETED",
];

export const OrdersBoard = ({ orders }: Props) => {
  const [state, setState] = useState(orders);
  const [isPending, startTransition] = useTransition();

  const handleStatus = (orderId: string, status: OrderStatus) => {
    startTransition(async () => {
      await updateOrderStatus({ orderId, status });
      setState((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status } : order,
        ),
      );
    });
  };

  return (
    <div className="space-y-4">
      {state.map((order) => (
        <div
          key={order.id}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Pedido #{order.orderNumber}
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {order.customerName ?? "Sin nombre"}
              </p>
              <p className="text-sm text-slate-500">
                {new Date(order.placedAt).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-lg font-semibold text-slate-900">
                {order.currency} {Number(order.total).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {STATUS_FLOW.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => handleStatus(order.id, status)}
                disabled={isPending}
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                  order.status === status
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {status.replace("_", " ")}
              </button>
            ))}
            <Link
              href={`/admin/orders/${order.id}`}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Ver detalle
            </Link>
            <Link
              href={`/admin/invoices/${order.id}`}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Factura
            </Link>
          </div>
        </div>
      ))}
      {!state.length ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-sm text-slate-500">
          No hay pedidos recientes.
        </div>
      ) : null}
    </div>
  );
};
