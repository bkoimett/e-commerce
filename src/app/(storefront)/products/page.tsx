import Link from "next/link";
import { getActivePromotions, getCategories, getPublishedProducts, priceCard } from "@/lib/storefront";
import { ProductCard } from "@/components/storefront/ProductCard";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "All products — Benjie Electronics",
  description: "Browse every phone and accessory in stock, with Kenyan Shilling prices and M-Pesa or card payment.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [categories, promotions, products] = await Promise.all([
    getCategories(),
    getActivePromotions(),
    getPublishedProducts({ categorySlug: category }),
  ]);

  const cards = products.map((p) => priceCard(p, promotions));
  const active = category ? categories.find((c) => c.slug === category) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {active ? active.name : "All products"}
        </h1>
        <p className="text-sm text-muted-foreground">{cards.length} item{cards.length === 1 ? "" : "s"}</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/products"
          className={cn(
            "rounded-full border px-3 py-1 text-sm hover:bg-white focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none",
            !category ? "border-brand-blue bg-brand-blue text-white" : "border-black/10 bg-white"
          )}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/products?category=${c.slug}`}
            className={cn(
              "rounded-full border px-3 py-1 text-sm hover:bg-white focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none",
              category === c.slug ? "border-brand-blue bg-brand-blue text-white" : "border-black/10 bg-white"
            )}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {cards.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {cards.map((item) => (
            <ProductCard key={item.product.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-black/10 bg-white p-10 text-center">
          <p className="font-medium">Nothing here yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {category ? "No products in this category yet — check another one." : "Products are still being added. Check back soon."}
          </p>
        </div>
      )}
    </div>
  );
}