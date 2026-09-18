import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProductList from "./ProductList";
import ProductForm from "./ProductForm";

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Products</h2>
        <ProductForm />
      </div>
      <ProductList />
    </div>
  );
}