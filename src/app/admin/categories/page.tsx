import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CategoryList from "./CategoryList";
import CategoryForm from "./CategoryForm";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Categories</h2>
        <CategoryForm />
      </div>
      <CategoryList />
    </div>
  );
}