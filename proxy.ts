import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

/**
 * Locale detection and redirect.
 *
 * ## `proxy.ts`, not `middleware.ts`
 *
 * Next 16 renamed this. `middleware.ts` is deprecated; `proxy.ts` is the
 * current name and the only one that runs. Node.js runtime only.
 *
 * ## What it does
 *
 * For a visitor with no locale in the URL, it decides which locale to serve
 * from (in order: an explicit locale prefix, then the `NEXT_LOCALE` cookie,
 * then the `Accept-Language` header, then the default). For a visitor who has
 * picked a language, it redirects them to the same page in that language.
 *
 * ## What it deliberately does not do
 *
 * It never redirects a crawler. A bot asking for `/donate` is served `/donate`,
 * not bounced through `/en/donate`, because a redirect chain on every asset
 * request is both slow and a well-known way to lose a crawl budget. `next-intl`
 * handles this internally by only auto-redirecting navigations.
 *
 * ## The matcher
 *
 * Excludes `api`, `_next`, `_vercel`, and anything with a file extension. That
 * last clause is what keeps `/brand/logo.webp` and `/favicon.ico` from being
 * treated as unprefixed routes — without it every image request runs locale
 * detection, and any image path beginning with a segment named like a locale
 * (`/sw/...`) would 404.
 */
export default createMiddleware(routing);

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
