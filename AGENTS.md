# Instructions for AI agents building this repo

Read this together with `PRD.md` (what to build), `design.md`
(architecture/schema decisions already made), and `WORKFLOW.md` (git flow,
milestones, and issues). Don't re-derive architecture that's already
decided in `design.md` — follow it, and if you think a decision there is
wrong, say so explicitly rather than silently diverging.

**Before making any change, and again before committing or pushing, read
`WORKFLOW.md`.** It defines branch naming, commit message format, how to
group commits by issue, and the PR description block (with closing
keywords) to produce once an issue's work is ready to push. Every commit
in this repo should reference the GitHub issue it belongs to, per that
file's format — don't commit without knowing which issue number a change
belongs to.

## Ground rules

1. **Don't invent new architecture for a solved problem.** If `design.md`
   already specifies a schema, a folder for something, or an interface
   (e.g. the payment provider interface), use it. If a requirement isn't
   covered by `design.md` or `PRD.md`, flag the gap instead of quietly
   deciding on your own convention.
2. **Never bypass the payment abstraction.** All payment logic goes
   through `src/lib/payments/`. Checkout routes and webhook handlers call
   the `PaymentProvider` interface only — never a provider SDK directly.
3. **Never bypass RLS by using the service-role key from client-callable
   code.** The service-role/admin Supabase client
   (`src/lib/supabase/admin.ts`) is server-only and must never be imported
   into a client component or exposed to the browser. Public reads/writes
   go through the normal client and must work correctly under RLS as
   written — if a feature "only works" by using the admin client from a
   route the browser can hit, that's a bug, not a solution.
4. **Promotions and pricing logic live in one place.** Any code that needs
   "what does this product cost right now" calls the shared pricing
   function (see `design.md` §3) — don't reimplement discount math in
   multiple components.
5. **Every new table needs RLS policies in the same migration that
   creates it.** Don't ship a table with RLS disabled or default-open,
   even temporarily.
6. **Guest checkout only in v1.** Don't add customer login/signup flows;
   `orders.customer_id` stays nullable and unused until v2 is scoped.
7. **Keep the storefront server-rendered where possible.** Reach for
   client components only where interactivity is genuinely needed (cart,
   variant selector, dashboard forms) — not by default.

## Conventions

- **Language**: TypeScript everywhere, strict mode on. No `any` without a
  comment explaining why it's unavoidable.
- **Validation**: define a Zod schema once per entity in
  `src/lib/validations/`, and reuse it for both the form and the
  server-side check on submit. Don't validate the same shape twice with
  different rules.
- **Naming**: `snake_case` for database columns/tables (Postgres
  convention), `camelCase` for TypeScript variables/functions, `PascalCase`
  for components and types.
- **File placement**: match the structure in `design.md` §7. Route
  handlers only for checkout + webhooks; prefer server actions for admin
  mutations (product create/edit, promotion create/edit).
- **Migrations**: every schema change is a new file in
  `supabase/migrations/`, numbered sequentially. Never edit a migration
  that's already been applied — add a new one.
- **Error handling**: surface real errors to the admin dashboard (e.g. "image
  upload failed: file too large") rather than silent failures or generic
  "something went wrong" messages — the owner using this dashboard is not
  technical and needs actionable feedback.
- **Comments**: explain *why*, not *what*, especially around the pricing/
  promotion logic and RLS policies — those are the two places future
  readers (human or AI) are most likely to make an unsafe change without
  understanding the constraint.

## Definition of done for a feature

A feature isn't done until:
- [ ] It works correctly under RLS as the `anon` role would experience it
      (not just tested with the admin/service-role key).
- [ ] Any new table has RLS policies committed alongside it.
- [ ] Any price-affecting logic goes through the shared pricing function.
- [ ] Any payment-related code goes through `src/lib/payments/`'s
      interface, not a provider SDK directly.
- [ ] Zod validation exists for any new user input, client and server side.

## What NOT to do

- Don't add a second payment integration path "for now" that bypasses the
  abstraction — extend `src/lib/payments/` instead.
- Don't add customer accounts/login in v1 — that's explicitly deferred
  (see `PRD.md` §3, §8).
- Don't hardcode a promotion/discount value in a component — promotions
  are data (see `design.md` §3).
- Don't disable or loosen an RLS policy to "get something working" without
  flagging it — that's a security regression, not a shortcut.