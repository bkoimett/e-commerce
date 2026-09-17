# Electronics Ecommerce Platform (Kenya)

Start here, in this order:

1. **`PRD.md`** — what we're building and why. Read this first.
2. **`design.md`** — the architecture and schema decisions already made
   (stack, database schema, promotions logic, RLS rules, payment
   abstraction, folder structure). Don't re-derive what's already decided
   here.
3. **`agents.md`** — conventions and rules for anyone (human or AI) writing
   code in this repo, plus a "definition of done" checklist per feature.

## Getting started

```bash
cp .env.example .env.local   # fill in Supabase + payment provider keys
npm install
npm run dev
```

Apply `supabase/migrations/0001_init_schema.sql` to your Supabase project
before running the app (via the Supabase CLI or SQL editor).

## Status

Boilerplate stage — schema, RLS policies, type definitions, validation
schemas, and the payment provider abstraction are scaffolded. Business
logic (actual pages, forms, the IntaSend API calls) is not yet
implemented — see the `TODO` comments in `src/lib/payments/intasend.ts`
and `src/lib/pricing/getEffectivePrice.ts` for the first things to build.
