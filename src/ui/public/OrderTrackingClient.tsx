"use client";

import { useEffect, useState } from "react";

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
};

type OrderPayload = {
  orderId: string;
  orderNumber: number;
  status: string;
  total: string;
  currency: string;
  placedAt: string;
  items: OrderItem[];
};

type Props = {
  token: string;
  initial: OrderPayload;
};

export const OrderTrackingClient = ({ token, initial }: Props) => {
  const [order, setOrder] = useState<OrderPayload>(initial);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/orders/track?token=${token}`);
        if (!response.ok) {
          throw new Error("Failed to refresh");
        }
        const data = (await response.json()) as OrderPayload;
        setOrder(data);
        setError(null);
      } catch (err) {
        setError("No pudimos actualizar el estado.");
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Pedido</p>
            <p className="text-2xl font-semibold text-slate-900">
              #{order.orderNumber}
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
            {order.status.replace("_", " ")}
          </span>
        </div>
        <div className="mt-3 text-sm text-slate-500">
          Total:{" "}
          <span className="font-semibold text-slate-900">
            {order.currency} {Number(order.total).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">
          Ítems del pedido
        </h2>
        <div className="mt-4 space-y-3 text-sm">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">{item.name}</p>
                <p className="text-slate-500">
                  {item.quantity} × {order.currency}{" "}
                  {Number(item.unitPrice).toFixed(2)}
                </p>
              </div>
              <p className="font-semibold text-slate-900">
                {order.currency} {Number(item.totalPrice).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <p className="text-xs text-slate-400">
          Actualizamos automáticamente cada 5 segundos.
        </p>
      )}
    </div>
  );
};
