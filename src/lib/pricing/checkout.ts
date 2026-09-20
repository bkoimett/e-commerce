// Checkout total calculation — the one place a silent bug costs real money
// (design.md §11). Computes each line's unit price via the shared pricing
// function and sums to the order total. The checkout API route and the unit
// tests both use this, so the displayed and charged amounts can never
// disagree (see WORKFLOW #29).

import type { Product, ProductVariant, Promotion } from "@/types/database";
import { getEffectivePrice } from "./getEffectivePrice";

export interface OrderLineInput {
  variantId: string;
  quantity: number;
}

export interface OrderLineResult extends OrderLineInput {
  productId: string;
  productName: string;
  unitPrice: number; // price actually paid for this variant, snapshot at purchase
  lineTotal: number;
}

export interface OrderTotalsResult {
  lines: OrderLineResult[];
  totalAmount: number;
}

/** Item can no longer be bought (missing, unpublished, or no variant). */
export class CheckoutItemUnavailableError extends Error {
  constructor(public line: OrderLineInput) {
    super("An item in this order is no longer available for purchase");
    this.name = "CheckoutItemUnavailableError";
  }
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeCheckoutLines(
  input: OrderLineInput[],
  variants: ProductVariant[],
  products: Product[],
  promotions: Promotion[]
): OrderTotalsResult {
  const lines: OrderLineResult[] = input.map((line) => {
    const variant = variants.find((v) => v.id === line.variantId);
    if (!variant) throw new CheckoutItemUnavailableError(line);

    const product = products.find((p) => p.id === variant.product_id);
    // Unpublished (or now-draft) products are excluded: the storefront only
    // sells published stock, and anon reads are RLS-filtered to published too.
    if (!product || product.status !== "published") {
      throw new CheckoutItemUnavailableError(line);
    }

    const unitPrice = round2(
      getEffectivePrice(product, variant, promotions).finalPrice
    );
    return {
      ...line,
      productId: product.id,
      productName: product.name,
      unitPrice,
      lineTotal: round2(unitPrice * line.quantity),
    };
  });

  const totalAmount = round2(lines.reduce((sum, l) => sum + l.lineTotal, 0));
  return { lines, totalAmount };
}