"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { productSchema, type ProductInput } from "@/lib/validations/product";

const STOREFRONT_PATHS = ["/", "/category/[slug]", "/product/[slug]"];

function revalidateStorefront() {
  STOREFRONT_PATHS.forEach((p) => revalidatePath(p));
  revalidatePath("/admin/products");
}

export async function createProduct(input: ProductInput) {
  const parsed = productSchema.parse(input);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .insert(parsed)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidateStorefront();
  return data;
}

export async function updateProduct(id: string, input: Partial<ProductInput>) {
  const parsed = productSchema.partial().parse(input);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .update(parsed)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidateStorefront();
  return data;
}

export async function deleteProduct(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidateStorefront();
}

export async function toggleProductStatus(id: string, status: "draft" | "published") {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("products")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateStorefront();
}