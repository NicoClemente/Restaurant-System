import { prisma } from "@/db";
import { assertRestaurantPermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/permissions";
import { getStaffContext } from "@/lib/staff";
import { MenuManager } from "@/ui/admin/MenuManager";

type CategoryRow = { id: string; name: string };
type MenuItemRow = {
  id: string;
  name: string;
  description: string | null;
  price: unknown;
  categoryId: string | null;
  isActive: boolean;
  images: Array<{ image: { secureUrl: string } }>;
  modifiers: Array<{ modifierGroup: { id: string; name: string } }>;
};
type ModifierOptionRow = { id: string; name: string; price: unknown };
type ModifierGroupRow = {
  id: string;
  name: string;
  minSelected: number;
  maxSelected: number;
  options: ModifierOptionRow[];
};

export default async function AdminMenuPage() {
  const { restaurantId, session } = await getStaffContext();

  assertRestaurantPermission(session, restaurantId, PERMISSIONS.MENU_MANAGE);

  const [categories, items, modifierGroups] = (await Promise.all([
    prisma.menuCategory.findMany({
      where: { restaurantId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    prisma.menuItem.findMany({
      where: { restaurantId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        categoryId: true,
        isActive: true,
        modifiers: {
          select: {
            modifierGroupId: true,
            modifierGroup: { select: { id: true, name: true } },
          },
        },
        images: {
          orderBy: { sortOrder: "asc" },
          include: { image: true },
        },
      },
    }),
    prisma.modifierGroup.findMany({
      where: { restaurantId, isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        minSelected: true,
        maxSelected: true,
        options: {
          orderBy: { name: "asc" },
          select: { id: true, name: true, price: true },
        },
      },
    }),
  ])) as [CategoryRow[], MenuItemRow[], ModifierGroupRow[]];

  const normalizedItems = items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: String(item.price),
    categoryId: item.categoryId,
    imageUrl: item.images[0]?.image.secureUrl ?? null,
    isActive: item.isActive,
    modifierGroups: item.modifiers.map((mod) => mod.modifierGroup),
  }));

  const normalizedGroups = modifierGroups.map((group) => ({
    id: group.id,
    name: group.name,
    minSelected: group.minSelected,
    maxSelected: group.maxSelected,
    options: group.options.map((option) => ({
      ...option,
      price: String(option.price),
    })),
  }));

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Menú</h2>
        <p className="text-sm text-slate-500">
          Crea categorías, productos y sube imágenes.
        </p>
      </div>
      <MenuManager
        restaurantId={restaurantId}
        categories={categories}
        items={normalizedItems}
        modifierGroups={normalizedGroups}
      />
    </section>
  );
}
