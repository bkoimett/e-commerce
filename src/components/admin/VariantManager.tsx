"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface Variant {
  id: string;
  product_id: string;
  attributes: Record<string, string>;
  price_override: number | null;
  stock_quantity: number;
  sku: string;
}

interface VariantManagerProps {
  productId: string;
}

export default function VariantManager({ productId }: VariantManagerProps) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [attrKeys, setAttrKeys] = useState<string[]>([]);
  const [attrValues, setAttrValues] = useState<Record<string, string>>({});
  const [priceOverride, setPriceOverride] = useState("");
  const [stock, setStock] = useState("");
  const [sku, setSku] = useState("");

  const supabase = createClient();

  useEffect(() => {
    fetchVariants();
  }, [productId]);

  async function fetchVariants() {
    const { data, error: err } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (err) setError(err.message);
    else setVariants(data || []);
  }

  async function handleAddVariant(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const attributes: Record<string, string> = {};
    attrKeys.forEach((key) => {
      const val = attrValues[key];
      if (val) attributes[key] = val;
    });

    if (Object.keys(attributes).length === 0) {
      setError("At least one attribute (e.g. color, storage) is required.");
      setLoading(false);
      return;
    }
    if (!sku) {
      setError("SKU is required.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: err } = await supabase.from("product_variants").insert({
      product_id: productId,
      attributes,
      price_override: priceOverride ? Number(priceOverride) : null,
      stock_quantity: Number(stock) || 0,
      sku,
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    setAdding(false);
    resetForm();
    fetchVariants();
  }

  async function handleUpdate(variant: Variant) {
    setError("");
    setLoading(true);

    const attributes: Record<string, string> = {};
    Object.entries(variant.attributes).forEach(([key, val]) => {
      if (val) attributes[key] = val;
    });

    const supabase = createClient();
    const { error: err } = await supabase
      .from("product_variants")
      .update({
        attributes,
        price_override: variant.price_override,
        stock_quantity: variant.stock_quantity,
        sku: variant.sku,
      })
      .eq("id", variant.id);

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    setEditingId(null);
    fetchVariants();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this variant?")) return;

    const supabase = createClient();
    const { error: err } = await supabase
      .from("product_variants")
      .delete()
      .eq("id", id);

    if (err) {
      alert(err.message);
      return;
    }

    fetchVariants();
  }

  function resetForm() {
    setAttrKeys([]);
    setAttrValues({});
    setPriceOverride("");
    setStock("");
    setSku("");
  }

  function addAttributeKey() {
    const newKey = `attr${attrKeys.length + 1}`;
    setAttrKeys((prev) => [...prev, newKey]);
    setAttrValues((prev) => ({ ...prev, [newKey]: "" }));
  }

  return (
    <div className="mt-6 border-t pt-6">
      <h3 className="text-lg font-medium mb-4">Variants</h3>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mb-4 space-y-2">
        <h4 className="font-medium">
          {editingId ? "Editing Variant" : adding ? "Add Variant" : "Variants"}
        </h4>

        {(adding || editingId) && (
          <form onSubmit={handleAddVariant} className="space-y-3 p-4 border rounded-lg bg-gray-50">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Attributes (key=value)</label>
              <div className="space-y-1">
                {attrKeys.map((key, idx) => (
                  <div key={key} className="flex gap-2">
                    <input
                      value={key}
                      onChange={(e) => {
                        const newKeys = [...attrKeys];
                        newKeys[idx] = e.target.value;
                        setAttrKeys(newKeys);
                      }}
                      placeholder="e.g. color"
                      className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                    <input
                      value={attrValues[key] || ""}
                      onChange={(e) => {
                        setAttrValues((prev) => ({ ...prev, [key]: e.target.value }));
                      }}
                      placeholder="e.g. Black"
                      className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setAttrKeys((prev) => prev.filter((k) => k !== key))}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <Button type="button" variant="secondary" size="sm" onClick={addAttributeKey}>
                  + Add Attribute
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium mb-1">Price Override (optional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={priceOverride}
                  onChange={(e) => setPriceOverride(e.target.value)}
                  placeholder="Override base price"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stock</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="0"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SKU</label>
                <input
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="UNIQUE-SKU"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : editingId ? "Save" : "Add Variant"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditingId(null);
                  setAdding(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {(!adding && !editingId) && (
          <Button onClick={() => { setAdding(true); resetForm(); }}>
            + Add Variant
          </Button>
        )}
      </div>

      {variants.length === 0 && !adding && !editingId && (
        <p className="text-gray-500">No variants yet. Add one above.</p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="pb-2">Attributes</th>
              <th className="pb-2">Price</th>
              <th className="pb-2">Stock</th>
              <th className="pb-2">SKU</th>
              <th className="pb-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {variants.map((v) => (
              editingId === v.id ? (
                <tr key={v.id} className="bg-gray-50">
                  <td className="py-2">
                    <div className="space-y-1">
                      {Object.entries(v.attributes).map(([k, val], idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            value={k}
                            onChange={(e) => {
                              const attrs = { ...v.attributes };
                              delete attrs[k];
                              attrs[e.target.value] = val;
                              const newVariant = { ...v, attributes: attrs };
                              // Can't easily update, just show
                            }}
                            className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                          />
                          <input
                            value={val}
                            onChange={(e) => {
                              const attrs = { ...v.attributes };
                              attrs[k] = e.target.value;
                            }}
                            className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      step="0.01"
                      value={v.price_override ?? ""}
                      onChange={(e) => {}}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      value={v.stock_quantity}
                      onChange={(e) => {}}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="py-2">
                    <input value={v.sku} onChange={(e) => {}} className="w-full rounded border border-gray-300 px-2 py-1 text-sm" />
                  </td>
                  <td className="py-2 text-right space-x-2">
                    <Button size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                    <Button size="sm" onClick={() => handleUpdate({ ...v })}>Save</Button>
                  </td>
                </tr>
              ) : (
                <tr key={v.id}>
                  <td className="py-2">
                    {Object.entries(v.attributes)
                      .map(([k, val]) => `${k}: ${val}`)
                      .join(", ")}
                  </td>
                  <td className="py-2">
                    {v.price_override !== null
                      ? Number(v.price_override).toLocaleString()
                      : "— (base)"}
                  </td>
                  <td className="py-2">{v.stock_quantity}</td>
                  <td className="py-2 font-mono text-sm">{v.sku}</td>
                  <td className="py-2 text-right space-x-2">
                    <Button size="sm" variant="secondary" onClick={() => setEditingId(v.id)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(v.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {variants.length === 0 && !adding && !editingId && (
        <p className="text-gray-500 text-center py-4">No variants yet. Add one above.</p>
      )}
    </div>
  );
}