"use client";

import { useMemo, useState } from "react";
import type { Product, ProductVariant, Promotion } from "@/types/database";
import { getEffectivePrice } from "@/lib/pricing/getEffectivePrice";
import { useCart } from "@/lib/cart";
import { PriceTag } from "@/components/storefront/PriceTag";
import { cn } from "@/lib/utils";

interface VariantSelectorProps {
  product: Product;
  variants: ProductVariant[];
  promotions: Promotion[];
}

interface Dimension {
  key: string;
  label: string;
  values: string[];
}

function buildDimensions(variants: ProductVariant[]): Dimension[] {
  if (variants.length === 0) return [];
  const keys = Array.from(
    new Set(variants.flatMap((v) => Object.keys(v.attributes)))
  );
  // Colour first when present, then the remaining attributes as encountered.
  const COLOUR_KEYS = new Set(["color", "colour"]);
  keys.sort((a, b) => Number(COLOUR_KEYS.has(b)) - Number(COLOUR_KEYS.has(a)));
  return keys.map<Dimension>((key) => ({
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
    values: Array.from(
      new Set(variants.map((v) => v.attributes[key]).filter(Boolean))
    ),
  }));
}

export function VariantSelector({ product, variants, promotions }: VariantSelectorProps) {
  const { addItem } = useCart();
  const dimensions = useMemo(() => buildDimensions(variants), [variants]);

  const [selection, setSelection] = useState<Record<string, string>>(() =>
    variants.length === 1 ? { ...variants[0].attributes } : {}
  );
  const [justAdded, setJustAdded] = useState(false);

  const selectedVariant = useMemo(() => {
    if (variants.length === 0) return null;
    return (
      variants.find((v) =>
        Object.entries(selection).every(([k, val]) => v.attributes[k] === val)
      ) ?? null
    );
  }, [variants, selection]);

  const complete = variants.length === 0 || selectedVariant !== null;
  const effective = getEffectivePrice(product, selectedVariant, promotions);
  const stock = selectedVariant?.stock_quantity ?? null;
  const outOfStock = stock !== null && stock <= 0;

  function choose(dimensionKey: string, value: string) {
    setJustAdded(false);
    setSelection((prev) => ({ ...prev, [dimensionKey]: value }));
  }

  function handleAdd() {
    if (!complete || outOfStock) return;
    addItem({
      key: selectedVariant ? selectedVariant.id : product.id,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      image: product.images[0] ?? "",
      variantId: selectedVariant?.id ?? null,
      variantLabel: selectedVariant
        ? Object.values(selectedVariant.attributes).join(" • ")
        : null,
      unitPrice: effective.finalPrice,
      quantity: 1,
    });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1500);
  }

  return (
    <div className="space-y-4">
      {dimensions.map((dim) => (
        <div key={dim.key}>
          <p className="mb-2 text-sm font-medium">{dim.label}</p>
          <div className="flex flex-wrap gap-2">
            {dim.values.map((value) => {
              const active = selection[dim.key] === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => choose(dim.key, value)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none",
                    active
                      ? "border-brand-navy bg-brand-navy text-white"
                      : "border-black/10 bg-white hover:border-brand-blue"
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="border-t pt-4">
        <PriceTag size="lg" originalPrice={effective.originalPrice} finalPrice={effective.finalPrice} appliedPromotion={effective.appliedPromotion} />
        {effective.appliedPromotion && (
          <p className="mt-1 text-xs text-muted-foreground">
            {effective.appliedPromotion.name} applies
          </p>
        )}

        <p className={cn("mt-1 text-sm font-medium", outOfStock ? "text-destructive" : "text-emerald-700")}>
          {complete && stock !== null
            ? outOfStock
              ? "Out of stock"
              : `In stock${stock <= 5 ? ` — only ${stock} left` : ""}`
            : null}
        </p>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!complete || outOfStock || justAdded}
          className="mt-3 w-full rounded-lg bg-brand-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-navy focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {justAdded
            ? "Added to cart"
            : !complete
              ? "Select all options to add"
              : outOfStock
                ? "Unavailable"
                : "Add to cart"}
        </button>
      </div>
    </div>
  );
}