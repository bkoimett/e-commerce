import { z } from "zod";

export const promotionSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(200),
    discount_type: z.enum(["percentage", "fixed"]),
    discount_value: z.number().positive("Discount must be greater than 0"),
    applies_to: z.enum(["all", "category", "product"]),
    target_id: z.string().uuid().nullable(),
    starts_at: z.string().datetime(),
    ends_at: z.string().datetime(),
    is_active: z.boolean(),
    banner_text: z.string().max(280).nullable(),
  })
  .refine((data) => new Date(data.ends_at) > new Date(data.starts_at), {
    message: "End date must be after start date",
    path: ["ends_at"],
  })
  .refine(
    (data) => data.applies_to === "all" || data.target_id !== null,
    {
      message: "A category or product must be selected unless the promotion applies storewide",
      path: ["target_id"],
    }
  )
  .refine(
    (data) => data.discount_type !== "percentage" || data.discount_value <= 100,
    {
      message: "Percentage discount can't exceed 100",
      path: ["discount_value"],
    }
  );

export type PromotionInput = z.infer<typeof promotionSchema>;
