# WORKFLOW.md — Git flow, milestones, and issues

**Read this file before making any change, and again before committing or
pushing.** It defines how work is branched, committed, and closed out in
this repo. It complements `PRD.md` (what to build), `design.md`
(architecture), and `agents.md` (coding conventions) — this file governs
process, not code.

Milestones and issues below are meant to be created in GitHub before work
starts (Milestones tab + Issues tab), using these exact names/descriptions.
Once created, every commit and PR should reference the issue it belongs to.

---

## 1. Branching

- `main` is always deployable. No direct commits to `main`.
- One branch per issue, branched from `main`:
  ```
  <type>/<issue-number>-<short-slug>
  ```
  Examples: `feat/12-product-variant-schema`, `fix/27-promotion-date-validation`.
- `<type>` matches the commit type table in §2.
- Keep a branch scoped to its issue. If work reveals a second, unrelated
  issue, open a new issue and a new branch — don't scope-creep one branch.

## 2. Commit message format

Conventional Commits, referencing the issue number:

```
<type>(<scope>): <short summary> (#<issue-number>)
```

| type | use for |
|---|---|
| `feat` | a new feature or capability |
| `fix` | a bug fix |
| `chore` | tooling, deps, config, no behavior change |
| `docs` | documentation only (including this file, PRD, design) |
| `refactor` | code change that isn't a fix or a feature |
| `test` | adding or fixing tests |
| `style` | formatting only, no logic change |

`<scope>` is the affected area: `catalog`, `promotions`, `checkout`,
`payments`, `auth`, `dashboard`, `db`, `ci`, etc. — match folder/domain
names from `design.md` where possible.

Rules:
- One logical change per commit. Don't bundle unrelated changes into one
  commit just because they happened in the same session.
- Every commit for an issue includes that issue's number in parentheses,
  even across multiple commits — this is what lets commits be grouped
  chronologically by issue later.
- Write the summary in the imperative mood ("add", not "added"/"adds").
- Body (optional, below the summary line) explains *why*, not *what* —
  the diff already shows what changed.

Example sequence of commits for one issue:
```
feat(db): add categories and products tables with RLS (#4)
feat(db): add product_variants and promotions tables with RLS (#4)
docs(db): note authenticated-role caveat for post-v2 accounts (#4)
```

## 3. Grouping commits and writing the PR description

Before pushing a finished issue's branch, group and present its commits
chronologically, then add a PR description block directly below the group,
ready to paste into GitHub's PR description field. Use this shape:

```
## Issue #<N>: <issue title>

- feat(db): add categories and products tables with RLS (#4)
- feat(db): add product_variants and promotions tables with RLS (#4)
- docs(db): note authenticated-role caveat for post-v2 accounts (#4)

---
Closes #4

<one or two sentences summarizing what this PR does and any
follow-up/TODO left for a later issue.>
```

- Use **`Closes #<N>`** (not `Fixes`/`Resolves`) as the default closing
  keyword for consistency across the repo, unless the issue is explicitly
  a bug report — then use `Fixes #<N>`. Both are recognized by GitHub to
  auto-close the issue on merge.
- If a PR addresses more than one issue (avoid this where possible — prefer
  one issue per PR), list every issue with its own closing keyword on its
  own line: `Closes #4`, `Closes #5`.
- The PR title should be the same as the issue title.

## 4. Before committing/pushing — checklist

- [ ] Branch name matches `<type>/<issue-number>-<short-slug>`.
- [ ] Every commit message follows the `<type>(<scope>): <summary> (#N)` format.
- [ ] Commits are grouped and listed chronologically for review.
- [ ] The PR description block (§3) is generated and ready to paste.
- [ ] The relevant `agents.md` "Definition of done" checklist items pass
      for anything the issue touched.

---

## 5. Milestones

Create these in GitHub's Milestones tab before opening issues, then assign
each issue below to its milestone.

