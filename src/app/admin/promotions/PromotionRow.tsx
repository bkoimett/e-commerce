"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface PromotionRowProps {
  promotion: {
    id: string;
    name: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    applies_to: "all" | "category" | "product";
    target_id: string | null;
    starts_at: string;
    ends_at: string;
    is_active: boolean;
    banner_text: string | null;
    categories?: { name: string };
    products?: { name: string };
  };
}

export default function PromotionRow({ promotion }: PromotionRowProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(promotion.name);
  const [discountType, setDiscountType] = useState(promotion.discount_type);
  const [discountValue, setDiscountValue] = useState(String(promotion.discount_value));
  const [appliesTo, setAppliesTo] = useState(promotion.applies_to);
  const [targetId, setTargetId] = useState(promotion.target_id ?? "");
  const [startsAt, setStartsAt] = useState(promotion.starts_at.slice(0, 16));
  const [endsAt, setEndsAt] = useState(promotion.ends_at.slice(0, 16));
  const [isActive, setIsActive] = useState(promotion.is_active);
  const [bannerText, setBannerText] = useState(promotion.banner_text ?? "");
  const [error, setError] = useState("");
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

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: err } = await supabase
      .from("promotions")
      .update({
        name,
        discount_type: discountType,
        discount_value: Number(discountValue),
        applies_to: appliesTo,
        target_id: targetId || null,
        starts_at: startsAt + ":00",
        ends_at: endsAt + ":00",
        is_active: isActive,
        banner_text: bannerText || null,
      })
      .eq("id", promotion.id);

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    window.location.reload();
  }

  async function handleDelete() {
    if (!confirm(`Delete "${promotion.name}"?`)) return;

    const supabase = createClient();
    const { error: err } = await supabase
      .from("promotions")
      .delete()
      .eq("id", promotion.id);

    if (err) {
      alert(err.message);
      return;
    }

    window.location.reload();
  }

  async function handleToggle(newActive: boolean) {
    const supabase = createClient();
    const { error: err } = await supabase
      .from("promotions")
      .update({ is_active: newActive })
      .eq("id", promotion.id);

    if (err) {
      alert(err.message);
      return;
    }
    window.location.reload();
  }

  if (editing) {
    return (
      <tr className="bg-gray-50">
        <td className="py-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </td>
        <td className="py-2">
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed</option>
          </select>
        </td>
        <td className="py-2">
          <input
            type="number"
            step={discountType === "percentage" ? "1" : "0.01"}
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </td>
        <td className="py-2">
          <select
            value={appliesTo}
            onChange={(e) => setAppliesTo(e.target.value as "all" | "category" | "product")}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="all">Storewide</option>
            <option value="category">Category</option>
            <option value="product">Product</option>
          </select>
        </td>
        <td className="py-2">
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
          />
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm mt-1"
          />
        </td>
        <td className="py-2">
          <select
            value={String(isActive)}
            onChange={(e) => setIsActive(e.target.value === "true")}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </td>
        <td className="py-2 text-right space-x-2">
          <Button size="sm" onClick={() => setEditing(false)}>Cancel</Button>
          <Button size="sm" onClick={() => {}}>Save</Button>
        </td>
      </tr>
    );
  }

  const targetName =
    promotion.applies_to === "category"
      ? promotion.categories?.name
      : promotion.applies_to === "product"
      ? promotion.products?.name
      : "Storewide";

  return (
    <tr>
      <td className="py-2">{promotion.name}</td>
      <td className="py-2 capitalize">{promotion.discount_type}</td>
      <td className="py-2">
        {promotion.discount_type === "percentage"
          ? `${promotion.discount_value}%`
          : promotion.discount_value.toLocaleString()}
      </td>
      <td className="py-2">
        {promotion.applies_to}
        {promotion.target_id && <span className="ml-1 text-gray-500">({targetName})</span>}
      </td>
      <td className="py-2 text-sm">
        {new Date(promotion.starts_at).toLocaleDateString()} –{" "}
        {new Date(promotion.ends_at).toLocaleDateString()}
      </td>
      <td className="py-2">
        <span
          className={`inline-flex px-2 py-1 text-xs rounded-full ${
            promotion.is_active
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {promotion.is_active ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="py-2 text-right space-x-2">
        <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <Button
          size="sm"
          variant={promotion.is_active ? "ghost" : "secondary"}
          onClick={() => handleDelete()}
        >
          {promotion.is_active ? "Deactivate" : "Activate"}
        </Button>
        <Button size="sm" variant="destructive" onClick={handleDelete}>
          Delete
        </Button>
      </td>
    </tr>
  );
}