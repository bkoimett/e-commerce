// Mock payment provider for local QA (WORKFLOW #62).
//
// Lets the whole checkout flow be exercised without IntaSend credentials or
// sandbox keys: initiation points the customer at a built-in "simulated
// payment" page, and approving/declining there posts a webhook-shaped event
// to our OWN /api/webhooks/payments handler. That means every code path a
// real payment would take (reservation, order snapshot, paid transition,
// failed transition + restock) is exercised exactly as IntaSend would
// trigger it — swapping PAYMENT_PROVIDER to "intasend" later needs zero
// app changes.
//
// Sessions: reference = order.id, and verification uses the same
// challenge-based check as IntaSendProvider, so the mock is a drop-in
// stand-in, not a different flow.

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  PaymentProvider,
  InitiateResult,
  PaymentEvent,
  PaymentEventType,
  PaymentStatusResult,
  InitiateOptions,
} from "./types";
import type { Order } from "@/types/database";

/** Challenge accepted in mock mode; mirrors IntaSend's dashboard challenge. */
const CHALLENGE = process.env.INTASEND_WEBHOOK_SECRET ?? "mock";

export class MockPaymentProvider implements PaymentProvider {
  async initiate(
    order: Order,
    options: InitiateOptions
  ): Promise<InitiateResult> {
    // In mock mode everything routes to our own simulated payment page.
    // The origin is taken from the returnUrl the checkout route builds from
    // NEXT_PUBLIC_SITE_URL (or the request's own origin).
    const origin = options.returnUrl
      ? new URL(options.returnUrl).origin
      : "http://localhost:3000";
    const params = new URLSearchParams({ ref: order.id, method: options.method });
    return {
      reference: order.id,
      redirectUrl: `${origin}/checkout/mock?${params.toString()}`,
    };
  }

  async verifyWebhook(
    payload: unknown,
    // Part of the PaymentProvider interface; the mock authenticates on the
    // challenge field only, like IntaSend.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _headers: Headers
  ): Promise<PaymentEvent> {
    const raw = payload as Record<string, unknown>;
    if (raw?.challenge !== CHALLENGE) {
      throw new Error("Invalid mock webhook challenge");
    }

    const reference = typeof raw?.api_ref === "string" ? raw.api_ref : "";
    if (!reference) {
      throw new Error("Mock webhook payload has no api_ref");
    }

    const state = typeof raw?.state === "string" ? raw.state.toUpperCase() : "";
    let type: PaymentEventType = "unknown";
    if (state === "COMPLETE") type = "payment_succeeded";
    else if (state === "FAILED" || state === "CANCELED") {
      type = "payment_failed";
    }

    return { type, reference, rawPayload: payload };
  }

  async checkStatus(reference: string): Promise<PaymentStatusResult> {
    // In mock mode there is no provider to poll — reflect what the database
    // currently holds (paid via the simulated webhook, or not yet).
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("orders")
      .select("payment_status")
      .eq("payment_reference", reference)
      .maybeSingle();
    if (error) return "pending";
    if (data?.payment_status === "paid") return "paid";
    if (data?.payment_status === "failed") return "failed";
    return "pending";
  }
}