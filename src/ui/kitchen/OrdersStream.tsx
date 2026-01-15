"use client";

import { useEffect, useMemo, useState } from "react";

type OrderEvent = {
  type: string;
  orderId: string;
  payload?: {
    orderNumber?: number;
    status?: string;
    total?: string;
  };
};

export const OrdersStream = ({ restaurantId }: { restaurantId: string }) => {
  const [events, setEvents] = useState<OrderEvent[]>([]);

  const sourceUrl = useMemo(
    () => `/api/realtime/orders?restaurantId=${restaurantId}`,
    [restaurantId],
  );

  useEffect(() => {
    const source = new EventSource(sourceUrl);

    const handleEvent = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data) as OrderEvent;
        setEvents((prev) => [parsed, ...prev].slice(0, 20));
      } catch {
        // ignore malformed events
      }
    };

    source.addEventListener("ORDER_PLACED", handleEvent);
    source.addEventListener("ORDER_UPDATED", handleEvent);
    source.addEventListener("ORDER_CANCELLED", handleEvent);

    return () => {
      source.close();
    };
  }, [sourceUrl]);

  if (!events.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
        Waiting for new orders...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div
          key={`${event.orderId}-${index}`}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>{event.type.replace("_", " ")}</span>
            <span>{event.orderId}</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-900">
                #{event.payload?.orderNumber ?? "—"}
              </p>
              <p className="text-sm text-slate-600">
                Status: {event.payload?.status ?? "—"}
              </p>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {event.payload?.total ? `$${event.payload.total}` : ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
