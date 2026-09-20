import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { paymentProvider } from "@/lib/payments";

export const runtime = "nodejs";

/**
 * Payment webhook (WORKFLOW #25, DESIGN.md §8).
 *
 * IntaSend calls this URL on every collection event (PENDING, COMPLETE,
 * FAILED…). Two rules keep it safe:
 *  - The provider's verifyWebhook authenticates the request before anything
 *    else (IntaSend echoes the dashboard "challenge").
 *  - Every event is treated as a possible DUPLICATE (AGENTS.md rule 9):
 *    we check the order's current payment_status before changing it, so a
 *    re-delivered webhook can never double-apply. Restocking on failure is
 *    handled in #28 on top of the guards below.
 */

async function readPayload(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
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
      // Idempotency: a paid order stays paid; don't re-apply on duplicates.
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
      // Never downgrade an order that is already paid — a late, duplicated
      // FAILED event must not un-pay a completed sale.
      if (order.payment_status === "paid") {
        return NextResponse.json({ ok: true, alreadyProcessed: true });
      }
      const { error: updateError } = await supabase
        .from("orders")
        .update({ payment_status: "failed" })
        .eq("id", order.id);
      if (updateError) {
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