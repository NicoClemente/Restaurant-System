import { z } from "zod";

const orderTypeSchema = z.enum(["DINE_IN", "TAKEAWAY", "DELIVERY"]);
const orderChannelSchema = z.enum(["IN_PERSON", "ONLINE"]);

export const createGuestOrderSchema = z
  .object({
    restaurantId: z.string().min(1),
    type: orderTypeSchema,
    channel: orderChannelSchema.default("ONLINE"),
    tableId: z.string().min(1).optional(),
    customer: z
      .object({
        name: z.string().min(2).max(120),
        phone: z.string().max(40).optional(),
        email: z.string().email().optional(),
      })
      .optional(),
    deliveryAddress: z
      .object({
        line1: z.string().min(2).max(160),
        line2: z.string().max(160).optional(),
        city: z.string().min(2).max(80),
        state: z.string().max(80).optional(),
        postal: z.string().max(20).optional(),
        country: z.string().min(2).max(2).default("AR"),
      })
      .optional(),
    notes: z.string().max(500).optional(),
    items: z
      .array(
        z.object({
          menuItemId: z.string().min(1),
          quantity: z.number().int().min(1).max(50),
          notes: z.string().max(300).optional(),
          modifiers: z
            .array(
              z.object({
                modifierOptionId: z.string().min(1),
                quantity: z.number().int().min(1).max(10).default(1),
              }),
            )
            .optional(),
        }),
      )
      .min(1),
  })
  .superRefine((data, ctx) => {
    if (data.type === "DINE_IN" && !data.tableId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "tableId is required for dine-in orders",
        path: ["tableId"],
      });
    }

    if (data.type === "DELIVERY" && !data.deliveryAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "deliveryAddress is required for delivery orders",
        path: ["deliveryAddress"],
      });
    }
  });

export type CreateGuestOrderInput = z.infer<typeof createGuestOrderSchema>;
