import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { paymentProvider } from "@/lib/payments";
import { releaseStock } from "@/lib/checkout/stock";
import type { OrderLineInput } from "@/lib/pricing/checkout";

export const runtime = "nodejs";

/**
 * Payment webhook (WORKFLOW #25 + #28, DESIGN.md §8).
 *
 * IntaSend calls this URL on every collection event (PENDING, COMPLETE,
 * FAILED…). Three rules keep it safe:
 *  - The provider's verifyWebhook authenticates the request before anything
 *    else (IntaSend echoes the dashboard "challenge").
 *  - Every event is treated as a possible DUPLICATE (AGENTS.md rule 9):
 *    the order's current payment_status decides whether an event acts, so a
 *    re-delivered webhook can never change the order twice.
 *  - A failure transitions pending → failed and returns the reserved stock
 *    (restock on failure, #28). A duplicate FAILED on an already-failed
 *    order is a no-op, so stock is freed exactly once.
 */

async function readPayload(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function markFailedAndRestock(
  orderId: string
): Promise<{ error: string | null }> {
  const supabase = createAdminClient();

  // Flip the order first. If a crash happens between this and the restock,
  // the order is honestly marked failed and stock can be reconciled
  // manually — the alternative (restock first) risks overselling an order
  // that later turns out PAID.
  const { error: updateError } = await supabase
    .from("orders")
    .update({ payment_status: "failed" })
    .eq("id", orderId);
  if (updateError) return { error: updateError.message };

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("variant_id, quantity")
    .eq("order_id", orderId);
  if (itemsError) return { error: itemsError.message };

  const lines: OrderLineInput[] = (items ?? []).map((i) => ({
    variantId: i.variant_id,
    quantity: i.quantity,
  }));
  try {
    await releaseStock(lines);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "restock failed" };
  }
  return { error: null };
}

export async function POST(request: Request) {
  const payload = await readPayload(request);
  if (!payload) {
    return new NextResponse("Bad request: expected JSON", { status: 400 });
  }

  let event;
  try {
    event = await paymentProvider.verifyWebhook(payload, request.headers);
  } catch {
    // Wrong or missing challenge: treat as unauthenticated and drop it.
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!event.reference) {
    return new NextResponse("Bad request: missing reference", { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, payment_status")
    .eq("payment_reference", event.reference)
    .maybeSingle();
  if (orderError) {
    return new NextResponse("Internal error", { status: 500 });
  }
  if (!order) {
    // A webhook for an order we never created (or already deleted) — drop it.
    return new NextResponse("Unknown order", { status: 404 });
  }

  switch (event.type) {
    case "payment_succeeded": {
      // Idempotency: a paid order stays paid — a duplicate COMPLETE must not
      // "re-apply" (it would also trample a subsequent FAILED restock).
      if (order.payment_status === "paid") {
        return NextResponse.json({ ok: true, alreadyProcessed: true });
      }
      const { error: updateError } = await supabase
        .from("orders")
        .update({ payment_status: "paid" })
        .eq("id", order.id);
      if (updateError) {
        return new NextResponse("Internal error", { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    case "payment_failed": {
      // Never downgrade a paid order, and never restock twice: a FAILED
      // order is already failed, so a re-delivered FAILED event is a no-op.
      if (order.payment_status === "paid" || order.payment_status === "failed") {
        return NextResponse.json({ ok: true, alreadyProcessed: true });
      }
      const result = await markFailedAndRestock(order.id);
      if (result.error) {
        return new NextResponse("Internal error", { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    default:
      // PENDING / PROCESSING / intermediate states: acknowledge, take no
      // action. A later COMPLETE or FAILED event does the real work.
      return NextResponse.json({ ok: true, state: "unhandled" });
  }
}