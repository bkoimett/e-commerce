import { describe, expect, it } from "vitest";
import { getEffectivePrice } from "./getEffectivePrice";
import { makeProduct, makePromotion, makeVariant } from "./test-fixtures";

describe("getEffectivePrice", () => {
  it("returns the original price when no promotion applies", () => {
    const result = getEffectivePrice(makeProduct(), makeVariant(), []);
    expect(result).toEqual({
      originalPrice: 1000,
      finalPrice: 1000,
      appliedPromotion: null,
    });
  });

  it("applies a percentage discount to the base price", () => {
    const promo = makePromotion({
      discount_type: "percentage",
      discount_value: 10,
    });
    const result = getEffectivePrice(makeProduct(), makeVariant(), [promo]);
    expect(result.finalPrice).toBe(900);
    expect(result.appliedPromotion?.id).toBe("promo-1");
  });

  it("applies a fixed discount to the base price", () => {
    const promo = makePromotion({
      discount_type: "fixed",
      discount_value: 250,
    });
    const result = getEffectivePrice(makeProduct(), makeVariant(), [promo]);
    expect(result.finalPrice).toBe(750);
  });

  it("prices off the variant price_override when set", () => {
    const promo = makePromotion({
      discount_type: "percentage",
      discount_value: 10,
    });
    const result = getEffectivePrice(
      makeProduct(),
      makeVariant({ price_override: 2000 }),
      [promo]
    );
    expect(result.originalPrice).toBe(2000);
    expect(result.finalPrice).toBe(1800);
  });

  it("only applies a product promotion to its own product", () => {
    const promo = makePromotion({
      applies_to: "product",
      target_id: "prod-other",
      discount_type: "fixed",
      discount_value: 50,
    });
    const result = getEffectivePrice(makeProduct(), makeVariant(), [promo]);
    expect(result.appliedPromotion).toBeNull();
    expect(result.finalPrice).toBe(1000);

    const ownPromo = makePromotion({
      applies_to: "product",
      target_id: "prod-1",
      discount_type: "fixed",
      discount_value: 50,
    });
    const matched = getEffectivePrice(makeProduct(), makeVariant(), [ownPromo]);
    expect(matched.appliedPromotion?.id).toBe("promo-1");
    expect(matched.finalPrice).toBe(950);
  });

  it("only applies a category promo to its category", () => {
    const promo = makePromotion({
      applies_to: "category",
      target_id: "cat-other",
      discount_type: "fixed",
      discount_value: 50,
    });
    const result = getEffectivePrice(makeProduct(), makeVariant(), [promo]);
    expect(result.finalPrice).toBe(1000);

    const catPromo = makePromotion({
      applies_to: "category",
      target_id: "cat-1",
      discount_type: "fixed",
      discount_value: 50,
    });
    const matched = getEffectivePrice(makeProduct(), makeVariant(), [catPromo]);
    expect(matched.finalPrice).toBe(950);
  });

  it("prefers product over category over storewide promotions", () => {
    const storewide = makePromotion({ discount_value: 5 });
    const category = makePromotion({
      id: "promo-cat",
      applies_to: "category",
      target_id: "cat-1",
      discount_value: 10,
    });
    const product = makePromotion({
      id: "promo-prod",
      applies_to: "product",
      target_id: "prod-1",
      discount_value: 15,
    });
    // All three apply; product (highest specificity) must win.
    const result = getEffectivePrice(makeProduct(), makeVariant(), [
      storewide,
      category,
      product,
    ]);
    expect(result.appliedPromotion?.id).toBe("promo-prod");
    expect(result.finalPrice).toBe(850);
  });

  it("breaks specificity ties by picking the larger discount", () => {
    const smaller = makePromotion({
      id: "promo-sm",
      applies_to: "category",
      target_id: "cat-1",
      discount_value: 10,
    });
    const larger = makePromotion({
      id: "promo-lg",
      applies_to: "category",
      target_id: "cat-1",
      discount_value: 20,
    });
    const result = getEffectivePrice(makeProduct(), makeVariant(), [
      smaller,
      larger,
    ]);
    expect(result.appliedPromotion?.id).toBe("promo-lg");
    expect(result.finalPrice).toBe(800);
  });

  it("ignores promotions outside their date window", () => {
    const past = makePromotion({ ends_at: "2001-01-01T00:00:00Z" });
    const future = makePromotion({ starts_at: "2099-01-01T00:00:00Z" });
    const result = getEffectivePrice(makeProduct(), makeVariant(), [past, future]);
    expect(result.appliedPromotion).toBeNull();
    expect(result.finalPrice).toBe(1000);
  });

  it("ignores inactive promotions", () => {
    const promo = makePromotion({ is_active: false, discount_value: 50 });
    const result = getEffectivePrice(makeProduct(), makeVariant(), [promo]);
    expect(result.finalPrice).toBe(1000);
  });

  it("never drops the final price below zero", () => {
    const promo = makePromotion({
      discount_type: "fixed",
      discount_value: 5000,
    });
    const result = getEffectivePrice(makeProduct(), makeVariant(), [promo]);
    expect(result.finalPrice).toBe(0);
  });
});