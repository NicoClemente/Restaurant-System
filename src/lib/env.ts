import { z } from "zod";

const optionalString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().min(1).optional(),
);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  CLOUDINARY_CLOUD_NAME: optionalString,
  CLOUDINARY_API_KEY: optionalString,
  CLOUDINARY_API_SECRET: optionalString,
  RESEND_API_KEY: optionalString,
  AFIP_ENABLED: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
  AFIP_ENV: z.enum(["test", "prod"]).optional(),
  AFIP_CUIT: z.string().optional(),
  AFIP_POINT_OF_SALE: z.string().optional(),
  AFIP_CERT_BASE64: z.string().optional(),
  AFIP_KEY_BASE64: z.string().optional(),
});

export const env = envSchema.parse(process.env);