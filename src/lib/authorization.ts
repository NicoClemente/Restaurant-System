import { type Session } from "next-auth";

import { forbidden, unauthorized } from "@/lib/errors";
import { hasRestaurantPermission, type PermissionKey } from "@/lib/permissions";

export const assertRestaurantPermission = (
  session: Session | null,
  restaurantId: string,
  permission: PermissionKey,
) => {
  if (!session?.user) {
    throw unauthorized();
  }

  const allowed = hasRestaurantPermission(
    session.user.restaurants,
    restaurantId,
    permission,
  );

  if (!allowed) {
    throw forbidden();
  }
};
