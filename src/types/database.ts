// Hand-written types mirroring the schema in design.md §2.
// TODO: once the Supabase project exists, replace/augment this with
// generated types via `supabase gen types typescript`.

export type ProductStatus = "draft" | "published";
export type DiscountType = "percentage" | "fixed";
export type PromotionTarget = "all" | "category" | "product";
export type PaymentStatus = "pending" | "paid" | "failed";

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  base_price: number;
  images: string[];
  status: ProductStatus;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  attributes: Record<string, string>; // e.g. { color: "black", storage: "128GB" }
  price_override: number | null;
  stock_quantity: number;
  sku: string;
}

export interface Promotion {
  id: string;
  name: string;
  discount_type: DiscountType;
  discount_value: number;
  applies_to: PromotionTarget;
  target_id: string | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  banner_text: string | null;
}

export interface ShippingAddress {
  line1: string;
  line2?: string;
  town: string;
  county: string;
}

export interface Order {
  id: string;
  customer_id: string | null; // reserved for v2 accounts, unused in v1
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  shipping_address: ShippingAddress;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_provider: string;
  payment_reference: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number; // price actually paid, snapshotted at purchase time
}
