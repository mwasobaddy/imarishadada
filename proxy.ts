import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "@/i18n/routing";
import { localePath } from "@/lib/seo";

/**
 * Locale detection and redirect + admin route protection.
 *
 * ## Admin protection
 *
 * `/admin/*` and `/auth/*` are not locale-prefixed. Admin routes require a
 * valid session; an unauthenticated request is bounced to `/auth/login` with
 * a `next` param so the user lands back where they were trying to go.
 *
 * ## Locale detection
 *
 * For everything else, next-intl handles locale detection and redirects.
 *
 * @see .opencode/rules/backend.md — "Anything under /admin, /dashboard,
 *      /api/private — enforce in proxy.ts AND in the data layer."
 */
const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Detect admin/auth segments regardless of locale prefix.
  // Admin pages live at /[locale]/admin/... but the proxy sees the raw path.
  const segments = pathname.split("/").filter(Boolean);
  const isAdmin = segments.includes("admin");
  const isAuth = segments.includes("auth");

  // Auth routes: let through (next-intl handles locale).
  if (isAuth) {
    return intlMiddleware(request);
  }

  // Admin routes: require a session.
  if (isAdmin) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      },
    );

    const { data } = await supabase.auth.getClaims();
    if (!data?.claims?.sub) {
      // Redirect to the login page. `localePath` omits the prefix for the
      // default locale (English is served unprefixed), so this is a single
      // hop rather than /en/auth/login → /auth/login.
      const locale = segments[0] && routing.locales.includes(segments[0] as any)
        ? (segments[0] as "en")
        : "en";
      const loginUrl = new URL(localePath(locale, "/auth/login"), request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated — fall through to next-intl rather than returning
    // `NextResponse.next()`.
    //
    // This matters: the `[locale]` segment only exists because next-intl
    // rewrites the incoming path (`/admin` → `/en/admin`). Skipping the
    // middleware leaves `params.locale` undefined, and the locale layout
    // responds with `notFound()`. So the rewrite is not optional here — the
    // auth check has to sit in front of it, not replace it.
    return intlMiddleware(request);
  }

  // Everything else: next-intl locale handling.
  return intlMiddleware(request);
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
