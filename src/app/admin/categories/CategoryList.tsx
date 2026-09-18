"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import CategoryRow from "./CategoryRow";

export default async function CategoryList() {
  const supabase = createAdminClient();
  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) {
    return <div className="text-red-600">Error loading categories: {error.message}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b text-left text-sm text-gray-500">
            <th className="pb-2">Name</th>
            <th className="pb-2">Slug</th>
            <th className="pb-2">Parent</th>
            <th className="pb-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {categories?.map((cat) => (
            <CategoryRow key={cat.id} category={cat} categories={categories} />
          ))}
        </tbody>
      </table>
      {(!categories || categories.length === 0) && (
        <p className="text-center text-gray-500 py-8">No categories yet. Create one above.</p>
      )}
    </div>
  );
}