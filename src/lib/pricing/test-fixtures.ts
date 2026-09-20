import type { Product, ProductVariant, Promotion } from "@/types/database";

// Wide-open window so promotion time-bounds never interfere with unit tests.
const WINDOW = {
  starts_at: "2000-01-01T00:00:00Z",
  ends_at: "2100-01-01T00:00:00Z",
};

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod-1",
    category_id: "cat-1",
    name: "Test Product",
    slug: "test-product",
    description: "Test",
    base_price: 1000,
    images: [],
    status: "published",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function makeVariant(
  overrides: Partial<ProductVariant> = {}
): ProductVariant {
  return {
    id: "variant-1",
    product_id: "prod-1",
    attributes: {},
    price_override: null,
    stock_quantity: 10,
    sku: "TEST-1",
    ...overrides,
  };
}

export function makePromotion(
  overrides: Partial<Promotion> = {}
): Promotion {
  return {
    id: "promo-1",
    name: "Test promo",
    discount_type: "percentage",
    discount_value: 10,
    applies_to: "all",
    target_id: null,
    starts_at: WINDOW.starts_at,
    ends_at: WINDOW.ends_at,
    is_active: true,
    banner_text: null,
    ...overrides,
  };
}