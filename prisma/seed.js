const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const permissions = [
  { key: "orders:view", description: "View orders" },
  { key: "orders:manage", description: "Manage orders" },
  { key: "menu:manage", description: "Manage menu" },
  { key: "billing:view", description: "View billing" },
  { key: "billing:manage", description: "Manage billing" },
  { key: "users:manage", description: "Manage users" },
  { key: "settings:manage", description: "Manage settings" },
];

const roles = [
  {
    key: "admin",
    name: "Admin",
    permissions: permissions.map((permission) => permission.key),
  },
  {
    key: "kitchen",
    name: "Kitchen",
    permissions: ["orders:view", "orders:manage"],
  },
  {
    key: "cashier",
    name: "Cashier",
    permissions: [
      "orders:view",
      "orders:manage",
      "billing:view",
      "billing:manage",
    ],
  },
  {
    key: "staff",
    name: "Staff",
    permissions: ["orders:view"],
  },
];

async function main() {
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: { description: permission.description },
      create: permission,
    });
  }

  for (const role of roles) {
    const createdRole = await prisma.role.upsert({
      where: { key: role.key },
      update: { name: role.name },
      create: { key: role.key, name: role.name },
    });

    const permissionRows = await prisma.permission.findMany({
      where: { key: { in: role.permissions } },
    });

    for (const permission of permissionRows) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: createdRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: createdRole.id,
          permissionId: permission.id,
        },
      });
    }
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const restaurantName = process.env.RESTAURANT_NAME ?? "Demo Restaurant";

  if (!adminEmail || !adminPassword) {
    return;
  }

  const slug = restaurantName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  const restaurant = await prisma.restaurant.upsert({
    where: { slug },
    update: { name: restaurantName },
    create: {
      name: restaurantName,
      slug,
      settings: { create: {} },
      orderSeries: { create: {} },
      invoiceSeries: { create: {} },
    },
  });

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: "Admin", passwordHash },
    create: { email: adminEmail, name: "Admin", passwordHash },
  });

  const adminRole = await prisma.role.findUnique({ where: { key: "admin" } });
  if (!adminRole) return;

  await prisma.restaurantUser.upsert({
    where: {
      restaurantId_userId: {
        restaurantId: restaurant.id,
        userId: admin.id,
      },
    },
    update: { roleId: adminRole.id, isOwner: true },
    create: {
      restaurantId: restaurant.id,
      userId: admin.id,
      roleId: adminRole.id,
      isOwner: true,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
