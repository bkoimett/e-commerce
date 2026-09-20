// Single point that both sends confirmations and resolves the active
// notification provider. Callers use `sendOrderConfirmation`; they never
// import a specific provider, matching the payment abstraction pattern
// (design.md §5 / §15).

import { createAdminClient } from "@/lib/supabase/admin";
import type { NotificationProvider, OrderConfirmation } from "./types";
import { MockNotificationProvider } from "./mock";

function resolveNotificationProvider(): NotificationProvider {
  const name = process.env.NOTIFICATION_PROVIDER ?? "mock";
  switch (name) {
    case "mock":
      return new MockNotificationProvider();
    default:
      throw new Error(`Unknown NOTIFICATION_PROVIDER: ${name}`);
  }
}

/**
 * Load an order and dispatch its confirmation notification.
 *
 * Called from the payment webhook once an order transitions to paid, so the
 * customer gets their confirmation at the same moment the order becomes
 * real. A failure here must never break the payment update — callers are
 * expected to catch.
 */
export async function sendOrderConfirmation(orderId: string): Promise<void> {
  const supabase = createAdminClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, contact_name, contact_phone, contact_email, total_amount, order_items(quantity, product_variants(products(name)))"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) {
    throw new Error(`Could not load order ${orderId} for notification`);
  }

  const items =
    (order.order_items as Array<{
      quantity: number;
      product_variants: Array<{ products: Array<{ name: string }> }>;
    }> | null) ?? [];

  const confirmation: OrderConfirmation = {
    orderId: order.id,
    contactName: order.contact_name,
    contactPhone: order.contact_phone,
    contactEmail: order.contact_email,
    totalAmount: Number(order.total_amount),
    items: items.map((item) => ({
      name: item.product_variants?.[0]?.products?.[0]?.name ?? "Unknown product",
      quantity: item.quantity,
    })),
  };

  await resolveNotificationProvider().sendOrderConfirmation(confirmation);
}