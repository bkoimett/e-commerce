"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface CategoryRowProps {
  category: {
    id: string;
    name: string;
    slug: string;
    parent_id: string | null;
  };
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    parent_id: string | null;
  }>;
}

export default function CategoryRow({ category, categories }: CategoryRowProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [parentId, setParentId] = useState(category.parent_id ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const parentOptions = categories.filter((c) => c.id !== category.id);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: err } = await supabase
      .from("categories")
      .update({
        name,
        slug,
        parent_id: parentId || null,
      })
      .eq("id", category.id);

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    window.location.reload();
  }

  async function handleDelete() {
    if (!confirm(`Delete "${category.name}"?`)) return;

    const supabase = createClient();
    const { error: err } = await supabase
      .from("categories")
      .delete()
      .eq("id", category.id);

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
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </td>
        <td className="py-2">
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="">— None —</option>
            {parentOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
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
      <td className="py-2">{category.name}</td>
      <td className="py-2">{category.slug}</td>
      <td className="py-2">
        {category.parent_id
          ? categories.find((c) => c.id === category.parent_id)?.name ?? "—"
          : "—"}
      </td>
      <td className="py-2 text-right space-x-2">
        <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <Button size="sm" variant="destructive" onClick={handleDelete}>
          Delete
        </Button>
      </td>
    </tr>
  );
}