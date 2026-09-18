// The single source of truth for "what does this cost right now."
// Used by both the storefront display and the checkout total calculation
// so the two can never disagree (see design.md §3, agents.md rule #4).

import type { Product, ProductVariant, Promotion } from "@/types/database";

export interface EffectivePriceResult {
  originalPrice: number;
  finalPrice: number;
  appliedPromotion: Promotion | null;
}

/**
 * Tie-break rule for multiple applicable promotions:
 * 1. Higher specificity wins: product > category > storewide
 * 2. Within same specificity, the larger discount wins
 */
function promotionSpecificity(promo: Promotion): number {
  if (promo.applies_to === "product") return 3;
  if (promo.applies_to === "category") return 2;
  return 1; // "all"
}

function discountAmount(promo: Promotion, originalPrice: number): number {
  if (promo.discount_type === "percentage") {
    return originalPrice * (promo.discount_value / 100);
  }
  return promo.discount_value;
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

  // Tie-break: highest specificity first, then largest discount
  const best = applicable.reduce((biggest, promo) => {
    const promoSpec = promotionSpecificity(promo);
    const biggestSpec = promotionSpecificity(biggest);

    if (promoSpec !== biggestSpec) {
      return promoSpec > biggestSpec ? promo : biggest;
    }

    // Same specificity: pick larger discount
    return discountAmount(promo, originalPrice) > discountAmount(biggest, originalPrice)
      ? promo
      : biggest;
  });

  const finalPrice = Math.max(0, originalPrice - discountAmount(best, originalPrice));

  return { originalPrice, finalPrice, appliedPromotion: best };
}