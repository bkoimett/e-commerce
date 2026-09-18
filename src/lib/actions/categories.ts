"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const STOREFRONT_PATHS = ["/", "/category/[slug]", "/product/[slug]"];

function revalidateStorefront() {
  STOREFRONT_PATHS.forEach((p) => revalidatePath(p));
  revalidatePath("/admin/categories");
}

export async function createCategory(
  name: string,
  slug: string,
  parentId?: string | null
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .insert({ name, slug, parent_id: parentId ?? null })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidateStorefront();
  return data;
}

export async function updateCategory(
  id: string,
  name: string,
  slug: string,
  parentId?: string | null
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .update({ name, slug, parent_id: parentId ?? null })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidateStorefront();
  return data;
}

export async function deleteCategory(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidateStorefront();
}