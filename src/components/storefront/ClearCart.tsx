"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart";

/**
 * Empties the cart once an order has actually been placed or paid for.
 * Intentionally skipped when the order already failed, so the customer
 * keeps their items and can retry without rebuilding the cart.
 */
export function ClearCart({ shouldClear }: { shouldClear: boolean }) {
  const { clear } = useCart();

  useEffect(() => {
    if (shouldClear) clear();
  }, [shouldClear, clear]);

  return null;
}