### Milestone 1: Project Setup & Infrastructure
Repo, environments, and deployment pipeline in place. Nothing
user-facing yet — this milestone exists so every later milestone has
somewhere to deploy to and a database to talk to.

### Milestone 2: Database & Auth Foundation
Full schema (categories, products, variants, promotions, orders,
order_items) applied via migration, RLS policies written and verified,
and admin authentication working. This is the security foundation
everything else depends on.

### Milestone 3: Admin Dashboard — Catalog Management
The owner can log in and fully manage categories, products, and variants,
including image upload, without developer help.

### Milestone 4: Admin Dashboard — Promotions
The owner can create, edit, and end promotions herself, and see them
correctly reflected on the storefront.

### Milestone 5: Storefront — Browsing & Catalog
Public-facing browsing experience: homepage, category pages, product
pages, variant selection, correct promotional pricing displayed.

### Milestone 6: Checkout & Payments
Guest checkout flow, cart, and the payment abstraction with IntaSend
(M-Pesa + card) wired up end to end, including webhook handling.

### Milestone 7: Order Management & Notifications
Admin order list/detail view, and order confirmation via email/SMS on
successful payment.

### Milestone 8: Polish, QA & Launch
Mobile responsiveness pass, performance pass (image optimization, bundle
size), RLS re-verification as `anon`, and production deploy.

---

## 6. Issues

### Milestone 1: Project Setup & Infrastructure

**#1 — Initialize Next.js project with TypeScript and Tailwind**
Set up the Next.js 14+ App Router project with TypeScript strict mode,
Tailwind CSS, and shadcn/ui installed and configured. Matches the folder
structure in `design.md` §7.

**#2 — Create Supabase project and connect environments**
Create the Supabase project, apply `0001_init_schema.sql`, and wire up
`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`/
`SUPABASE_SERVICE_ROLE_KEY` for local and Vercel environments.

**#3 — Set up Vercel deployment**
Connect the repo to Vercel, configure environment variables per
environment (preview/production), and confirm a clean deploy of the
scaffold.

**#30 — Set up separate dev/staging/production Supabase environments**
Create three separate Supabase projects per `design.md` §9, each with its
own env values, so staging can safely test IntaSend's sandbox without
touching production data.

**#31 — Gather client brand inputs and establish design tokens**
Get logo/brand colors and real product photography from the client;
define the color/type/layout token system per `design.md` §14, before any
storefront UI is built. Blocks Milestone 5.

### Milestone 2: Database & Auth Foundation

**#4 — Apply and verify core schema with RLS**
Apply the full schema from `design.md` §2 and confirm every RLS policy in
§4 behaves as intended — test as both `anon` and an authenticated admin,
not just as the service role.

**#5 — Set up Supabase Auth for admin login**
Configure Supabase Auth, provision the owner's admin account manually (no
public signup), and build the `/admin/login` page.

**#6 — Add auth middleware to protect admin routes**
Ensure every route under `(admin)` requires a valid authenticated session,
redirecting to `/admin/login` otherwise.

### Milestone 3: Admin Dashboard — Catalog Management

**#7 — Build category management UI**
Create, edit, and list categories (including nesting) from the dashboard.

**#8 — Build product create/edit form**
Form for name, slug, description, category, base price, status
(draft/published), backed by `productSchema`.

**#9 — Build product image upload**
Direct-to-Supabase-Storage upload from the product form, with file
type/size validation client- and server-side, per `design.md` §6.

**#10 — Build product variant management**
Add/edit/remove variants (attributes, price override, stock, SKU) on a
product, backed by `productVariantSchema`.

**#11 — Build product list view with publish/unpublish**
Dashboard view listing all products with status, quick publish/unpublish
toggle.

### Milestone 4: Admin Dashboard — Promotions

**#12 — Build promotion create/edit form**
Form for name, discount type/value, applies-to scope, date range, banner
text, backed by `promotionSchema`.

**#13 — Build promotion list view with manual end/deactivate**
List active/scheduled/expired promotions with a manual override to end one
early (`is_active` toggle).

