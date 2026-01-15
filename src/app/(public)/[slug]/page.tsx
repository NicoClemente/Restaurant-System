import { notFound } from "next/navigation";

import { prisma } from "@/db";
import { GuestOrderForm } from "@/ui/public/GuestOrderForm";

type PageProps = {
  params: { slug: string };
};

export default async function PublicRestaurantPage({ params }: PageProps) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: params.slug },
    include: {
      settings: true,
      categories: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      menuItems: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        include: {
          images: { include: { image: true }, orderBy: { sortOrder: "asc" } },
          modifiers: {
            include: {
              modifierGroup: {
                include: {
                  options: { where: { isActive: true }, orderBy: { name: "asc" } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!restaurant) {
    notFound();
  }

  type MenuItemRow = {
    id: string;
    name: string;
    description: string | null;
    price: unknown;
    categoryId: string | null;
    images: Array<{ image: { secureUrl: string } }>;
    modifiers: Array<{
      modifierGroup: {
        id: string;
        name: string;
        minSelected: number;
        maxSelected: number;
        options: Array<{ id: string; name: string; price: unknown }>;
      };
    }>;
  };

  type CategoryRow = { id: string; name: string };

  const menuItems = (restaurant.menuItems as MenuItemRow[]).map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description ?? "",
    price: String(item.price),
    categoryId: item.categoryId,
    imageUrl: item.images[0]?.image.secureUrl ?? null,
    modifierGroups: item.modifiers.map((mod) => ({
      id: mod.modifierGroup.id,
      name: mod.modifierGroup.name,
      minSelected: mod.modifierGroup.minSelected,
      maxSelected: mod.modifierGroup.maxSelected,
      options: mod.modifierGroup.options.map((option) => ({
        id: option.id,
        name: option.name,
        price: String(option.price),
      })),
    })),
  }));

  const categories = (restaurant.categories as CategoryRow[]).map((category) => ({
    id: category.id,
    name: category.name,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900">
            {restaurant.name}
          </h1>
          <p className="text-sm text-slate-500">
            Ordená en línea • {restaurant.settings?.currency ?? "ARS"}
          </p>
        </header>
        <GuestOrderForm
          restaurantId={restaurant.id}
          currency={restaurant.settings?.currency ?? "ARS"}
          categories={categories}
          items={menuItems}
        />
      </div>
    </div>
  );
}
