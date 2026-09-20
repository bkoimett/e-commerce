// IntaSend payment provider — M-Pesa STK push + card, one API (design.md §5,
// WORKFLOW #23). Every IntaSend-specific concept (their endpoints, their
// field names, their webhook challenge scheme) stays inside this file;
// everything else in the app talks to the PaymentProvider interface.
//
// Correlation rule: we pass `api_ref = order.id` on initiation and store it
// as orders.payment_reference. IntaSend echoes it back in every webhook
// (and its status/payment collection payloads), so the webhook handler can
// always find the order by payment_reference.
//
// Env (see .env.example):
//   INTASEND_PUBLISHABLE_KEY  — public key, sent as X-IntaSend-Public-API-Key
//   INTASEND_SECRET_KEY       — secret token, sent as Authorization: Bearer
//   INTASEND_WEBHOOK_SECRET   — the "challenge" set in the IntaSend dashboard

import type {
  PaymentProvider,
  InitiateResult,
  PaymentEvent,
  PaymentEventType,
  PaymentStatusResult,
  InitiateOptions,
} from "./types";
import type { Order } from "@/types/database";

const INTASEND_API_URL = "https://api.intasend.com";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

/** "+254712345678" or "0712345678" → "254712345678" (IntaSend format). */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.startsWith("254")) return digits;
  return digits;
}

function splitName(fullName: string): [string, string] {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0] ?? "";
  const last = parts.slice(1).join(" ") || first;
  return [first, last];
}

async function intasendFetch(
  path: string,
  init: {
    method: "GET" | "POST";
    body?: Record<string, unknown>;
    secretKey?: string;
    publicKey?: string;
  }
): Promise<any> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (init.secretKey) headers.Authorization = `Bearer ${init.secretKey}`;
  if (init.publicKey) headers["X-IntaSend-Public-API-Key"] = init.publicKey;

  const res = await fetch(`${INTASEND_API_URL}${path}`, {
    method: init.method,
    headers,
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      `IntaSend ${path} failed (${res.status}): ${text.slice(0, 300)}`
    );
  }
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`IntaSend ${path} returned non-JSON: ${text.slice(0, 200)}`);
  }
}

export class IntaSendProvider implements PaymentProvider {
  async initiate(
    order: Order,
    options: InitiateOptions
  ): Promise<InitiateResult> {
    // We always hand IntaSend our own order id as api_ref; any later
    // reference lookup (webhook, status) keys off this value.
    const apiRef = order.id;
    const amount = order.total_amount.toFixed(2);
    const phoneNumber = normalizePhone(order.contact_phone);

    if (options.method === "mpesa") {
      await intasendFetch("/api/v1/payment/mpesa-stk-push/", {
        method: "POST",
        secretKey: requireEnv("INTASEND_SECRET_KEY"),
        body: {
          amount,
          phone_number: phoneNumber,
          api_ref: apiRef,
        },
      });
      // The STK push lands on the customer's phone; no redirect needed.
      return { reference: apiRef };
    }

    // Card: IntaSend hosts the checkout page, then returns to our success
    // page. `host` tells them which domain the payment originates from.
    const publicKey = requireEnv("INTASEND_PUBLISHABLE_KEY");
    const [firstName, lastName] = splitName(order.contact_name);
    const returnUrl = options.returnUrl;
    const data = await intasendFetch("/api/v1/checkout/", {
      method: "POST",
      publicKey,
      body: {
        method: "CARD-PAYMENT",
        channel: "WEBSITE",
        currency: "KES",
        amount,
        host: returnUrl ? new URL(returnUrl).origin : undefined,
        redirect_url: returnUrl,
        api_ref: apiRef,
        first_name: firstName,
        last_name: lastName,
        email: order.contact_email ?? undefined,
        phone_number: phoneNumber,
        card_tarrif: "BUSINESS-PAYS",
      },
    });

    if (!data?.url) {
      throw new Error("IntaSend did not return a checkout URL");
    }
    return { redirectUrl: data.url, reference: apiRef };
  }

  async verifyWebhook(
    payload: unknown,
    headers: Headers
  ): Promise<PaymentEvent> {
    // IntaSend signs webhooks by echoing back the "challenge" string that
    // was configured in the dashboard (see docs "How to Setup Webhook").
    // Comparing it here is the authentication check — never trust a payload
    // whose challenge doesn't match before doing anything with it.
    const raw = payload as Record<string, unknown>;
    const expected = process.env.INTASEND_WEBHOOK_SECRET;
    if (!expected || raw?.challenge !== expected) {
      throw new Error("Invalid IntaSend webhook challenge");
    }

    const reference = typeof raw?.api_ref === "string" ? raw.api_ref : "";
    if (!reference) {
      throw new Error("IntaSend webhook payload has no api_ref");
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
    // Reconciliation fallback if a webhook is missed. IntaSend's status
    // endpoint keys off the invoice id; when checkout stores our own
    // order id as the reference (see correlate note above), pass the
    // invoice id you want to check instead. Purely a manual/ops tool.
    const data = await intasendFetch("/api/v1/payment/status/", {
      method: "POST",
      secretKey: requireEnv("INTASEND_SECRET_KEY"),
      body: { invoice_id: reference },
    });

    const state = String(data?.invoice?.state ?? "").toUpperCase();
    if (state === "COMPLETE") return "paid";
    if (state === "FAILED" || state === "CANCELED") return "failed";
    return "pending";
  }
}