// Browser client — uses the public anon key. Safe to import into client
// components. Relies entirely on RLS to enforce what it can read/write;
// never bypass that by adding elevated privileges here.
//
// See design.md §4 for the RLS policies this client's access depends on.

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
