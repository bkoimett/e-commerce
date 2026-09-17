import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  description: z.string().min(1, "Description is required"),
  category_id: z.string().uuid("Choose a category"),
  base_price: z.number().positive("Price must be greater than 0"),
  images: z.array(z.string().url()).min(1, "At least one image is required"),
  status: z.enum(["draft", "published"]),
});

export const variantAttributesSchema = z
  .record(z.string(), z.string())
  .refine((attrs) => Object.keys(attrs).length > 0, {
    message: "A variant needs at least one attribute (e.g. color or storage)",
  });

export const productVariantSchema = z.object({
  product_id: z.string().uuid(),
  attributes: variantAttributesSchema,
  price_override: z.number().positive().nullable(),
  stock_quantity: z.number().int().min(0),
  sku: z.string().min(1, "SKU is required"),
});

export type ProductInput = z.infer<typeof productSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
