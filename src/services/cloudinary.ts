import { env } from "@/lib/env";

export const isCloudinaryConfigured = () =>
  Boolean(
    env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET,
  );

export const getCloudinary = async () => {
  if (!isCloudinaryConfigured()) return null;

  const { v2 } = await import("cloudinary");
  v2.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
  return v2;
};
