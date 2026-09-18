# Electronics Ecommerce Platform (Kenya)

Start here, in this order:

1. **`PRD.md`** — what we're building and why. Read this first.
2. **`DESIGN.md`** — the architecture and schema decisions already made
   (stack, database schema, promotions logic, RLS rules, payment
   abstraction, folder structure). Don't re-derive what's already decided
   here.
3. **`AGENTS.md`** — conventions and rules for anyone (human or AI) writing
   code in this repo, plus a "definition of done" checklist per feature.

## Environments

Three Supabase projects exist per `design.md` §9 — development, staging,
and production — each with its own copy of the values in `.env.example`.
Development is also runnable locally via the Supabase CLI
(`supabase start` using `supabase/config.toml`). Never point a Vercel
preview deployment at the production Supabase project.

## Getting started

1. Create the three Supabase projects (dev / staging / prod) and a Vercel
   project — see `WORKFLOW.md` Milestone 1.
2. Copy the dev project's values into your local env file:
   ```bash
   cp .env.example .env.local   # fill in Supabase + payment provider keys
   npm install
   ```
3. Apply migrations (`supabase/migrations/0001_init_schema.sql`) — locally
   via `supabase db push`, or in the SQL editor for remote projects.
4. Run the app:
   ```bash
   npm run dev
   ```

## Status

Boilerplate stage — schema, RLS policies, type definitions, validation
schemas, and the payment provider abstraction are scaffolded. Business
logic (actual pages, forms, the IntaSend API calls) is not yet
implemented — see the `TODO` comments in `src/lib/payments/intasend.ts`
and `src/lib/pricing/getEffectivePrice.ts` for the first things to build.
