"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./types";

/**
 * Cookie-backed Supabase client for Client Components.
 *
 * The session lives in cookies rather than localStorage so the server can read
 * it on the next request. A localStorage session is invisible to a Server
 * Component, which is the usual cause of "logged in on the client, anonymous
 * on the server".
 *
 * Cached in a module-level singleton: `createBrowserClient` is cheap but every
 * call installs another auth-state listener, and a component that re-renders
 * often would accumulate them.
 */
let cached: SupabaseClient<Database> | null = null;

export function createAuthBrowserClient(): SupabaseClient<Database> {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
    );
  }

  cached = createBrowserClient<Database>(url, key);
  return cached;
}
