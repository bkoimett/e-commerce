import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { ClearCart } from "@/components/storefront/ClearCart";

const HOLD_STATUSES = new Set(["pending", "paid"]);

/**
 * Order confirmation (WORKFLOW #26). The provider redirects here after a
 * card checkout, and the checkout page sends M-Pesa customers here once the
 * STK push has been accepted. Rendered server-side because it reads the
 * order from the database — the client never sees another customer's data.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  const supabase = createAdminClient();

  let status: string | null = null;
  let paymentMethod: string | null = null;
  let contactName: string | null = null;

  if (ref) {
    const { data } = await supabase
      .from("orders")
      .select("payment_status, payment_provider, contact_name")
      .eq("id", ref)
      .maybeSingle();
    status = data?.payment_status ?? null;
    paymentMethod = data?.payment_provider ?? null;
    contactName = data?.contact_name ?? null;
  }

  const orderPlaced = status === "pending" || status === "paid";

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-green-700" aria-hidden="true">
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">
        {status === "failed" ? "Payment didn't go through" : "Order received"}
      </h1>

      {ref ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Order reference: <span className="font-mono text-foreground">{ref.slice(0, 8)}</span>
        </p>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          You reached this page without an order reference.
        </p>
      )}

      <div className="mt-6 rounded-xl border bg-white p-5 text-left text-sm leading-relaxed text-muted-foreground">
        {status === "failed" ? (
          <p>
            Your payment was declined or cancelled. Nothing has been charged
            and your cart is still intact — go back and try again, or choose a
            different payment method.
          </p>
        ) : status === null ? (
          <p>
            We couldn&apos;t find this order. If you were in the middle of
            paying, check that you opened the correct link, or contact us with
            your order reference.
          </p>
        ) : (
          <>
            <p>
              Thanks{contactName ? `, ${contactName.split(" ")[0]}` : ""} — we&apos;ve
              got your order.
            </p>
            <p className="mt-3">
              {paymentMethod === "intasend" ? (
                <>
                  If paying by <strong>M-Pesa</strong>, complete the push prompt
                  on your phone. If you paid by <strong>card</strong>, the
                  payment is being confirmed.
                </>
              ) : (
                "We're confirming your payment now."
              )}
              We&apos;ll be in touch shortly to arrange delivery.
            </p>
          </>
        )}
      </div>

      <ClearCart shouldClear={orderPlaced} />

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/products"
          className="inline-flex rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none"
        >
          {status === "failed" ? "Back to products" : "Continue shopping"}
        </Link>
        {status === "failed" && (
          <Link
            href="/cart"
            className="inline-flex rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Retry checkout
          </Link>
        )}
      </div>
    </div>
  );
}