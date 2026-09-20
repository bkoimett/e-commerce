"use server";

import { redirect } from "next/navigation";
import { POST as handleWebhook } from "@/app/api/webhooks/payments/route";

/**
 * Simulates the outcome of a payment by posting a webhook-shaped event to
 * our own /api/webhooks/payments handler (WORKFLOW #62). Reusing the real
 * handler means paid transitions and failed+restock logic are the exact code
 * a real IntaSend webhook would run — there is no separate "test" path.
 *
 * Only reachable when PAYMENT_PROVIDER=mock; the handler itself still
 * verifies the challenge, so the guard here is defense in depth.
 */
export async function simulateMockPayment(
  ref: string,
  outcome: "complete" | "failed"
): Promise<void> {
  if ((process.env.PAYMENT_PROVIDER ?? "intasend") !== "mock") {
    throw new Error("Simulated payments are only available in mock mode");
  }

  const payload = {
    challenge: process.env.INTASEND_WEBHOOK_SECRET ?? "mock",
    api_ref: ref,
    state: outcome === "complete" ? "COMPLETE" : "FAILED",
    provider: "mock",
  };

  const request = new Request("http://localhost/api/webhooks/payments", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const response = await handleWebhook(request);
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Simulated payment was rejected (${response.status})${body ? `: ${body}` : ""}`);
  }

  redirect(`/checkout/success?ref=${encodeURIComponent(ref)}`);
}