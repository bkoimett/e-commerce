"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface PromotionFormProps {
  _mode?: "create";
}

export default function PromotionForm({ _mode }: PromotionFormProps) {
  const [name, setName] = useState("");
  void setName;
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [appliesTo, setAppliesTo] = useState<"all" | "category" | "product">("all");
  const [targetId, setTargetId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [bannerText, setBannerText] = useState("");
  const [error, setError] = useState("");
  void error;
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [products, setProducts] = useState<
    Array<{ id: string; name: string }>
  >([]);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("categories").select("id,name").order("name"),
      supabase.from("products").select("id,name").order("name"),
    ]).then(([{ data: cats }, { data: prods }]) => {
      if (cats) setCategories(cats);
      if (prods) setProducts(prods);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: err } = await supabase.from("promotions").insert({
      name,
      discount_type: discountType,
      discount_value: Number(discountValue),
      applies_to: appliesTo,
      target_id: targetId || null,
      starts_at: startsAt + ":00",
      ends_at: endsAt + ":00",
      is_active: isActive,
      banner_text: bannerText || null,
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    setName("");
    setDiscountType("percentage");
    setDiscountValue("");
    setAppliesTo("all");
    setTargetId("");
    setStartsAt("");
    setEndsAt("");
    setIsActive(true);
    setBannerText("");
    window.location.reload();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <h3 className="font-medium">Create Promotion</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Summer Sale"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Discount Type</label>
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Discount Value</label>
          <input
            type="number"
            step={discountType === "percentage" ? "1" : "0.01"}
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            placeholder={discountType === "percentage" ? "e.g. 20" : "e.g. 5000"}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Applies To</label>
          <select
            value={appliesTo}
            onChange={(e) => setAppliesTo(e.target.value as "all" | "category" | "product")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Storewide</option>
            <option value="category">Category</option>
            <option value="product">Product</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Target Category/Product (optional if storewide)
          </label>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select...</option>
            {appliesTo === "category" &&
              categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            {appliesTo === "product" &&
              products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Start Date/Time</label>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Date/Time</label>
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Banner Text (optional)</label>
          <input
            value={bannerText}
            onChange={(e) => setBannerText(e.target.value)}
            placeholder="e.g. 20% off all phones this weekend!"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={String(isActive)}
            onChange={(e) => setIsActive(e.target.value === "true")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Add Promotion"}
        </Button>
        {error && <span className="text-sm text-red-600 self-center">{error}</span>}
      </div>
    </form>
  );
}