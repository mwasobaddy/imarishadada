import { NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/supabase/auth-server";

/**
 * Auth callback. Supabase redirects here after a magic link click with a
 * `code` query param; we exchange it for a session cookie and redirect.
 *
 * `next` defaults to `/admin`. A `next` pointing anywhere other than a
 * relative path is rejected (open-redirect guard).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/admin";

  // Open-redirect guard: only relative paths.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/admin";

  if (code) {
    const supabase = await createAuthServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth/callback] exchange failed:", error.message);
      return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, request.url));
    }
  }

  return NextResponse.redirect(new URL(safeNext, request.url));
}
