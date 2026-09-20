import Link from "next/link";
import { CartProvider } from "@/lib/cart";
import { getCategories } from "@/lib/storefront";
import { CartButton } from "@/components/storefront/CartButton";

// Store name is a working placeholder until the client supplies branding
// (DESIGN.md §14 / issue #5). Replace in header, footer and root metadata.
const STORE_NAME = "Benjie Electronics";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getCategories();
  const topLevel = categories.filter((c) => !c.parent_id);

  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col bg-brand-paper text-[--brand-ink]">
        <header className="border-b border-black/10 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none rounded"
            >
              {STORE_NAME}
            </Link>
            <CartButton />
          </div>
          <nav className="mx-auto max-w-6xl px-4">
            <ul className="flex items-center gap-1 overflow-x-auto text-sm">
              <li>
                <Link
                  href="/products"
                  className="block rounded px-2 py-1.5 font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none"
                >
                  All products
                </Link>
              </li>
              {topLevel.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/category/${category.slug}`}
                    className="block whitespace-nowrap rounded px-2 py-1.5 hover:bg-muted focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-12 border-t border-black/10 bg-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
            <div className="space-y-3">
              <p className="font-semibold tracking-tight">{STORE_NAME}</p>
              <p className="text-sm text-muted-foreground">
                Electronics to power your everyday, delivered across Kenya.
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full border border-emerald-600/30 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                  Pay with M-Pesa
                </span>
                <span className="rounded-full border border-black/10 bg-muted px-2.5 py-1 font-medium text-muted-foreground">
                  Cards accepted
                </span>
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold">Shop</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/products" className="hover:text-[--brand-ink] hover:underline">
                    All products
                  </Link>
                </li>
                {topLevel.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/category/${category.slug}`}
                      className="hover:text-[--brand-ink] hover:underline"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold">Contact</p>
              {/* TODO(#5): replace the WhatsApp number and email with the owner's
                  real details before launch. */}
              <a
                href="https://wa.me/254700000000"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[--brand-ink] hover:underline"
              >
                <svg aria-hidden="true" className="size-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                WhatsApp us
              </a>
              <p className="mt-2 text-xs text-muted-foreground">
                Delivery &amp; support queries welcome on WhatsApp.
              </p>
            </div>
          </div>
          <div className="border-t border-black/10">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground">
              <p>© {new Date().getFullYear()} {STORE_NAME}.</p>
              <p>All prices in Kenyan Shillings (KES).</p>
            </div>
          </div>
        </footer>
      </div>
    </CartProvider>
  );
}