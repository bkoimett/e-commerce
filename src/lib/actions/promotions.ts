"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { promotionSchema, type PromotionInput } from "@/lib/validations/promotion";

const STOREFRONT_PATHS = ["/", "/category/[slug]", "/product/[slug]"];

function revalidateStorefront() {
  STOREFRONT_PATHS.forEach((p) => revalidatePath(p));
  revalidatePath("/admin/promotions");
}

export async function createPromotion(input: PromotionInput) {
  const parsed = promotionSchema.parse(input);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("promotions")
    .insert(parsed)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidateStorefront();
  return data;
}

export async function updatePromotion(
  id: string,
  input: Partial<PromotionInput>
) {
  const parsed = promotionSchema.partial().parse(input);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("promotions")
    .update(parsed)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidateStorefront();
  return data;
}

export async function deletePromotion(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("promotions").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidateStorefront();
}

export async function togglePromotionStatus(id: string, isActive: boolean) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("promotions")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateStorefront();
}