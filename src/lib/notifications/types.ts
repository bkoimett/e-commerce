// Notification abstraction (WORKFLOW #31, design.md §15).
//
// PRD wants a confirmation sent to the customer when their payment clears.
// The concrete channel provider (email and/or SMS) is still an open decision
// (§15 — Africa's Talking is the suggested option for SMS); today only a
// mock provider exists, which logs instead of sending. The interface below
// is the single seam a real provider plugs into, mirroring the payment
// provider pattern in src/lib/payments/.

export interface OrderConfirmationItem {
  name: string;
  quantity: number;
}

export interface OrderConfirmation {
  orderId: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string | null;
  totalAmount: number;
  items: OrderConfirmationItem[];
}

export interface NotificationProvider {
  /** Called once when an order's payment succeeds. */
  sendOrderConfirmation(confirmation: OrderConfirmation): Promise<void>;
}