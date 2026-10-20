export const SITE_URL = "https://www.imarishadada.org";
export const ORG_ID = `${SITE_URL}/#organisation`;

export const DEFAULT_LOCALE = "en";

/**
 * Locales in rollout order. `sw` is Phase 2, `de`/`pt` Phase 3
 * (doc/roadmap/localisation.md §5). Listing a locale here without a message
 * file will fail the build in `next-intl`, which is the behaviour we want.
 */
export const LOCALES = ["en", "sw", "fr", "de", "pt"] as const;
export type Locale = (typeof LOCALES)[number];

/**
 * Locales that are **actually served right now**.
 *
 * `LOCALES` above is the roadmap; this is reality. They differ today, and
 * conflating them produces a real SEO defect rather than a cosmetic one.
 *
 * Hreflang is a promise: "this page exists in these languages, and here they
 * are". Advertising `sw`/`fr`/`de`/`pt` while none of those routes resolve tells
 * a search engine the translations are missing or broken, which can pull the
 * English pages out of the index as duplicate/incorrect-hreflang. That is worse
 * than advertising nothing.
 *
 * So every alternates map and the sitemap draw from THIS list. When
 * localisation ships, add the locale here and every page, the sitemap and the
 * structured data follow automatically — there is no second place to remember
 * to update.
 *
 * @see doc/roadmap/localisation.md §2
 */
export const PUBLISHED_LOCALES = ["en"] as const satisfies readonly Locale[];
export type PublishedLocale = (typeof PUBLISHED_LOCALES)[number];

/** True once a locale is genuinely served, and therefore safe to advertise. */
export function isPublishedLocale(locale: string): locale is PublishedLocale {
  return (PUBLISHED_LOCALES as readonly string[]).includes(locale);
}

/** `en` is unprefixed; every other locale is prefixed. */
export function localePath(locale: Locale, path = ""): string {
  const clean = path === "/" ? "" : path;
  return locale === DEFAULT_LOCALE ? clean || "/" : `/${locale}${clean}`;
}

/**
 * Self-referencing alternates map for the locales we actually serve.
 *
 * Includes `x-default` pointing at the English URL, which is where a search
 * engine should send a visitor whose language matches none of ours.
 */
export function buildLanguageAlternates(path = ""): Record<string, string> {
  const map: Record<string, string> = Object.fromEntries(
    PUBLISHED_LOCALES.map((locale) => [locale, localePath(locale, path)]),
  );
  map["x-default"] = localePath(DEFAULT_LOCALE, path);
  return map;
}

export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

/**
 * Organization / NGO. Rendered once in the root layout.
 *
 * Deliberately omits fields we do not yet have. No placeholder registration
 * number, no invented postal address, no social profiles that may not exist —
 * institutional donors verify these strings, and a caught fabrication costs
 * more credibility than the field would have earned.
 */
export function organisationJsonLd() {
  return {
    "@type": "NGO",
    "@id": ORG_ID,
    name: "Imarisha Dada",
    alternateName: "Empower a Sister",
    url: SITE_URL,
    description:
      "Girl-centred, community-led organisation championing the rights, dignity and wellbeing of girls and young women in Kibera, Nairobi, Kenya.",
    areaServed: { "@type": "Country", name: "Kenya" },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Nairobi",
      addressCountry: "KE",
    },
  };
}

export function webSiteJsonLd() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: "Imarisha Dada",
    publisher: { "@id": ORG_ID },
    creator: {
      "@type": "Person",
      name: "Kelvin Mwangi Wanjohi",
      jobTitle: "Software Developer",
      nationality: "Kenyan",
    },
    inLanguage: "en-KE",
  };
}

export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/**
 * Serialises JSON-LD for a <script> tag.
 *
 * `<` is escaped so a value containing "</script>" cannot break out of the tag.
 */
export function jsonLdScript(data: object | object[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}