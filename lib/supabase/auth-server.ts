import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "./types";

/**
 * Cookie-backed Supabase client for Server Components, Server Actions and
 * Route Handlers.
 *
 * ## Why this is separate from `lib/supabase/client.ts`
 *
 * `createClient()` in `client.ts` is a stateless anon client with
 * `persistSession: false`. It is correct for the public site, which reads
 * published rows and never has a user. It is wrong for anything that has to
 * know *who* is asking: a Server Action that writes needs the caller's session,
 * and a session lives in cookies.
 *
 * ## The read-only render problem
 *
 * A Server Component cannot set a cookie — Next throws. `setAll` therefore
 * swallows that error rather than crashing the render. The refresh is not lost:
 * `proxy.ts` runs `getClaims()` on every matched request, which is early enough
 * in the request lifecycle that the rotated token is written onto the response.
 * This is the documented split — middleware refreshes, components read.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function createAuthServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
    );
  }

  // `cookies()` is a Promise in Next 16. Awaiting it is not optional.
  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component render. `proxy.ts` owns the refresh.
        }
      },
    },
  });
}
