import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export const getStaffContext = async () => {
  const session = await auth();
  const restaurant = session?.user?.restaurants?.[0];

  if (!restaurant) {
    redirect("/staff/login");
  }

  return {
    session,
    restaurantId: restaurant.restaurantId,
    permissions: restaurant.permissions,
  };
};
