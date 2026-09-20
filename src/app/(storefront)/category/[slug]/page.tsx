import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getActivePromotions,
  getCategories,
  getCategoryBySlug,
  getPublishedProducts,
  priceCard,
} from "@/lib/storefront";
import { ProductCard } from "@/components/storefront/ProductCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  return {
    title: category ? `${category.name} — Benjie Electronics` : "Category",
    description: category
      ? `Shop ${category.name} at Benjie Electronics. Prices in Kenyan Shillings, M-Pesa and card accepted.`
      : undefined,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [category, categories, promotions, products] = await Promise.all([
    getCategoryBySlug(slug),
    getCategories(),
    getActivePromotions(),
    getPublishedProducts({ categorySlug: slug }),
  ]);

  if (!category) notFound();

  const subCategories = categories.filter((c) => c.parent_id === category.id);
  const parent = category.parent_id
    ? categories.find((c) => c.id === category.parent_id) ?? null
    : null;
  const cards = products.map((p) => priceCard(p, promotions));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-[--brand-ink] hover:underline">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        {parent && (
          <>
            <Link
              href={`/category/${parent.slug}`}
              className="hover:text-[--brand-ink] hover:underline"
            >
              {parent.name}
            </Link>
            <span aria-hidden="true">/</span>
          </>
        )}
        <span className="text-[--brand-ink]">{category.name}</span>
      </nav>

      <h1 className="text-2xl font-semibold tracking-tight">{category.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {cards.length} item{cards.length === 1 ? "" : "s"}
      </p>

      {subCategories.length > 0 && (
        <div className="mb-6 mt-4 flex flex-wrap gap-2">
          {subCategories.map((sub) => (
            <Link
              key={sub.id}
              href={`/category/${sub.slug}`}
              className="rounded-full border border-black/10 bg-white px-3 py-1 text-sm hover:bg-brand-blue hover:text-white focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none"
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      {cards.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {cards.map((item) => (
            <ProductCard key={item.product.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-black/10 bg-white p-10 text-center">
          <p className="font-medium">Nothing in this category yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {subCategories.length > 0
              ? "Try one of the subcategories above."
              : "We're still stocking this category. Browse the full shop in the meantime."}
          </p>
        </div>
      )}
    </div>
  );
}