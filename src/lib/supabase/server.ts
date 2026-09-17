// Server client — for use in server components and server actions.
// Still uses the anon key + the request's auth cookie; still governed by
// RLS. This is NOT the elevated-privilege client — see admin.ts for that,
// and note its much stricter usage rule.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component with no writable cookie store.
            // Safe to ignore if middleware is refreshing sessions.
          }
        },
      },
    }
  );
}
