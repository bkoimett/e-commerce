// The contract every payment provider implementation must satisfy.
// Nothing outside src/lib/payments/ should import a provider SDK directly
// — see design.md §5 and agents.md's "Never bypass the payment abstraction"
// rule.

import type { Order } from "@/types/database";

export interface InitiateResult {
  /** URL to redirect the customer to, if the provider uses hosted checkout. */
  redirectUrl?: string;
  /** Provider's transaction/checkout reference, stored on the order. */
  reference: string;
}

export type PaymentEventType = "payment_succeeded" | "payment_failed" | "unknown";

export interface PaymentEvent {
  type: PaymentEventType;
  reference: string;
  rawPayload: unknown;
}

export type PaymentStatusResult = "pending" | "paid" | "failed";

export interface PaymentProvider {
  /** Start a payment for this order. Called from the checkout route. */
  initiate(order: Order): Promise<InitiateResult>;

  /**
   * Verify and parse an incoming webhook from the provider.
   * Must validate the request's authenticity (signature/secret) before
   * trusting anything in the payload.
   */
  verifyWebhook(payload: unknown, headers: Headers): Promise<PaymentEvent>;

  /** Poll the provider for a reference's current status, if needed. */
  checkStatus(reference: string): Promise<PaymentStatusResult>;
}
