// Mock notification provider (WORKFLOW #31). Logs the confirmation the way a
// real integration would send it, so the full post-payment flow can be QA'd
// before any email/SMS channel is chosen (design.md §15 open decision).
//
// In the dev server these lines land in the terminal; in a deployed
// environment they land in the hosting provider's server logs.

import type { NotificationProvider, OrderConfirmation } from "./types";

export class MockNotificationProvider implements NotificationProvider {
  async sendOrderConfirmation(confirmation: OrderConfirmation): Promise<void> {
    const line = [
      `[mock-notifications] order confirmation for ${confirmation.orderId.slice(0, 8)}`,
      `  to: ${confirmation.contactName} (${confirmation.contactPhone})`,
    ];
    if (confirmation.contactEmail) line.push(`  email: ${confirmation.contactEmail}`);
    line.push(`  items: ${confirmation.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}`);
    line.push(`  total: KES ${confirmation.totalAmount.toFixed(2)}`);
    console.log(line.join("\n"));
  }
}