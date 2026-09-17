// SERVICE-ROLE CLIENT — bypasses RLS entirely.
//
// Rules (see agents.md):
// - Server-only. Never import this file from a client component.
// - Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
// - Use this only for operations that genuinely must bypass RLS
//   (e.g. a payment webhook updating an order's status after verifying
//   the request came from the payment provider). If you find yourself
//   reaching for this to "make a feature work" from a browser-triggered
//   route, the RLS policy is wrong — fix the policy, don't route around it.

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
