// Demo catalog seed (WORKFLOW #63).
//
// Idempotent: safe to run more than once — nothing already present is
// duplicated (matched by category slug, product slug, variant SKU, and
// promotion name). Uses neutral placeholder images that can be swapped for
// the client's real photography later (#5).
//
// Usage:
//   node --env-file=.env.local scripts/seed-demo.mjs
//   (npm run seed:demo)
//
// Writes via the service-role key, so RLS never restricts it; it is a
// development/QA aid, not part of app code.

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

function placeholderImage(label) {
  return [
    `https://placehold.co/800x800/e9e9e9/555555?text=${encodeURIComponent(label).replace(/%20/g, "+")}`,
  ];
}

async function ensureCategory(slug, name) {
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("categories")
    .insert({ slug, name })
    .select()
    .single();
  if (error) throw new Error(`category ${slug}: ${error.message}`);
  console.log(`  category ${slug} created`);
  return data.id;
}

async function ensureProduct({ categoryId, name, slug, description, basePrice, images }) {
  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("products")
    .insert({
      category_id: categoryId,
      name,
      slug,
      description,
      base_price: basePrice,
      images,
      status: "published",
    })
    .select()
    .single();
  if (error) throw new Error(`product ${slug}: ${error.message}`);
  console.log(`  product ${slug} created (${formatKES(basePrice)})`);
  return data.id;
}

async function ensureVariant({ productId, sku, attributes, priceOverride, stock }) {
  const { data: existing } = await supabase
    .from("product_variants")
    .select("id")
    .eq("sku", sku)
    .maybeSingle();
  if (existing) return;

  const { error } = await supabase.from("product_variants").insert({
    product_id: productId,
    sku,
    attributes,
    price_override: priceOverride,
    stock_quantity: stock,
  });
  if (error) throw new Error(`variant ${sku}: ${error.message}`);
  console.log(`  variant ${sku} created (stock ${stock})`);
}

async function ensureStorewidePromotion({ name, discountPercent, bannerText }) {
  const { data: existing } = await supabase
    .from("promotions")
    .select("id")
    .eq("name", name)
    .maybeSingle();
  if (existing) return;

  const start = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const end = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  const { error } = await supabase.from("promotions").insert({
    name,
    discount_type: "percentage",
    discount_value: discountPercent,
    applies_to: "all",
    target_id: null,
    starts_at: start,
    ends_at: end,
    is_active: true,
    banner_text: bannerText,
  });
  if (error) throw new Error(`promotion ${name}: ${error.message}`);
  console.log(`  promotion "${name}" created (${discountPercent}% storewide)`);
}

function formatKES(n) {
  return "KES " + Number(n).toLocaleString("en-KE");
}

async function main() {
  console.log("Seeding demo catalog…");

  const phonesId = await ensureCategory("phones", "Phones");
  const laptopsId = await ensureCategory("laptops", "Laptops");
  const audioId = await ensureCategory("audio", "Audio & Headphones");

  const galaxy = await ensureProduct({
    categoryId: phonesId,
    name: "Samsung Galaxy S24",
    slug: "galaxy-s24",
    description:
      "Flagship Android with a 6.2\" Dynamic AMOLED display, 50MP camera and all-day battery.",
    basePrice: 95000,
    images: placeholderImage("Samsung Galaxy S24"),
  });
  await ensureVariant({
    productId: galaxy,
    sku: "SGS24-256-BLK",
    attributes: { storage: "256GB", color: "Titanium Black" },
    priceOverride: null,
    stock: 8,
  });
  await ensureVariant({
    productId: galaxy,
    sku: "SGS24-512-GRY",
    attributes: { storage: "512GB", color: "Titanium Gray" },
    priceOverride: 105000,
    stock: 5,
  });

  const macbook = await ensureProduct({
    categoryId: laptopsId,
    name: 'MacBook Air M3',
    slug: "macbook-air-m3",
    description:
      '13" MacBook Air with the M3 chip — fanless, silent, and all-day battery life.',
    basePrice: 145000,
    images: placeholderImage("MacBook Air M3"),
  });
  await ensureVariant({
    productId: macbook,
    sku: "MBA13-M3-8-256",
    attributes: { size: '13"', memory: "8GB", storage: "256GB" },
    priceOverride: null,
    stock: 4,
  });
  await ensureVariant({
    productId: macbook,
    sku: "MBA13-M3-16-512",
    attributes: { size: '13"', memory: "16GB", storage: "512GB" },
    priceOverride: 165000,
    stock: 3,
  });

  const sony = await ensureProduct({
    categoryId: audioId,
    name: "Sony WH-1000XM5",
    slug: "sony-wh-1000xm5",
    description:
      "Industry-leading wireless noise cancelling headphones with up to 30 hours of battery.",
    basePrice: 38000,
    images: placeholderImage("Sony WH-1000XM5"),
  });
  await ensureVariant({
    productId: sony,
    sku: "WH1000XM5-BLK",
    attributes: { color: "Black" },
    priceOverride: null,
    stock: 10,
  });
  await ensureVariant({
    productId: sony,
    sku: "WH1000XM5-SLV",
    attributes: { color: "Silver" },
    priceOverride: null,
    stock: 6,
  });

  await ensureStorewidePromotion({
    name: "Launch sale — 10% off",
    discountPercent: 10,
    bannerText: "Launch sale: 10% off everything",
  });

  console.log("Done. Storefront homepage now shows the seeded products with a promo banner.");
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});