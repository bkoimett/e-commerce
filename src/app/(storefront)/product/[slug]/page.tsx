import Link from "next/link";
import { notFound } from "next/navigation";
import { getActivePromotions, getCategories, getProductBySlug } from "@/lib/storefront";
import { ImageGallery } from "@/components/storefront/ImageGallery";
import { VariantSelector } from "@/components/storefront/VariantSelector";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getProductBySlug(slug);
  if (!item) return { title: "Product not found" };
  return {
    title: `${item.product.name} — Benjie Electronics`,
    description: item.product.description.slice(0, 160),
    openGraph: item.product.images[0] ? { images: [item.product.images[0]] } : undefined,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [item, categories, promotions] = await Promise.all([
    getProductBySlug(slug),
    getCategories(),
    getActivePromotions(),
  ]);

  if (!item) notFound();

  const { product, variants, category } = item;
  const categoryWithParent = category?.parent_id
    ? categories.find((c) => c.id === category.parent_id)
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-[--brand-ink] hover:underline">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        {categoryWithParent && (
          <>
            <Link
              href={`/category/${categoryWithParent.slug}`}
              className="hover:text-[--brand-ink] hover:underline"
            >
              {categoryWithParent.name}
            </Link>
            <span aria-hidden="true">/</span>
          </>
        )}
        {category && (
          <>
            <Link
              href={`/category/${category.slug}`}
              className="hover:text-[--brand-ink] hover:underline"
            >
              {category.name}
            </Link>
            <span aria-hidden="true">/</span>
          </>
        )}
        <span className="text-[--brand-ink]">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <ImageGallery images={product.images} alt={product.name} />

        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {product.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {category ? category.name : "Uncategorised"}
            </p>
          </div>

          <VariantSelector product={product} variants={variants} promotions={promotions} />

          {product.description && (
            <div className="border-t pt-4">
              <h2 className="mb-2 text-sm font-semibold">Details</h2>
              <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                {product.description}
              </p>
            </div>
          )}

          <div className="space-y-1.5 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <span aria-hidden="true" className="text-emerald-600">✓</span>
              Ships across Kenya — pay with M-Pesa or card at checkout
            </p>
            <p className="flex items-center gap-2">
              <span aria-hidden="true" className="text-emerald-600">✓</span>
              Prices include any active discount, shown in Kenyan Shillings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}