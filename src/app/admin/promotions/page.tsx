import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PromotionList from "./PromotionList";
import PromotionForm from "./PromotionForm";

export default async function PromotionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Promotions</h2>
        <PromotionForm />
      </div>
      <PromotionList />
    </div>
  );
}