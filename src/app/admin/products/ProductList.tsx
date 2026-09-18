"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import ProductRow from "./ProductRow";

export default async function ProductList() {
  const supabase = createAdminClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("*, categories(name)")
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="text-red-600">Error loading products: {error.message}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b text-left text-sm text-gray-500">
            <th className="pb-2">Name</th>
            <th className="pb-2">Category</th>
            <th className="pb-2">Price</th>
            <th className="pb-2">Status</th>
            <th className="pb-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {products?.map((p) => (
            <ProductRow key={p.id} product={p} />
          ))}
        </tbody>
      </table>
      {(!products || products.length === 0) && (
        <p className="text-center text-gray-500 py-8">No products yet. Create one above.</p>
      )}
    </div>
  );
}