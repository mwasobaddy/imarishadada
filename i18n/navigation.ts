import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/**
 * Locale-aware navigation helpers.
 *
 * `createNavigation` rewrites `href="/donate"` to the correct URL for the
 * active locale (`/donate` for `en`, `/sw/donate` for `sw`). This is why
 * `Link` must be imported from here rather than `next/link` inside the locale
 * tree — the built-in `Link` has no idea which locale is active and will
 * silently produce an English URL on a Swahili page.
 *
 * The rest of the site (outside `app/[locale]`) keeps using `next/link`
 * directly, because those routes are English-only by definition.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
