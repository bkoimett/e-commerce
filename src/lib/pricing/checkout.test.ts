import { describe, expect, it } from "vitest";
import {
  CheckoutItemUnavailableError,
  computeCheckoutLines,
  round2,
} from "./checkout";
import { makeProduct, makePromotion, makeVariant } from "./test-fixtures";

describe("round2", () => {
  it("rounds to two decimal places", () => {
    expect(round2(123.456)).toBe(123.46);
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });
});

describe("computeCheckoutLines", () => {
  it("computes a single line with no promotions", () => {
    const result = computeCheckoutLines(
      [{ variantId: "variant-1", quantity: 3 }],
      [makeVariant()],
      [makeProduct()],
      []
    );
    expect(result.lines).toEqual([
      expect.objectContaining({
        variantId: "variant-1",
        quantity: 3,
        productName: "Test Product",
        unitPrice: 1000,
        lineTotal: 3000,
      }),
    ]);
    expect(result.totalAmount).toBe(3000);
  });

  it("sums multiple lines", () => {
    const variantA = makeVariant({ id: "v-a", price_override: 1000 });
    const variantB = makeVariant({
      id: "v-b",
      price_override: 2000,
      product_id: "prod-2",
    });
    const productB = makeProduct({ id: "prod-2", base_price: 5000 });
    const result = computeCheckoutLines(
      [
        { variantId: "v-a", quantity: 2 },
        { variantId: "v-b", quantity: 1 },
      ],
      [variantA, variantB],
      [makeProduct(), productB],
      []
    );
    expect(result.totalAmount).toBe(4000);
  });

  it("applies promotions through the shared pricing function", () => {
    const promo = makePromotion({
      discount_type: "percentage",
      discount_value: 10,
    });
    const result = computeCheckoutLines(
      [{ variantId: "variant-1", quantity: 2 }],
      [makeVariant()],
      [makeProduct()],
      [promo]
    );
    // Same rule as the storefront: 10% off 1000 = 900 per unit.
    expect(result.lines[0].unitPrice).toBe(900);
    expect(result.totalAmount).toBe(1800);
  });

  it("prices from the variant override even when a promo applies", () => {
    const promo = makePromotion({ discount_value: 10 });
    const result = computeCheckoutLines(
      [{ variantId: "variant-1", quantity: 1 }],
      [makeVariant({ price_override: 2000 })],
      [makeProduct()],
      [promo]
    );
    expect(result.lines[0].unitPrice).toBe(1800);
  });

  it("floors each unit price at zero for oversized fixed discounts", () => {
    const promo = makePromotion({
      discount_type: "fixed",
      discount_value: 99999,
    });
    const result = computeCheckoutLines(
      [{ variantId: "variant-1", quantity: 1 }],
      [makeVariant()],
      [makeProduct()],
      [promo]
    );
    expect(result.lines[0].unitPrice).toBe(0);
    expect(result.totalAmount).toBe(0);
  });

  it("rejects a line whose variant does not exist", () => {
    expect(() =>
      computeCheckoutLines(
        [{ variantId: "missing", quantity: 1 }],
        [makeVariant()],
        [makeProduct()],
        []
      )
    ).toThrow(CheckoutItemUnavailableError);
  });

  it("rejects a line whose product is unpublished", () => {
    expect(() =>
      computeCheckoutLines(
        [{ variantId: "variant-1", quantity: 1 }],
        [makeVariant()],
        [makeProduct({ status: "draft" })],
        []
      )
    ).toThrow(CheckoutItemUnavailableError);
  });

  it("errors on the first unavailable line and nothing else", () => {
    try {
      computeCheckoutLines(
        [
          { variantId: "v-ok", quantity: 1 },
          { variantId: "v-missing", quantity: 1 },
        ],
        [makeVariant({ id: "v-ok" })],
        [makeProduct()],
        []
      );
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(CheckoutItemUnavailableError);
      expect((err as CheckoutItemUnavailableError).line.variantId).toBe(
        "v-missing"
      );
    }
  });
});