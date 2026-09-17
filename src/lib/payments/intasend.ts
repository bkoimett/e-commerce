// First implementation of PaymentProvider, targeting IntaSend
// (M-Pesa STK push + card, one API/webhook — see design.md §5).
//
// This is a skeleton: fill in the actual IntaSend API calls once
// credentials/sandbox access are set up. Keep all IntaSend-specific
// concepts (their field names, their signature scheme) contained to this
// file — everything else in the app talks to the PaymentProvider interface.

import type {
  PaymentProvider,
  InitiateResult,
  PaymentEvent,
  PaymentStatusResult,
} from "./types";
import type { Order } from "@/types/database";

export class IntaSendProvider implements PaymentProvider {
  async initiate(order: Order): Promise<InitiateResult> {
    // TODO: call IntaSend's collection API with order.total_amount,
    // order.contact_phone (for M-Pesa STK push) or set up their hosted
    // checkout for card payments. Return their checkout/tracking id as
    // `reference`.
    throw new Error("IntaSendProvider.initiate not implemented yet");
  }

  async verifyWebhook(payload: unknown, headers: Headers): Promise<PaymentEvent> {
    // TODO: verify the request signature/challenge against
    // process.env.INTASEND_WEBHOOK_SECRET before trusting the payload.
    // Map IntaSend's status field onto our PaymentEventType.
    throw new Error("IntaSendProvider.verifyWebhook not implemented yet");
  }

  async checkStatus(reference: string): Promise<PaymentStatusResult> {
    // TODO: call IntaSend's status endpoint for this reference as a
    // fallback in case a webhook is missed.
    throw new Error("IntaSendProvider.checkStatus not implemented yet");
  }
}
