"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { productVariantSchema, type ProductVariantInput } from "@/lib/validations/product";

export async function createVariant(input: ProductVariantInput) {
  const parsed = productVariantSchema.parse(input);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_variants")
    .insert(parsed)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  return data;
}

export async function updateVariant(
  id: string,
  input: Partial<ProductVariantInput>
) {
  const parsed = productVariantSchema.partial().parse(input);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_variants")
    .update(parsed)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  return data;
}

export async function deleteVariant(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("product_variants").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
}