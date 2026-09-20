"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { formatKES } from "@/lib/format";
import { checkoutSchema } from "@/lib/validations/order";
import { cn } from "@/lib/utils";

type FieldErrors = Record<string, string>;

const EMPTY_FORM = {
  contact_name: "",
  contact_phone: "",
  contact_email: "",
  line1: "",
  line2: "",
  town: "",
  county: "",
  payment_method: "mpesa" as "mpesa" | "card",
};

export default function CheckoutPage() {
  const { items, subtotal } = useCart();
  const router = useRouter();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const blockedItems = useMemo(() => items.filter((i) => !i.variantId), [items]);

  function set(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    setErrors({});

    const parsed = checkoutSchema.safeParse({
      contact_name: form.contact_name,
      contact_phone: form.contact_phone,
      contact_email: form.contact_email || undefined,
      shipping_address: {
        line1: form.line1,
        line2: form.line2 || undefined,
        town: form.town,
        county: form.county,
      },
      items: items.map((i) => ({
        variant_id: i.variantId!,
        quantity: i.quantity,
      })),
      payment_method: form.payment_method,
    });

    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".") || "form";
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        redirectUrl?: string;
        reference?: string;
      };

      if (!res.ok) {
        if (res.status === 409) {
          setSubmitError(
            "One of the items sold out while you were checking out. Review your cart and try again."
          );
        } else {
          setSubmitError(
            data.error ?? "We couldn't start your payment. Please try again in a moment."
          );
        }
        setSubmitting(false);
        return;
      }

      if (data.redirectUrl) {
        // Card: IntaSend hosts the payment; they return us to the success page.
        window.location.assign(data.redirectUrl);
        return;
      }

      // M-Pesa: when the STK push is accepted we go straight to confirmation;
      // the success page clears the cart.
      router.push(`/checkout/success?ref=${encodeURIComponent(data.reference ?? "")}`);
    } catch {
      setSubmitError("We couldn't reach the payment service. Please try again in a moment.");
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Nothing to check out</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Your cart is empty. Add something you like, then come back here.
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

  if (blockedItems.length > 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">One of your items can&apos;t be checked out yet</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {blockedItems[0].productName} has no variant to order. Remove it from
          your cart and try again.
        </p>
        <Link
          href="/cart"
          className="mt-6 inline-flex rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none"
        >
          Back to cart
        </Link>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-brand-blue focus:ring-1 focus:ring-brand-blue focus:outline-none";
  const labelClass = "mb-1 block text-sm font-medium";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Checkout</h1>

      <form onSubmit={handleSubmit} noValidate className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-8">
          <section className="rounded-xl border bg-white p-4 sm:p-6">
            <h2 className="mb-4 text-sm font-semibold">Contact details</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="contact_name" className={labelClass}>Full name</label>
                <input id="contact_name" type="text" required autoComplete="name" value={form.contact_name}
                  onChange={(e) => set("contact_name", e.target.value)} className={inputClass} />
                {errors["contact_name"] && <p className="mt-1 text-xs text-destructive">{errors["contact_name"]}</p>}
              </div>
              <div>
                <label htmlFor="contact_phone" className={labelClass}>Phone number (M-Pesa)</label>
                <input id="contact_phone" type="tel" required autoComplete="tel" inputMode="tel"
                  placeholder="e.g. 0712 345 678" value={form.contact_phone}
                  onChange={(e) => set("contact_phone", e.target.value)} className={inputClass} />
                <p className="mt-1 text-xs text-muted-foreground">
                  For M-Pesa payments this is the number that receives the STK push prompt.
                </p>
                {errors["contact_phone"] && <p className="mt-1 text-xs text-destructive">{errors["contact_phone"]}</p>}
              </div>
              <div>
                <label htmlFor="contact_email" className={labelClass}>Email {form.payment_method === "card" && <span className="text-muted-foreground">(required for card)</span>}</label>
                <input id="contact_email" type="email" autoComplete="email" value={form.contact_email}
                  onChange={(e) => set("contact_email", e.target.value)} className={inputClass} />
                {errors["contact_email"] && <p className="mt-1 text-xs text-destructive">{errors["contact_email"]}</p>}
              </div>
            </div>
          </section>

          <section className="rounded-xl border bg-white p-4 sm:p-6">
            <h2 className="mb-4 text-sm font-semibold">Delivery address</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="line1" className={labelClass}>Address</label>
                <input id="line1" type="text" required autoComplete="address-line1" value={form.line1}
                  onChange={(e) => set("line1", e.target.value)} className={inputClass} />
                {errors["shipping_address.line1"] && <p className="mt-1 text-xs text-destructive">{errors["shipping_address.line1"]}</p>}
              </div>
              <div>
                <label htmlFor="line2" className={labelClass}>Building / apartment (optional)</label>
                <input id="line2" type="text" autoComplete="address-line2" value={form.line2}
                  onChange={(e) => set("line2", e.target.value)} className={inputClass} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="town" className={labelClass}>Town</label>
                  <input id="town" type="text" required autoComplete="address-level2" value={form.town}
                    onChange={(e) => set("town", e.target.value)} className={inputClass} />
                  {errors["shipping_address.town"] && <p className="mt-1 text-xs text-destructive">{errors["shipping_address.town"]}</p>}
                </div>
                <div>
                  <label htmlFor="county" className={labelClass}>County</label>
                  <input id="county" type="text" required autoComplete="address-level1" value={form.county}
                    onChange={(e) => set("county", e.target.value)} className={inputClass} />
                  {errors["shipping_address.county"] && <p className="mt-1 text-xs text-destructive">{errors["shipping_address.county"]}</p>}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border bg-white p-4 sm:p-6">
            <h2 className="mb-4 text-sm font-semibold">Payment method</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  { value: "mpesa", title: "M-Pesa", hint: "We send a prompt to your phone" },
                  { value: "card", title: "Card", hint: "Pay by Visa or Mastercard" },
                ] as const
              ).map((opt) => {
                const active = form.payment_method === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm focus-within:ring-2 focus-within:ring-brand-blue",
                      active ? "border-brand-blue bg-brand-blue/5" : "border-black/10 bg-white"
                    )}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={opt.value}
                      checked={active}
                      onChange={() => set("payment_method", opt.value)}
                      className="mt-0.5 accent-[color:oklch(0.5_0.13_260)]"
                    />
                    <div>
                      <p className="font-medium">{opt.title}</p>
                      <p className="text-xs text-muted-foreground">{opt.hint}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-xl border bg-white p-4 lg:sticky lg:top-4">
          <h2 className="mb-3 text-sm font-semibold">Your order</h2>
          <ul className="divide-y divide-black/10">
            {items.map((item) => (
              <li key={item.key} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0">
                  <span className="block truncate">{item.productName}</span>
                  <span className="block text-xs text-muted-foreground">
                    {item.variantLabel ? `${item.variantLabel} · ` : ""}Qty {item.quantity}
                  </span>
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {formatKES(item.unitPrice * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1.5 border-t border-black/10 pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium tabular-nums">{formatKES(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <dt>Delivery</dt>
              <dd>Calculated on confirmation</dd>
            </div>
            <div className="flex justify-between border-t border-black/10 pt-2">
              <dt className="font-semibold">Total</dt>
              <dd className="font-semibold tabular-nums">{formatKES(subtotal)}</dd>
            </div>
          </dl>

          {submitError && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full rounded-lg bg-brand-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-navy focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:outline-none disabled:opacity-60"
          >
            {submitting ? "Starting payment…" : `Pay ${formatKES(subtotal)}`}
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Prices include any active discount. You&apos;ll confirm payment before your
            order is final.
          </p>
        </aside>
      </form>
    </div>
  );
}