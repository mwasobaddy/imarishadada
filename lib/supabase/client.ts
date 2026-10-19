import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using the public (anon) key.
 *
 * The anon key ships in the browser bundle — RLS is the only thing protecting
 * this data. Never use a service-role key here: it bypasses RLS.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
    );
  }

  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** True when Supabase env vars are present. Used to gate the data-layer fallback. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * Service-role client. BYPASSES RLS.
 *
 * Only for writes to tables that are deliberately unreadable and unwritable
 * through the anon key — currently the donation ledger and the provider event
 * log. `donations` carries donor PII and has no RLS policy at all, so every
 * legitimate write has to come through here.
 *
 * Rules that are not optional:
 *   * NEVER import this into a `'use client'` module. It would ship the key.
 *   * NEVER prefix the env var with `NEXT_PUBLIC_`. That would ship the key.
 *   * NEVER use it for a read the anon client could legitimately perform.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Deliberately not NEXT_PUBLIC_ — this must never reach the browser bundle.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY in .env.local. It is server-only — never prefix it with NEXT_PUBLIC_.",
    );
  }

  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** True when the service-role key is available. Gates ledger writes. */
export function isServiceRoleConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}