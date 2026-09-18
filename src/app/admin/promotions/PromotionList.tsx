"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import PromotionRow from "./PromotionRow";

export default async function PromotionList() {
  const supabase = createAdminClient();
  const { data: promotions, error } = await supabase
    .from("promotions")
    .select("*, categories(name), products(name)")
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="text-red-600">Error loading promotions: {error.message}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b text-left text-sm text-gray-500">
            <th className="pb-2">Name</th>
            <th className="pb-2">Type</th>
            <th className="pb-2">Value</th>
            <th className="pb-2">Applies To</th>
            <th className="pb-2">Period</th>
            <th className="pb-2">Status</th>
            <th className="pb-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {promotions?.map((p) => (
            <PromotionRow key={p.id} promotion={p} />
          ))}
        </tbody>
      </table>
      {(!promotions || promotions.length === 0) && (
        <p className="text-center text-gray-500 py-8">No promotions yet. Create one above.</p>
      )}
    </div>
  );
}