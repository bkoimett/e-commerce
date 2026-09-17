// The single source of truth for "what does this cost right now."
// Used by both the storefront display and the checkout total calculation
// so the two can never disagree (see design.md §3, agents.md rule #4).
//
// TODO: implement the tie-break rule when multiple promotions could apply
// (see design.md §8 "Open decisions"). Suggested default until decided:
// product-level promotion beats category-level beats storewide, and if
// two promotions tie at the same specificity, apply whichever gives the
// customer the larger discount.

import type { Product, ProductVariant, Promotion } from "@/types/database";

export interface EffectivePriceResult {
  originalPrice: number;
  finalPrice: number;
  appliedPromotion: Promotion | null;
}

export function getEffectivePrice(
  product: Product,
  variant: ProductVariant | null,
  activePromotions: Promotion[]
): EffectivePriceResult {
  const originalPrice = variant?.price_override ?? product.base_price;

  const applicable = activePromotions.filter((promo) => {
    if (!promo.is_active) return false;
    const now = new Date();
    if (now < new Date(promo.starts_at) || now > new Date(promo.ends_at)) {
      return false;
    }
    if (promo.applies_to === "all") return true;
    if (promo.applies_to === "product") return promo.target_id === product.id;
    if (promo.applies_to === "category") return promo.target_id === product.category_id;
    return false;
  });

  if (applicable.length === 0) {
    return { originalPrice, finalPrice: originalPrice, appliedPromotion: null };
  }

  // TODO: replace with the documented tie-break rule once decided.
  // Placeholder: pick whichever applicable promotion gives the biggest discount.
  const best = applicable.reduce((biggest, promo) => {
    const discount =
      promo.discount_type === "percentage"
        ? originalPrice * (promo.discount_value / 100)
        : promo.discount_value;
    const biggestDiscount =
      biggest.discount_type === "percentage"
        ? originalPrice * (biggest.discount_value / 100)
        : biggest.discount_value;
    return discount > biggestDiscount ? promo : biggest;
  });

  const discountAmount =
    best.discount_type === "percentage"
      ? originalPrice * (best.discount_value / 100)
      : best.discount_value;

  const finalPrice = Math.max(0, originalPrice - discountAmount);

  return { originalPrice, finalPrice, appliedPromotion: best };
}
