# Design Document — Electronics Ecommerce Platform

This document records the architecture and schema decisions for this
project. It exists so both humans and AI agents building on this repo make
consistent choices instead of re-deriving architecture per feature.

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14+ (App Router), TypeScript | Server components for fast, SEO-friendly storefront pages; one codebase for storefront + dashboard |
| Hosting | Vercel | Matches Next.js deployment model, easy preview deployments |
| Database/Auth/Storage | Supabase (Postgres, Auth, Storage) | Relational schema fits products/variants/promotions well; RLS gives a real security boundary between public and admin |
| Styling | Tailwind CSS + shadcn/ui | Fast to build a professional, non-templated-looking UI |
| Data fetching (dashboard) | TanStack Query | Client-side interactivity for the admin dashboard (forms, optimistic updates) |
| Validation | Zod | Shared schemas between client forms and server actions/API routes |
| Payments | Abstracted provider interface; IntaSend as first implementation | M-Pesa + card in one integration; swappable later (see §5) |

## 2. Database schema (v1)

```sql
categories
  id              uuid pk
  name            text
  slug            text unique
  parent_id       uuid nullable references categories(id)  -- nesting

products
  id              uuid pk
  category_id     uuid references categories(id)
  name            text
  slug            text unique
  description     text
  base_price      numeric
  images          text[]           -- Supabase Storage URLs
  status          text             -- 'draft' | 'published'
  created_at      timestamptz

product_variants
  id              uuid pk
  product_id      uuid references products(id)
  attributes      jsonb            -- e.g. {"color": "black", "storage": "128GB"}
  price_override  numeric nullable
  stock_quantity  int
  sku             text unique

promotions
  id              uuid pk
  name            text
  discount_type   text             -- 'percentage' | 'fixed'
  discount_value  numeric
  applies_to      text             -- 'all' | 'category' | 'product'
  target_id       uuid nullable    -- category_id or product_id depending on applies_to
  starts_at       timestamptz
  ends_at         timestamptz
  is_active       boolean          -- manual override to end a promo early
  banner_text     text nullable

orders
  id              uuid pk
  customer_id     uuid nullable    -- reserved for v2 accounts; null for guest checkout
  contact_name    text
  contact_phone   text
  contact_email   text nullable
  shipping_address jsonb
  total_amount    numeric
  payment_status  text             -- 'pending' | 'paid' | 'failed'
  payment_provider text            -- e.g. 'intasend'
  payment_reference text nullable  -- provider's transaction id
  created_at      timestamptz

order_items
  id              uuid pk
  order_id        uuid references orders(id)
  variant_id      uuid references product_variants(id)
  quantity        int
  unit_price      numeric          -- price at time of purchase (with promo applied)
```

Notes:
- `orders.customer_id` is nullable and unused in v1 — this avoids a schema
  migration when accounts are added in v2.
- `order_items.unit_price` snapshots the price actually paid (including any
  promotion discount at purchase time), so historical orders stay accurate
  even if promotions or base prices change later.

## 3. Promotions logic

Promotions are rows, not code. To compute a product's displayed price:

1. Find any promotion where `is_active = true`, `now() between starts_at and ends_at`,
   and `applies_to`/`target_id` matches the product (directly, or via its category).
2. If more than one promotion could apply, the design should pick the single
   best discount for the customer (or the most specific match — product-level
   beats category-level beats storewide) — decide and document the tie-break
   rule explicitly when this is implemented, don't leave it ambiguous.
