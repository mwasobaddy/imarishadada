import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";

import { routing } from "./routing";

/**
 * Per-request i18n configuration.
 *
 * `hasLocale` is the guard that matters: it is `next-intl`'s way of verifying
 * the segment from the URL is actually a locale we serve, and it returns
 * `false` rather than throwing. Without it a request for `/xx/donate` would be
 * treated as the `xx` locale and try to load `messages/xx.json`, which does not
 * exist.
 *
 * Note the naming split: the English catalogue deliberately keeps its key
 * `en`, not `en-GB` or `en_US`. hreflang still emits the *region* form
 * (`en-KE`) via `lib/seo.ts`, because that is what search engines match on —
 * the message catalogue and the SEO locale are different concerns.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    // Formatting follows the locale, but money stays in KES. A donor giving in
    // EUR must see a EUR amount *and* the KES equivalent on the receipt, which
    // is handled in `lib/donate/money.ts`, not here.
    formats: {
      number: { currency: { style: "currency", currency: "KES" } },
    },
  };
});
