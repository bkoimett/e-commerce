"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface ProductRowProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    category_id: string;
    base_price: number;
    images: string[];
    status: "draft" | "published";
    categories?: { name: string };
  };
}

export default function ProductRow({ product }: ProductRowProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(product.name);
  const [slug, setSlug] = useState(product.slug);
  const [description, setDescription] = useState(product.description);
  const [categoryId, setCategoryId] = useState(product.category_id);
  const [basePrice, setBasePrice] = useState(String(product.base_price));
  const [images, setImages] = useState(product.images.join(", "));
  const [status, setStatus] = useState(product.status);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("categories")
      .select("id,name")
      .order("name")
      .then(({ data, error }) => {
        if (!error && data) setCategories(data);
      });
  }, []);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: err } = await supabase
      .from("products")
      .update({
        name,
        slug,
        description,
        category_id: categoryId,
        base_price: Number(basePrice),
        images: images.split(",").map((s) => s.trim()).filter(Boolean),
        status,
      })
      .eq("id", product.id);

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    window.location.reload();
  }

  async function handleDelete() {
    if (!confirm(`Delete "${product.name}"?`)) return;

    const supabase = createClient();
    const { error: err } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (err) {
      alert(err.message);
      return;
    }

    window.location.reload();
  }

  async function handleToggleStatus(newStatus: "draft" | "published") {
    const supabase = createClient();
    const { error: err } = await supabase
      .from("products")
      .update({ status: newStatus })
      .eq("id", product.id);

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
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </td>
        <td className="py-2">
          <input
            type="number"
            step="0.01"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </td>
        <td className="py-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "draft" | "published")}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </td>
        <td className="py-2 text-right space-x-2">
          <Button size="sm" onClick={handleUpdate} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditing(false)}
            disabled={loading}
          >
            Cancel
          </Button>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="py-2 max-w-xs truncate" title={product.name}>
        {product.name}
      </td>
      <td className="py-2">{product.categories?.name ?? "—"}</td>
      <td className="py-2">{Number(product.base_price).toLocaleString()}</td>
      <td className="py-2">
        <span
          className={`inline-flex px-2 py-1 text-xs rounded-full ${
            product.status === "published"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {product.status}
        </span>
      </td>
      <td className="py-2 text-right space-x-2">
        <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <Button
          size="sm"
          variant={product.status === "published" ? "ghost" : "secondary"}
          onClick={() =>
            handleToggleStatus(product.status === "published" ? "draft" : "published")
          }
        >
          {product.status === "published" ? "Unpublish" : "Publish"}
        </Button>
        <Button size="sm" variant="destructive" onClick={handleDelete}>
          Delete
        </Button>
      </td>
    </tr>
  );
}