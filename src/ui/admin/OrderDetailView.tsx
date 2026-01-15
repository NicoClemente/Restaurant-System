type ModifierLine = {
  id: string;
  name: string;
  price: string;
};

type OrderItemLine = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  modifiers: ModifierLine[];
  notes: string | null;
};

type Props = {
  order: {
    orderNumber: number;
    status: string;
    placedAt: string;
    total: string;
    currency: string;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    notes: string | null;
  };
  items: OrderItemLine[];
};

export const OrderDetailView = ({ order, items }: Props) => {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Pedido #{order.orderNumber}
            </p>
            <h2 className="text-2xl font-semibold text-slate-900">
              {order.customerName ?? "Sin nombre"}
            </h2>
            <p className="text-sm text-slate-500">
              {new Date(order.placedAt).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Estado
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {order.status.replace("_", " ")}
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {order.currency} {Number(order.total).toFixed(2)}
            </p>
          </div>
        </div>
        {order.notes ? (
          <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {order.notes}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Ítems</h3>
        <div className="mt-4 space-y-4 text-sm">
          {items.map((item) => (
            <div key={item.id} className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">
                    {item.quantity} × {order.currency}{" "}
                    {Number(item.unitPrice).toFixed(2)}
                  </p>
                </div>
                <p className="font-semibold text-slate-900">
                  {order.currency} {Number(item.totalPrice).toFixed(2)}
                </p>
              </div>
              {item.modifiers.length ? (
                <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  {item.modifiers.map((modifier) => (
                    <div key={modifier.id} className="flex justify-between">
                      <span>{modifier.name}</span>
                      <span>
                        {order.currency} {Number(modifier.price).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
              {item.notes ? (
                <p className="mt-2 text-xs text-slate-500">{item.notes}</p>
              ) : null}
            </div>
          ))}
          {!items.length ? (
            <p className="text-sm text-slate-500">Sin ítems.</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Cliente</h3>
        <div className="mt-3 text-sm text-slate-600">
          <p>{order.customerEmail ?? "Sin email"}</p>
          <p>{order.customerPhone ?? "Sin teléfono"}</p>
        </div>
      </div>
    </div>
  );
};
