// Server-only data access for the storefront. Uses the anon client
// (createClient from server.ts), so RLS already restricts reads to
// published products — a draft simply never reaches this layer
// (see DESIGN.md §4).

import { createClient } from "@/lib/supabase/server";
import type { Category, Product, ProductVariant, Promotion } from "@/types/database";
import { getEffectivePrice } from "@/lib/pricing/getEffectivePrice";

export interface StorefrontProduct {
  product: Product;
  variants: ProductVariant[];
  category: Category | null;
}

export interface PricedProductCard {
  product: Product;
  variants: ProductVariant[];
  categoryName: string | null;
  originalPrice: number;
  finalPrice: number;
  fromPrice: number | null; // lowest effective price across variants, when variants exist
  appliedPromotion: Promotion | null;
}

export function isActivePromotion(promo: Promotion): boolean {
  if (!promo.is_active) return false;
  const now = new Date();
  return now >= new Date(promo.starts_at) && now <= new Date(promo.ends_at);
}

export async function getActivePromotions(): Promise<Promotion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("promotions").select("*");
  if (error) throw new Error(`Failed to load promotions: ${error.message}`);
  return (data as Promotion[]).filter(isActivePromotion);
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(`Failed to load categories: ${error.message}`);
  return (data as Category[]) ?? [];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Failed to load category: ${error.message}`);
  return (data as Category) ?? null;
}

interface ProductRow extends Omit<Product, "base_price"> {
  base_price: number;
  product_variants: ProductVariant[];
  categories: Category | null;
}

function mapProductRow(row: ProductRow): StorefrontProduct {
  return {
    product: {
      id: row.id,
      category_id: row.category_id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      base_price: Number(row.base_price),
      images: row.images ?? [],
      status: row.status,
      created_at: row.created_at,
    },
    variants:
      row.product_variants?.map((v) => ({
        ...v,
        price_override: v.price_override === null ? null : Number(v.price_override),
        stock_quantity: Number(v.stock_quantity),
      })) ?? [],
    category: row.categories ?? null,
  };
}

export async function getPublishedProducts(opts?: {
  limit?: number;
  categorySlug?: string;
}): Promise<StorefrontProduct[]> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("*, product_variants(*), categories(*)")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (opts?.categorySlug) {
    query = query.eq("categories.slug", opts.categorySlug);
  }
  if (opts?.limit) {
    query = query.limit(opts.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load products: ${error.message}`);
  return (data as ProductRow[]).map(mapProductRow);
}

export async function getProductBySlug(slug: string): Promise<StorefrontProduct | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants(*), categories(*)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw new Error(`Failed to load product: ${error.message}`);
  if (!data) return null;
  return mapProductRow(data as ProductRow);
}

// Price used on listing cards: the base price with any active promotion
// applied, plus the lowest variant price when variants exist.
export function priceCard(
  item: StorefrontProduct,
  promotions: Promotion[]
): PricedProductCard {
  const base = getEffectivePrice(item.product, null, promotions);
  let fromPrice: number | null = null;
  if (item.variants.length > 0) {
    fromPrice = Math.min(
      ...item.variants.map((v) =>
        getEffectivePrice(item.product, v, promotions).finalPrice
      )
    );
  }
  return {
    product: item.product,
    variants: item.variants,
    categoryName: item.category?.name ?? null,
    originalPrice: base.originalPrice,
    finalPrice: base.finalPrice,
    fromPrice,
    appliedPromotion: base.appliedPromotion,
  };
}