**#14 — Decide and implement the promotion tie-break rule**
Resolve the open decision flagged in `design.md` §3 and §15 and
`getEffectivePrice.ts`'s TODO: define what happens when multiple
promotions could apply to the same product, and implement it.

**#32 — Add cache invalidation on promotion/product save**
Call `revalidatePath`/`revalidateTag` for affected storefront pages when a
promotion or product is saved, per `design.md` §10 — without this, the
owner's changes won't visibly take effect.

### Milestone 5: Storefront — Browsing & Catalog

**#15 — Build homepage with featured products and active promotion banner**
Pull published products and any active storewide/category promotion
banner text.

**#16 — Build category and product listing pages**
Browse by category, matching the nested structure from `categories`.

**#17 — Build product detail page with variant selector**
Variant selection (e.g. color/storage) updates displayed price and stock
via `getEffectivePrice`.

**#18 — Build cart (client-side state)**
Add/remove/update quantity, persisted client-side only (no backend cart
table in v1).

### Milestone 6: Checkout & Payments

**#19 — Build guest checkout form**
Contact info + shipping address form backed by `checkoutSchema`.

**#20 — Implement IntaSend provider (initiate + webhook verification)**
Fill in the `IntaSendProvider` TODOs in `src/lib/payments/intasend.ts`:
`initiate`, `verifyWebhook`, `checkStatus`.

**#21 — Wire checkout route to create an order and start payment**
`app/api/checkout` creates the `orders`/`order_items` rows and calls
`paymentProvider.initiate`.

**#22 — Wire payment webhook to update order status**
`app/api/webhooks/payments` verifies the incoming event and updates
`orders.payment_status` via the admin client.

**#23 — Build order confirmation page**
Post-payment confirmation screen shown to the customer.

**#33 — Implement atomic stock reservation at checkout**
Decrement `stock_quantity` with a conditional atomic update per
`design.md` §8, failing the checkout cleanly if stock ran out between
adding to cart and paying.

**#34 — Make the payment webhook idempotent**
Ensure `verifyWebhook` handling is safe to run twice for the same event —
check `payment_status` before applying a change, per `design.md` §8.

**#35 — Add unit tests for pricing and checkout totals**
Cover `getEffectivePrice` and the checkout total calculation with tests,
per `design.md` §11 — the one place a silent bug costs real money.

### Milestone 7: Order Management & Notifications

**#24 — Build admin order list and detail view**
List orders with contact info, items, total, payment status; detail view
per order.

**#25 — Choose and integrate a notification provider**
Resolve the open decision in `design.md` §15: pick an email/SMS provider
and send order confirmations on successful payment. Africa's Talking is
the suggested option if SMS delivery to Kenyan numbers is prioritized.

### Milestone 8: Polish, QA & Launch

**#26 — Mobile responsiveness pass**
Audit every storefront and dashboard page at common mobile breakpoints.

**#27 — Performance pass**
Image optimization, bundle size check, server-component audit per
`agents.md`'s "keep the storefront server-rendered" rule.

**#28 — RLS re-verification before launch**
Re-run every RLS scenario from `design.md` §4 as `anon`, confirm no
regressions introduced during feature work.

**#29 — Production deploy and smoke test**
Deploy to production, place one real end-to-end test order (M-Pesa and
card), confirm it appears correctly in the admin dashboard.

**#36 — Add privacy policy, terms of service, and returns/refund pages**
Publish the legal pages required under Kenya's Data Protection Act and
for payment provider approval, per `design.md` §13.

**#37 — Add SEO metadata, sitemap, and structured data**
Per-page metadata via Next.js's metadata API, a sitemap, `robots.txt`, and
`schema.org` Product/Offer structured data, per `design.md` §12.

**#38 — Set up error monitoring and webhook failure alerting**
Add error tracking (e.g. Sentry) covering the storefront and, critically,
the payment webhook handler, per `design.md` §11 — a silently failing
webhook must not go unnoticed.