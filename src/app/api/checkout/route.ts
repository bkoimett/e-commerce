import { NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/validations/order";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  computeCheckoutLines,
  CheckoutItemUnavailableError,
} from "@/lib/pricing/checkout";
import { reserveStock, releaseStock } from "@/lib/checkout/stock";
import { paymentProvider } from "@/lib/payments";
import { getActivePromotions } from "@/lib/storefront";
import type { Product, ProductVariant } from "@/types/database";

export const runtime = "nodejs";

/**
 * Guest checkout (WORKFLOW #24, DESIGN.md §5/§8).
 *
 * Prices and totals are recomputed here from the database — nothing the
 * client sends for pricing is trusted. The flow is: price the lines, reserve
 * stock atomically (migration 0002), snapshot the order + items, then start
 * the payment. Every step after reservation includes a compensating release
 * so a failed checkout never leaves stock reserved forever.
 */

async function json(
  body: Record<string, unknown>,
  status: number
): Promise<NextResponse> {
  return NextResponse.json(body, { status });
}

/** Best-effort compensation: never let a cleanup failure mask a real error. */
async function quietly(fn: () => unknown): Promise<void> {
  try {
    await fn();
  } catch {
    // ignore — the check/insert/payment error is what the client sees
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Request body must be valid JSON" }, 400);
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return json(
      {
        error: "Checkout details are invalid",
        issues: parsed.error.flatten(),
      },
      400
    );
  }
  const input = parsed.data;

  const supabase = createAdminClient();

  // ── Pricing (authoritative, DB-side) ───────────────────────────────────
  // OrderLineInput is camelCase, while the payload is snake_case — map once
  // here so every downstream consumer uses the same shape.
  const orderLines = input.items.map((i) => ({
    variantId: i.variant_id,
    quantity: i.quantity,
  }));

  const variantIds = orderLines.map((i) => i.variantId);
  const { data: variants, error: variantsError } = await supabase
    .from("product_variants")
    .select("*")
    .in("id", variantIds);
  if (variantsError) {
    return json({ error: "Couldn't check the items in your cart." }, 500);
  }

  const productIds = Array.from(
    new Set((variants ?? []).map((v) => v.product_id))
  );
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .in("id", productIds);
  if (productsError) {
    return json({ error: "Couldn't check the items in your cart." }, 500);
  }

  // Active promotions come from the shared storefront layer so the
  // "is this promo live" rule (isActivePromotion) lives in exactly one place.
  const promotions = await getActivePromotions().catch(() => []);

  let totals;
  try {
    totals = computeCheckoutLines(
      orderLines,
      (variants ?? []) as ProductVariant[],
      (products ?? []) as Product[],
      promotions
    );
  } catch (err) {
    if (err instanceof CheckoutItemUnavailableError) {
      return json({ error: err.message }, 409);
    }
    throw err;
  }

  // ── Reserve stock atomically (design.md §8) ────────────────────────────
  const reservation = await reserveStock(orderLines);
  if (!reservation.ok) {
    return json(
      {
        error:
          "One of the items sold out while you were checking out. Review your cart and try again.",
      },
      409
    );
  }

  // ── Snapshot the order and items ───────────────────────────────────────
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: null,
      contact_name: input.contact_name,
      contact_phone: input.contact_phone,
      contact_email: input.contact_email || null,
      shipping_address: input.shipping_address,
      total_amount: totals.totalAmount,
      payment_status: "pending",
      payment_provider: "intasend",
    })
    .select()
    .single();
  if (orderError || !order) {
    await quietly(() => releaseStock(orderLines));
    return json({ error: "Couldn't create your order." }, 500);
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    totals.lines.map((l) => ({
      order_id: order.id,
      variant_id: l.variantId,
      quantity: l.quantity,
      unit_price: l.unitPrice, // snapshot: survives later price/promo changes
    }))
  );
  if (itemsError) {
    await quietly(() => releaseStock(orderLines));
    await quietly(
      () => supabase.from("orders").delete().eq("id", order.id)
    );
    return json({ error: "Couldn't save your order items." }, 500);
  }

  // ── Start payment through the provider abstraction (design.md §5) ──────
  const origin = (
    process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin
  ).replace(/\/$/, "");
  const returnUrl = `${origin}/checkout/success?ref=${order.id}`;

  try {
    const result = await paymentProvider.initiate(order, {
      method: input.payment_method,
      returnUrl,
    });

    await quietly(
      () =>
        supabase
          .from("orders")
          .update({ payment_reference: result.reference })
          .eq("id", order.id)
    );

    return NextResponse.json(
      {
        orderId: order.id,
        reference: result.reference,
        redirectUrl: result.redirectUrl,
      },
      { status: 201 }
    );
  } catch (err) {
    // The payment never started: give stock back and record the failed
    // order so the owner can see it in the dashboard.
    await quietly(() => releaseStock(orderLines));
    await quietly(
      () =>
        supabase
          .from("orders")
          .update({ payment_status: "failed" })
          .eq("id", order.id)
    );
    const message =
      err instanceof Error ? err.message : "Payment could not be started.";
    return json({ error: message }, 502);
  }
}