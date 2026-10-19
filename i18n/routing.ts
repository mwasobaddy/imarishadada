import { defineRouting } from "next-intl/routing";

import { PUBLISHED_LOCALES } from "@/lib/seo";

/**
 * Locale routing configuration.
 *
 * `localePrefix: "as-needed"` gives the spec's exact shape: English is served
 * unprefixed (`/donate`) and every other locale is prefixed (`/sw/donate`).
 * URLs that already work today therefore do not change — `/donate` is still
 * `/donate` after this lands, which matters because they are printed on
 * receipts, in funder PDFs and in search results we cannot edit.
 *
 * @see doc/roadmap/localisation.md §2
 */
export const routing = defineRouting({
  // Deliberately `PUBLISHED_LOCALES`, not the full roadmap list.
  //
  // If the proxy advertised `sw` while the Swahili catalogue was still a
  // machine draft, every Swahili-speaking visitor would be auto-redirected
  // from `/donate` onto a page we had not yet had translated or reviewed. That
  // is worse than serving them English.
  //
  // So the proxy, the hreflang tags and the sitemap all read one flag. When the
  // Swahili copy is authored and signed off, `sw` is added to
  // `PUBLISHED_LOCALES` and routing, alternates, the sitemap and the language
  // switcher all become live together — with no second place to forget.
  locales: PUBLISHED_LOCALES,
  defaultLocale: "en",
  localePrefix: "as-needed",
  // `/sw` should render the Swahili homepage rather than 404 on a bare prefix.
  localeDetection: true,
});

export type Locale = (typeof routing.locales)[number];

/** True when the segment is one we serve. Used by `[locale]` layout guards. */
export function isLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}
