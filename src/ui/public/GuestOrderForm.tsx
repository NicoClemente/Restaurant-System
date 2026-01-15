"use client";

import { useMemo, useState } from "react";
import { useTransition } from "react";

import { createGuestOrder } from "@/actions/orders";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  categoryId: string | null;
  imageUrl: string | null;
  modifierGroups: Array<{
    id: string;
    name: string;
    minSelected: number;
    maxSelected: number;
    options: Array<{ id: string; name: string; price: string }>;
  }>;
};

type Category = {
  id: string;
  name: string;
};

type Props = {
  restaurantId: string;
  currency: string;
  items: MenuItem[];
  categories: Category[];
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  modifiers: Array<{ modifierOptionId: string; name: string; price: number }>;
};

type ModifierSelection = Record<string, string[]>;

export const GuestOrderForm = ({
  restaurantId,
  currency,
  items,
  categories,
}: Props) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [modifierSelections, setModifierSelections] = useState<
    Record<string, ModifierSelection>
  >({});
  const [status, setStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const groupedItems = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const category of categories) {
      map.set(category.id, []);
    }
    for (const item of items) {
      const key = item.categoryId ?? "uncategorized";
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)?.push(item);
    }
    return map;
  }, [items, categories]);

  const total = useMemo(() => {
    const sum = cart.reduce((acc, item) => {
      const modifiersTotal = item.modifiers.reduce(
        (modAcc, mod) => modAcc + mod.price,
        0,
      );
      return acc + (item.price + modifiersTotal) * item.quantity;
    }, 0);
    return sum.toFixed(2);
  }, [cart]);

  const validateSelection = (item: MenuItem, selection: ModifierSelection) => {
    return item.modifierGroups.every((group) => {
      const selected = selection[group.id] ?? [];
      if (group.minSelected > 0 && selected.length < group.minSelected) {
        return false;
      }
      if (group.maxSelected > 0 && selected.length > group.maxSelected) {
        return false;
      }
      return true;
    });
  };

  const getSelectedModifiers = (item: MenuItem, selection: ModifierSelection) =>
    item.modifierGroups.flatMap((group) => {
      const selected = selection[group.id] ?? [];
      return group.options
        .filter((option) => selected.includes(option.id))
        .map((option) => ({
          modifierOptionId: option.id,
          name: option.name,
          price: Number(option.price),
        }));
    });

  const addToCart = (item: MenuItem) => {
    const selection = modifierSelections[item.id] ?? {};
    if (!validateSelection(item, selection)) {
      setStatus({
        success: false,
        message: "Selecciona los modificadores obligatorios.",
      });
      return;
    }

    const modifiers = getSelectedModifiers(item, selection);

    setCart((prev) => {
      const existing = prev.find(
        (entry) =>
          entry.id === item.id &&
          JSON.stringify(entry.modifiers) === JSON.stringify(modifiers),
      );
      if (existing) {
        return prev.map((entry) =>
          entry.id === item.id &&
          JSON.stringify(entry.modifiers) === JSON.stringify(modifiers)
            ? { ...entry, quantity: entry.quantity + 1 }
            : entry,
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: Number(item.price),
          quantity: 1,
          modifiers,
        },
      ];
    });
  };

  const incrementCartItem = (index: number) => {
    setCart((prev) =>
      prev.map((entry, idx) =>
        idx === index ? { ...entry, quantity: entry.quantity + 1 } : entry,
      ),
    );
  };

  const decrementCartItem = (index: number) => {
    setCart((prev) =>
      prev
        .map((entry, idx) =>
          idx === index ? { ...entry, quantity: entry.quantity - 1 } : entry,
        )
        .filter((entry) => entry.quantity > 0),
    );
  };

  const submitOrder = () => {
    setStatus(null);
    startTransition(async () => {
      try {
        const order = await createGuestOrder({
          restaurantId,
          type: "TAKEAWAY",
          channel: "ONLINE",
          customer: customerName
            ? {
                name: customerName,
                phone: customerPhone || undefined,
              }
            : undefined,
          notes: notes || undefined,
          items: cart.map((item) => ({
            menuItemId: item.id,
            quantity: item.quantity,
            modifiers: item.modifiers.map((modifier) => ({
              modifierOptionId: modifier.modifierOptionId,
              quantity: 1,
            })),
          })),
        });
        setStatus({
          success: true,
          message: `Pedido #${order.orderNumber} recibido. Seguimiento: /order/${order.publicToken}`,
        });
        setCart([]);
        setModifierSelections({});
        setNotes("");
      } catch (error) {
        setStatus({
          success: false,
          message: "No pudimos crear el pedido. Intenta de nuevo.",
        });
      }
    });
  };

  const isCheckoutDisabled =
    isPending || cart.length === 0 || !customerName.trim();

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-8">
        {categories.map((category) => {
          const categoryItems = groupedItems.get(category.id) ?? [];
          if (!categoryItems.length) return null;
          return (
            <section key={category.id}>
              <h2 className="mb-4 text-xl font-semibold text-slate-900">
                {category.name}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {categoryItems.map((item) => {
                  const selection = modifierSelections[item.id] ?? {};
                  const isValid = validateSelection(item, selection);
                  return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="mb-3 h-32 w-full rounded-lg object-cover"
                      />
                    ) : null}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          {item.name}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {item.description}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        {currency} {Number(item.price).toFixed(2)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => addToCart(item)}
                      className="mt-4 w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                      disabled={!isValid}
                    >
                      {isValid ? "Agregar" : "Selecciona modificadores"}
                    </button>
                    {item.modifierGroups.length ? (
                      <div className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                        {item.modifierGroups.map((group) => {
                          const selected = selection[group.id] ?? [];
                          const maxReached =
                            group.maxSelected > 0 &&
                            selected.length >= group.maxSelected;

                          return (
                            <div key={group.id}>
                              <div className="flex items-center justify-between">
                                <p className="font-semibold text-slate-700">
                                  {group.name}
                                </p>
                                <span>
                                  {group.minSelected > 0
                                    ? `Min ${group.minSelected}`
                                    : "Opcional"}
                                  {group.maxSelected > 0
                                    ? ` • Max ${group.maxSelected}`
                                    : ""}
                                </span>
                              </div>
                              <div className="mt-2 space-y-2">
                                {group.options.map((option) => {
                                  const checked = selected.includes(option.id);
                                  return (
                                    <label
                                      key={option.id}
                                      className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2"
                                    >
                                      <div>
                                        <p className="text-slate-700">
                                          {option.name}
                                        </p>
                                        <p className="text-slate-400">
                                          {currency}{" "}
                                          {Number(option.price).toFixed(2)}
                                        </p>
                                      </div>
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        disabled={!checked && maxReached}
                                        onChange={(event) => {
                                          setModifierSelections((prev) => {
                                            const current = {
                                              ...(prev[item.id] ?? {}),
                                            };
                                            const currentList =
                                              current[group.id] ?? [];
                                            const nextList = event.target.checked
                                              ? [...currentList, option.id]
                                              : currentList.filter(
                                                  (value) => value !== option.id,
                                                );
                                            current[group.id] = nextList;
                                            return {
                                              ...prev,
                                              [item.id]: current,
                                            };
                                          });
                                        }}
                                      />
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Tu pedido
        </h2>
        <div className="mt-4 space-y-3">
          {cart.length === 0 ? (
            <p className="text-sm text-slate-500">Selecciona productos.</p>
          ) : (
            cart.map((item, index) => (
              <div
                key={`${item.id}-${item.modifiers.map((m) => m.modifierOptionId).join("-")}`}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="text-slate-500">
                    {item.quantity} × {currency} {item.price.toFixed(2)}
                  </p>
                  {item.modifiers.length ? (
                    <p className="text-xs text-slate-400">
                      +{" "}
                      {item.modifiers.map((mod) => mod.name).join(", ")}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => decrementCartItem(index)}
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => incrementCartItem(index)}
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs"
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-4 border-t border-slate-200 pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Total</span>
            <span className="font-semibold text-slate-900">
              {currency} {total}
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500">Nombre</label>
            <input
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">
              Teléfono
            </label>
            <input
              value={customerPhone}
              onChange={(event) => setCustomerPhone(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              placeholder="Opcional"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">
              Notas
            </label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              rows={3}
              placeholder="Sin cebolla, etc."
            />
          </div>
        </div>

        {status ? (
          <p
            className={`mt-4 rounded-md px-3 py-2 text-sm ${
              status.success
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {status.message}
          </p>
        ) : null}

        <button
          type="button"
          onClick={submitOrder}
          disabled={isCheckoutDisabled}
          className="mt-6 w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isPending ? "Enviando..." : "Confirmar pedido"}
        </button>
      </aside>
    </div>
  );
};
