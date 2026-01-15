"use client";

import { useFormState } from "react-dom";

import {
  createMenuCategory,
  createMenuItem,
  createModifierGroup,
  createModifierOption,
  deleteMenuCategory,
  deleteMenuItem,
  attachModifierGroupToItem,
  detachModifierGroupFromItem,
  toggleMenuItemActive,
} from "@/actions/menu";
import { ImageUploader } from "@/ui/admin/ImageUploader";

type Category = {
  id: string;
  name: string;
};

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  categoryId: string | null;
  imageUrl: string | null;
  isActive: boolean;
  modifierGroups: Array<{ id: string; name: string }>;
};

type ModifierGroup = {
  id: string;
  name: string;
  minSelected: number;
  maxSelected: number;
  options: Array<{ id: string; name: string; price: string }>;
};

type Props = {
  restaurantId: string;
  categories: Category[];
  items: MenuItem[];
  modifierGroups: ModifierGroup[];
};

const initialState = { success: false, error: "" };

export const MenuManager = ({
  restaurantId,
  categories,
  items,
  modifierGroups,
}: Props) => {
  const [categoryState, categoryAction] = useFormState(
    createMenuCategory,
    initialState,
  );
  const [itemState, itemAction] = useFormState(
    createMenuItem,
    initialState,
  );
  const [groupState, groupAction] = useFormState(
    createModifierGroup,
    initialState,
  );
  const [optionState, optionAction] = useFormState(
    createModifierOption,
    initialState,
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_2fr]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Nueva categoría
          </h2>
          <form action={categoryAction} className="mt-4 space-y-3">
            <input type="hidden" name="restaurantId" value={restaurantId} />
            <input
              name="name"
              placeholder="Nombre"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              required
            />
            <textarea
              name="description"
              placeholder="Descripción"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              rows={3}
            />
            {categoryState?.error ? (
              <p className="text-xs text-red-500">{categoryState.error}</p>
            ) : null}
            <button
              type="submit"
              className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
            >
              Crear categoría
            </button>
          </form>
        </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Nuevo producto
          </h2>
          <form action={itemAction} className="mt-4 space-y-3">
            <input type="hidden" name="restaurantId" value={restaurantId} />
            <input
              name="name"
              placeholder="Nombre"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              required
            />
            <textarea
              name="description"
              placeholder="Descripción"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              rows={3}
            />
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              placeholder="Precio"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              required
            />
            <select
              name="categoryId"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Sin categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {itemState?.error ? (
              <p className="text-xs text-red-500">{itemState.error}</p>
            ) : null}
            <button
              type="submit"
              className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
            >
              Crear producto
            </button>
          </form>
        </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Grupo de modificadores
        </h2>
        <form action={groupAction} className="mt-4 space-y-3">
          <input type="hidden" name="restaurantId" value={restaurantId} />
          <input
            name="name"
            placeholder="Nombre del grupo"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              name="minSelected"
              type="number"
              min="0"
              max="10"
              placeholder="Mínimo"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              name="maxSelected"
              type="number"
              min="0"
              max="10"
              placeholder="Máximo"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          {groupState?.error ? (
            <p className="text-xs text-red-500">{groupState.error}</p>
          ) : null}
          <button
            type="submit"
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
          >
            Crear grupo
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Opción de modificador
        </h2>
        <form action={optionAction} className="mt-4 space-y-3">
          <select
            name="modifierGroupId"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            required
          >
            <option value="">Selecciona grupo</option>
            {modifierGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          <input
            name="name"
            placeholder="Nombre opción"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            required
          />
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            placeholder="Precio"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            required
          />
          {optionState?.error ? (
            <p className="text-xs text-red-500">{optionState.error}</p>
          ) : null}
          <button
            type="submit"
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
          >
            Crear opción
          </button>
        </form>
      </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Menú actual</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600"
            >
              <span>{category.name}</span>
              <button
                type="button"
                onClick={() => deleteMenuCategory(category.id)}
                className="text-xs text-red-500 hover:text-red-600"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200 p-4"
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="mb-3 h-32 w-full rounded-lg object-cover"
                />
              ) : null}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-900">
                    {item.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {item.description ?? "Sin descripción"}
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  ${Number(item.price).toFixed(2)}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => toggleMenuItemActive(item.id)}
                  className={`rounded-full px-3 py-1 font-semibold ${
                    item.isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {item.isActive ? "Activo" : "Inactivo"}
                </button>
                <button
                  type="button"
                  onClick={() => deleteMenuItem(item.id)}
                  className="rounded-full bg-red-50 px-3 py-1 font-semibold text-red-600"
                >
                  Eliminar
                </button>
              </div>
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-700">
                  Modificadores
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.modifierGroups.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() =>
                        detachModifierGroupFromItem({
                          menuItemId: item.id,
                          modifierGroupId: group.id,
                        })
                      }
                      className="rounded-full bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
                    >
                      {group.name} ✕
                    </button>
                  ))}
                  {!item.modifierGroups.length ? (
                    <span>Sin grupos asignados.</span>
                  ) : null}
                </div>
                <div className="mt-3">
                  <select
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs"
                    onChange={(event) => {
                      if (!event.target.value) return;
                      attachModifierGroupToItem({
                        menuItemId: item.id,
                        modifierGroupId: event.target.value,
                      });
                      event.currentTarget.value = "";
                    }}
                  >
                    <option value="">Agregar grupo</option>
                    {modifierGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <ImageUploader menuItemId={item.id} />
              </div>
            </div>
          ))}
          {!items.length ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
              No hay productos cargados.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
};
