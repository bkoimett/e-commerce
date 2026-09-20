import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatKES } from "@/lib/format";
import { simulateMockPayment } from "./actions";

/**
 * Simulated payment page (WORKFLOW #62). Shown only in mock mode, after the
 * checkout route returns this URL from MockPaymentProvider.initiate. Acting
 * on the buttons below runs the real webhook handler with a COMPLETE or
 * FAILED event, so the rest of the app behaves exactly as it will with
 * IntaSend.
 */
export default async function MockPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; method?: string }>;
}) {
  if ((process.env.PAYMENT_PROVIDER ?? "intasend") !== "mock") {
    redirect("/");
  }

  const { ref, method } = await searchParams;
  const supabase = createAdminClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, contact_name, total_amount, payment_status, contact_phone, order_items(product_variants(products(name)))"
    )
    .eq("id", ref ?? "")
    .maybeSingle();

  if (error || !order) notFound();

  if (order.payment_status === "paid") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-xl font-semibold">This order is already paid</h1>
        <Link
          href={`/checkout/success?ref=${encodeURIComponent(order.id)}`}
          className="mt-4 inline-flex rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy"
        >
          Go to confirmation
        </Link>
      </div>
    );
  }

  const items =
    (
      order.order_items as Array<{
        product_variants: Array<{ products: Array<{ name: string }> }>;
      }>
    ) ?? [];

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-xl border bg-white p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Simulated payment
        </p>
        <h1 className="mt-1 text-xl font-semibold">
          {method === "card" ? "Card" : "M-Pesa"} checkout
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This is a stand-in for the payment provider so the shop can be
          tested end to end before IntaSend keys are added.
        </p>

        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Order</dt>
            <dd className="font-mono">{order.id.slice(0, 8)}</dd>
          </div>
          {items.length > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Items</dt>
              <dd className="text-right">
                {items.map((item, i) => (
                  <span key={i} className="block">
                    {item.product_variants?.[0]?.products?.[0]?.name ??
                      "Unknown product"}
                  </span>
                ))}
              </dd>
            </div>
          )}
          <div className="flex justify-between border-t border-black/10 pt-2">
            <dt className="font-medium">Total</dt>
            <dd className="font-semibold tabular-nums">
              {formatKES(Number(order.total_amount))}
            </dd>
          </div>
        </dl>

        <div className="mt-6 grid gap-3">
          <form
            action={simulateMockPayment.bind(null, order.id, "complete")}
            className="grid"
          >
            <button
              type="submit"
              className="w-full rounded-lg bg-brand-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-navy focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none"
            >
              Approve payment
            </button>
          </form>
          <form
            action={simulateMockPayment.bind(null, order.id, "failed")}
            className="grid"
          >
            <button
              type="submit"
              className="w-full rounded-lg border border-black/10 bg-white px-4 py-2.5 text-sm font-medium hover:bg-muted"
            >
              Decline payment
            </button>
          </form>
          <Link
            href="/cart"
            className="text-center text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel and go back to cart
          </Link>
        </div>
      </div>
    </div>
  );
}