import Link from "next/link";
import type { PricedProductCard } from "@/lib/storefront";
import { PriceTag } from "./PriceTag";

export function ProductCard({ item }: { item: PricedProductCard }) {
  const { product, fromPrice, categoryName } = item;
  const image = product.images[0];

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {image ? (
          /* eslint-disable-next-line @next/next/no-img-element -- product images live in Supabase Storage; optimized loader lands with the perf pass (#33) */
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            Image coming soon
          </div>
        )}
        {item.appliedPromotion && item.finalPrice < item.originalPrice && (
          <span className="absolute top-2 left-2 rounded-full bg-brand-amber px-2 py-0.5 text-xs font-medium">
            {item.appliedPromotion.discount_type === "percentage"
              ? `${item.appliedPromotion.discount_value}% off`
              : `Save ${item.appliedPromotion.discount_value}`}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-xs text-muted-foreground">
          {categoryName ?? "Uncategorised"}
        </p>
        <h3 className="line-clamp-2 text-sm leading-snug font-medium">
          {product.name}
        </h3>
        <div className="mt-auto pt-1">
          {fromPrice !== null && fromPrice < item.finalPrice ? (
            <div>
              <p className="text-xs text-muted-foreground">From</p>
              <PriceTag size="sm" originalPrice={item.originalPrice} finalPrice={fromPrice} appliedPromotion={item.appliedPromotion} />
            </div>
          ) : (
            <PriceTag size="sm" originalPrice={item.originalPrice} finalPrice={item.finalPrice} appliedPromotion={item.appliedPromotion} />
          )}
        </div>
      </div>
    </Link>
  );
}