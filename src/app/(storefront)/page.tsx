import Link from "next/link";
import { getActivePromotions, getPublishedProducts, priceCard } from "@/lib/storefront";
import { ProductCard } from "@/components/storefront/ProductCard";
import { PromotionBanner } from "@/components/storefront/PromotionBanner";

export const metadata = {
  title: "Benjie Electronics — Phones, accessories & more in Kenya",
  description:
    "Kenyan electronics store: phones and accessories with nationwide delivery, payable via M-Pesa or card.",
};

export default async function HomePage() {
  const [promotions, products] = await Promise.all([
    getActivePromotions(),
    getPublishedProducts({ limit: 8 }),
  ]);

  const banner = promotions.find((p) => p.banner_text)?.banner_text ?? null;
  const cards = products.map((p) => priceCard(p, promotions));

  return (
    <div>
      {banner && <PromotionBanner text={banner} />}

      <section className="mx-auto max-w-6xl px-4 pt-10 pb-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Phones &amp; accessories, delivered
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Genuine products with M-Pesa and card payment, delivered across Kenya.
            New stock lands here first.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-tight">New arrivals</h2>
          <Link
            href="/products"
            className="text-sm font-medium text-brand-blue hover:underline focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none rounded"
          >
            Shop all
          </Link>
        </div>

        {cards.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {cards.map((item) => (
              <ProductCard key={item.product.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-black/10 bg-white p-10 text-center">
            <p className="font-medium">The shelves are almost stocked</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The owner is still setting up the store. Check back soon.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}