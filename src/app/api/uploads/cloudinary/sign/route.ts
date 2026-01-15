import { auth } from "@/lib/auth";
import { assertRestaurantPermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/permissions";
import { getCloudinary } from "@/services/cloudinary";

export const runtime = "nodejs";

export const GET = async () => {
  const session = await auth();
  const restaurant = session?.user?.restaurants?.[0];

  if (!restaurant) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  assertRestaurantPermission(
    session,
    restaurant.restaurantId,
    PERMISSIONS.MENU_MANAGE,
  );

  const cloudinary = await getCloudinary();
  if (!cloudinary) {
    return Response.json(
      { error: "Cloudinary not configured" },
      { status: 503 },
    );
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = `restaurants/${restaurant.restaurantId}/menu`;
  const allowedFormats = ["jpg", "jpeg", "png", "webp"];
  const maxFileSize = 3 * 1024 * 1024;

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder,
      allowed_formats: allowedFormats.join(","),
      max_file_size: maxFileSize,
    },
    cloudinary.config().api_secret ?? "",
  );

  return Response.json({
    timestamp,
    signature,
    folder,
    allowedFormats,
    maxFileSize,
    apiKey: cloudinary.config().api_key,
    cloudName: cloudinary.config().cloud_name,
  });
};
