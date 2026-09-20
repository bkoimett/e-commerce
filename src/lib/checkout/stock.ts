// Server-only stock reservation used by the checkout route.
//
// Intentionally small: it only knows how to run the two atomic SQL
// functions from migration 0002. Everything that decides WHETHER to reserve
// (prices, published status) lives in the checkout route and the shared
// pricing lib — this file never reads-then-writes stock itself.

import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderLineInput } from "@/lib/pricing/checkout";

export interface ReservationResult {
  ok: boolean;
  /** The line that could not be fully reserved, when ok is false. */
  unavailableLine?: OrderLineInput;
}

/**
 * Reserve (decrement) stock for every line. If any line can't be fully
 * reserved, already-reserved lines are released before returning, so the
 * caller is never left holding a half-reserved order.
 */
export async function reserveStock(
  lines: OrderLineInput[]
): Promise<ReservationResult> {
  const supabase = createAdminClient();
  const reserved: OrderLineInput[] = [];

  for (const line of lines) {
    const { data, error } = await supabase.rpc("atomic_decrement_stock", {
      p_variant_id: line.variantId,
      p_quantity: line.quantity,
    });
    if (error) {
      await releaseStock(reserved).catch(() => {});
      throw new Error(`Stock check failed: ${error.message}`);
    }
    if (data === 0) {
      await releaseStock(reserved).catch(() => {});
      return { ok: false, unavailableLine: line };
    }
    reserved.push(line);
  }

  return { ok: true };
}

/** Put reserved stock back (failed payment, aborted checkout, compensation). */
export async function releaseStock(lines: OrderLineInput[]): Promise<void> {
  if (lines.length === 0) return;
  const supabase = createAdminClient();
  for (const line of lines) {
    const { error } = await supabase.rpc("restock_variant", {
      p_variant_id: line.variantId,
      p_quantity: line.quantity,
    });
    if (error) {
      throw new Error(`Failed to release stock: ${error.message}`);
    }
  }
}