export const PERMISSIONS = {
  ORDERS_VIEW: "orders:view",
  ORDERS_MANAGE: "orders:manage",
  MENU_MANAGE: "menu:manage",
  BILLING_VIEW: "billing:view",
  BILLING_MANAGE: "billing:manage",
  USERS_MANAGE: "users:manage",
  SETTINGS_MANAGE: "settings:manage",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLES = {
  ADMIN: "admin",
  KITCHEN: "kitchen",
  CASHIER: "cashier",
  STAFF: "staff",
} as const;

export type RoleKey = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_PERMISSIONS: Record<RoleKey, PermissionKey[]> = {
  admin: [
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_MANAGE,
    PERMISSIONS.MENU_MANAGE,
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.BILLING_MANAGE,
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.SETTINGS_MANAGE,
  ],
  kitchen: [PERMISSIONS.ORDERS_VIEW, PERMISSIONS.ORDERS_MANAGE],
  cashier: [
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_MANAGE,
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.BILLING_MANAGE,
  ],
  staff: [PERMISSIONS.ORDERS_VIEW],
};

export const hasPermission = (
  userPermissions: string[] | null | undefined,
  permission: PermissionKey,
) => {
  if (!userPermissions?.length) return false;
  return userPermissions.includes(permission);
};

export const hasRestaurantPermission = (
  restaurants: Array<{ restaurantId: string; permissions: string[] }> | null | undefined,
  restaurantId: string,
  permission: PermissionKey,
) => {
  if (!restaurants?.length) return false;
  const restaurant = restaurants.find((entry) => entry.restaurantId === restaurantId);
  if (!restaurant) return false;
  return restaurant.permissions.includes(permission);
};