3. Apply the discount to `base_price` (or the variant's `price_override` if set).

This logic should live in one shared function (e.g.
`lib/pricing/getEffectivePrice.ts`) used by both the storefront display and
the checkout total calculation, so the two can never disagree.

## 4. Row Level Security (RLS) — must-haves

This is the most important security boundary in the whole app. At minimum:

- `categories`, `products`, `product_variants`, `promotions`:
  - `SELECT`: allowed for `anon` role only where `status = 'published'`
    (products) or always for categories/promotions (they're not sensitive,
    but writes must still be locked down).
  - `INSERT`/`UPDATE`/`DELETE`: allowed only for the authenticated admin
    role, never for `anon`.
- `orders`, `order_items`:
  - `INSERT`: allowed for `anon` (guest checkout creates its own order) —
    but scoped so a client can only insert an order for itself, not modify
    an existing one.
  - `SELECT`/`UPDATE`: allowed only for the authenticated admin role.
    Guests never read back other customers' orders.
- Do not rely on "the frontend won't show it" as a security boundary —
  RLS must enforce this at the database level, since Supabase's anon key
  is public.

Write and test these policies explicitly before considering the backend
"done." This is called out because it is the easiest thing to skip when
moving fast.

## 5. Payment abstraction

```ts
// lib/payments/types.ts
export interface PaymentProvider {
  initiate(order: Order): Promise<{ redirectUrl?: string; reference: string }>;
  verifyWebhook(payload: unknown, headers: Headers): Promise<PaymentEvent>;
  checkStatus(reference: string): Promise<PaymentStatus>;
}
```

- `lib/payments/intasend.ts` implements this interface for IntaSend
  (M-Pesa STK push + card).
- `lib/payments/index.ts` exports the active provider based on an env var
  (e.g. `PAYMENT_PROVIDER=intasend`), so nothing outside `lib/payments/`
  ever imports a provider-specific SDK directly.
- The checkout route and the webhook route (`app/api/webhooks/payments`)
  only ever call the interface, never `intasend`-specific code. Swapping
  providers later means adding a new file here and changing the env var —
  not touching checkout or order logic.

## 6. Image handling

- Product images are uploaded directly from the admin dashboard's product
  form to a Supabase Storage bucket (e.g. `product-images`), client-side,
  using the Supabase JS client with the admin's authenticated session.
- Enforce a file type allowlist (jpg/png/webp) and a size limit both in the
  upload form and via a Storage policy — don't trust client-side validation
  alone.
- Store the resulting public URLs in `products.images`.

## 7. Folder structure

See the repository tree — key conventions:

- `src/app/(storefront)/...` — public-facing routes, primarily server
  components.
- `src/app/(admin)/...` — dashboard routes, behind Supabase Auth; client
  components where interactivity is needed.
- `src/app/api/...` — route handlers for checkout initiation and payment
  webhooks only. Don't add unrelated API routes here — prefer server
  actions for admin mutations where possible.
- `src/lib/supabase/` — `client.ts` (browser client), `server.ts` (server
  component/action client), `admin.ts` (service-role client, server-only,
  never imported into client code).
- `src/lib/payments/` — the provider abstraction described in §5.
- `src/lib/validations/` — Zod schemas shared between forms and server
  logic.
- `supabase/migrations/` — SQL migrations, source of truth for schema.

## 8. Concurrency & idempotency

Two problems that are cheap to design for now and expensive to retrofit
after launch:

- **Stock races.** Two customers can attempt to buy the last unit of a
  variant at the same moment. Never read `stock_quantity`, check it in
  application code, then write — that has a race window. Decrement
  atomically and conditionally in the same statement, e.g.:
  ```sql
  update product_variants
  set stock_quantity = stock_quantity - :qty
  where id = :variant_id and stock_quantity >= :qty;
  ```
  If the update affects zero rows, the item is out of stock — fail the
  checkout for that item before charging anything.
- **Idempotent webhooks.** Payment providers (including IntaSend) can and
  will redeliver the same webhook event more than once. `verifyWebhook`
  must be safe to process the same event twice: check the order's current
  `payment_status` before applying a change (e.g. don't re-run
  fulfillment logic if it's already `paid`), and treat
  `payment_reference` as the idempotency key.

## 9. Environments

Use three separate Supabase projects — not just Vercel's preview/production
split pointing at one database:

- **Development** — local/experimental work, safe to reset.
- **Staging** — mirrors production schema, used for testing payment
  webhooks against IntaSend's sandbox before anything touches real money.
- **Production** — the live store.

Each environment gets its own `.env` values (Supabase URL/keys, payment
provider keys). Never point a Vercel preview deployment at the production
Supabase project.

## 10. Cache invalidation

If storefront pages use ISR, a promotion or product change made in the
dashboard must trigger an explicit `revalidatePath` (or `revalidateTag`)
call for the affected pages at save time — not rely solely on a timed
revalidation window. Otherwise the owner changes a promotion and it
doesn't appear to work, which undermines the entire "she can do this
herself" goal.

## 11. Observability

- **Error tracking** (e.g. Sentry) on both the storefront and the payment
  webhook handler specifically — a webhook that silently throws leaves an
  order stuck at `pending` forever with nobody notified.
- **Testing**: at minimum, unit tests for `getEffectivePrice` and the
  checkout total calculation. This is the one place a silent bug costs
  real money, so it's worth testing even where nothing else in v1 has
  test coverage.

## 12. SEO

- Use Next.js's metadata API for per-product and per-category pages
  (title, description, Open Graph image from the product's own images).
- Generate a sitemap and `robots.txt`.
- Add `schema.org` Product/Offer structured data on product pages —
  meaningful for a real retail business's organic search visibility, not
  just a nice-to-have.

## 13. Legal & compliance

- Kenya's Data Protection Act (2019) applies, since checkout collects
  phone numbers and physical addresses. Publish a privacy policy.
- Publish terms of service and a returns/refund policy — standard
  expectations for a real store, and typically required for payment
  provider approval (IntaSend/Pesapal) as well.

## 14. Frontend design principles

The goal is a storefront that reads as built for this specific brand and
market, not as a generic AI-templated page. Concretely:

- Get real brand inputs from the client before building UI: logo, brand
  colors if she has them, and actual product photography — not stock
  images or lorem ipsum. If she has none of this yet, treat that as a
  task to complete before frontend work starts (see WORKFLOW.md's design
  token issue).
- Choose a deliberate 4–6 color palette and type system for this brand
  specifically. Avoid the current AI-default looks: warm cream + terracotta,
  near-black + single neon accent, and the "SaaS card kit" (identical
  rounded cards, uniform soft grey shadow on everything).
- Avoid template chrome regardless of subject: tracked-out ALL-CAPS eyebrow
  labels above every heading, arrows (→) appended to every button/link,
  numbered markers (01/02/03) where content isn't actually a sequence.
- Use motion sparingly — one deliberate moment, not fade-and-slide-up
  entrances on every card.
- Include local trust signals appropriate to the market: an M-Pesa payment
  badge, a WhatsApp click-to-chat contact option, and prices formatted as
  KES via `Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' })`.
- Write real empty/error/loading states in the interface's own voice
  ("Your cart is empty — browse phones", not a bare spinner or generic
  "Something went wrong").
- Build to a quality floor without announcing it: responsive down to
  mobile (majority of traffic), visible keyboard focus, reduced motion
  respected.

## 15. Open decisions to make explicit before/while building

- Exact tie-break rule when multiple promotions could apply to one product.
- Email/SMS provider for order confirmations. Africa's Talking is the
  standard local option for reliable SMS delivery to Safaricom/Airtel
  numbers if SMS is chosen over (or alongside) email.
- Whether categories can be more than 2 levels deep in practice (schema
  supports arbitrary nesting, but UI should probably cap it).