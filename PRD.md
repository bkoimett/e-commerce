# Product Requirements Document — Electronics Ecommerce Platform

## 1. Overview

A single-vendor ecommerce website for a Kenyan retailer selling electronics
(phones, accessories, and similar goods). The site must look professional,
let the owner change promotions/discounts herself without developer
involvement, and give her a dashboard to manage products and orders.

## 2. Goals (v1)

- A public storefront customers can browse and buy from on mobile or desktop.
- An admin dashboard the owner can use with no technical background.
- Promotions/discounts she can create, edit, and expire herself — reflected
  live on the storefront with no code changes or redeploys.
- Checkout that accepts M-Pesa and card payments.
- Fast page loads on typical Kenyan mobile connections (assume a meaningful
  share of traffic is on 3G/4G, not fibre).

## 3. Non-goals (v1 — deferred to v2)

- Customer accounts, login, order history, wishlists (guest checkout only
  for v1; schema should not block adding accounts later).
- Order tracking/status pages for customers.
- Multi-vendor support.
- Loyalty programs, reviews/ratings.

## 4. Users

- **Shopper**: browses products by category, filters by variant (e.g. color,
  storage), adds to cart, checks out as a guest, pays via M-Pesa or card,
  receives confirmation by email/SMS.
- **Owner (admin)**: logs into the dashboard, manages products and variants,
  uploads product images, creates/edits/deletes promotions, views incoming
  orders and their payment status. No coding or database knowledge assumed.

## 5. Core user flows

### 5.1 Shopper: browse → buy
1. Lands on homepage — sees featured products and any active promotion
   banner (e.g. "20% off all phones this weekend").
2. Browses by category or searches.
3. Opens a product page — selects a variant (color/storage) if applicable,
   sees price reflecting any active promotion.
4. Adds to cart, proceeds to checkout.
5. Enters shipping details + contact info (no account required).
6. Chooses M-Pesa or card, completes payment.
7. Sees an order confirmation page; receives confirmation email/SMS.

### 5.2 Admin: manage catalog
1. Logs into `/admin` (Supabase Auth).
2. Creates/edits a product: name, description, category, base price,
   variants (each with its own stock and optional price override), images
   (uploaded directly to Supabase Storage from the dashboard form).
3. Publishes or unpublishes a product.

### 5.3 Admin: manage a promotion
1. Opens the Promotions tab.
2. Creates a promotion: name, discount type (percentage or fixed amount),
   what it applies to (all products / a category / specific products),
   start and end date/time, banner text.
3. Saves — the storefront reflects it automatically once `starts_at` is
   reached, and reverts automatically once `ends_at` passes. No manual
   toggling required, though a manual "active" override should exist for
   cases like ending a promo early.

### 5.4 Admin: view orders
1. Opens Orders tab — sees a list with customer contact info, items,
   total, payment status (pending/paid/failed), and timestamp.
2. Can view a single order's detail.

## 6. Functional requirements

- **Catalog**: categories (nestable), products, variants with independent
  stock and optional price override.
- **Promotions engine**: promotions are data, not hardcoded UI — the
  storefront computes displayed price by checking for an active,
  applicable promotion at render time.
- **Checkout**: guest checkout; order stored with shipping/contact info;
  payment initiated through the abstracted payment module (see design.md);
  order status updated via payment webhook.
- **Admin auth**: Supabase Auth, admin-only role; no public signup for
  admin accounts (owner's account is provisioned manually).
- **Image upload**: direct-to-Supabase-Storage upload from the product
  form, with a reasonable size/type limit enforced client- and
  server-side.
- **Notifications**: order confirmation via email (and/or SMS) on
  successful payment. No customer-facing order-status page in v1.

## 7. Non-functional requirements

- Mobile-first responsive design (majority of Kenyan ecommerce traffic is
  mobile).
- Reasonable performance on slower connections — optimize images, avoid
  shipping unnecessary JS to the client, lean on server components.
- Security: RLS policies must ensure only authenticated admins can write
  to products/variants/promotions/categories; public/anonymous role is
  read-only on published data and can only insert orders (never read
  other customers' orders).
- The payment integration must be swappable without touching
  checkout/order logic (see design.md's provider interface).

## 8. V2 backlog (not built now, but schema should not block it)

- Customer accounts + order history (add `customer_id` to `orders`,
  currently nullable).
- Order tracking/status lookup page.
- Wishlists.
- Product reviews.
- Multiple admin roles/permissions.

## 9. Success criteria for v1 launch

- Owner can add a new product with variants and images herself, without
  developer help.
- Owner can launch and end a promotion herself, and it's correctly
  reflected on the storefront within the promotion's active window.
- A test order can be placed end-to-end with both M-Pesa and a test card,
  and shows up correctly in the admin order list with the right status.
