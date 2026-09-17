import { z } from "zod";

export const shippingAddressSchema = z.object({
  line1: z.string().min(1, "Address is required"),
  line2: z.string().optional(),
  town: z.string().min(1, "Town is required"),
  county: z.string().min(1, "County is required"),
});

export const checkoutSchema = z.object({
  contact_name: z.string().min(1, "Name is required"),
  contact_phone: z
    .string()
    .regex(/^(?:\+254|0)7\d{8}$/, "Enter a valid Kenyan phone number"),
  contact_email: z.string().email().optional().or(z.literal("")),
  shipping_address: shippingAddressSchema,
  items: z
    .array(
      z.object({
        variant_id: z.string().uuid(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "Cart is empty"),
  payment_method: z.enum(["mpesa", "card"]),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
