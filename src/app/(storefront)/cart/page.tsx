"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatKES } from "@/lib/format";

export default function CartPage() {
  const { items, subtotal, setQuantity, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Your cart is empty</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Nothing in here yet — browse the phones and accessories and add
          something you like.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Your cart</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <ul className="divide-y divide-black/10 rounded-xl border bg-white">
          {items.map((item) => (
            <li key={item.key} className="flex gap-4 p-4">
              <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={item.image} alt={item.productName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    Image soon
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-1">
                <Link
                  href={`/product/${item.productSlug}`}
                  className="font-medium hover:underline focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none rounded"
                >
                  {item.productName}
                </Link>
                {item.variantLabel && (
                  <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
                )}
                <p className="text-sm">{formatKES(item.unitPrice)} each</p>

                <div className="mt-2 flex items-center gap-3">
                  <div className="inline-flex items-center rounded-lg border border-black/10">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity(item.key, item.quantity - 1)}
                      className="px-2.5 py-1 text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none"
                    >
                      −
                    </button>
                    <span aria-label="Quantity" className="min-w-8 text-center text-sm tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => setQuantity(item.key, item.quantity + 1)}
                      className="px-2.5 py-1 text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    className="text-sm text-muted-foreground hover:text-destructive focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none rounded"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <p className="shrink-0 text-sm font-medium tabular-nums">
                {formatKES(item.unitPrice * item.quantity)}
              </p>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-xl border bg-white p-4 lg:sticky lg:top-4">
          <h2 className="mb-3 text-sm font-semibold">Order summary</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium tabular-nums">{formatKES(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <dt>Delivery</dt>
              <dd>Calculated at checkout</dd>
            </div>
          </dl>
          <button
            type="button"
            disabled
            title="Checkout is the next milestone and isn't open yet"
            className="mt-4 w-full rounded-lg bg-brand-blue px-4 py-2.5 text-sm font-medium text-white opacity-50"
          >
            Checkout — coming soon
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Pay with M-Pesa or card. Prices include any active discounts.
          </p>
        </aside>
      </div>
    </div>
  );
}