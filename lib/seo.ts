export const SITE_URL = "https://imarishadada.org";
export const ORG_ID = `${SITE_URL}/#organisation`;

export const DEFAULT_LOCALE = "en";

/**
 * Locales in rollout order. `sw` is Phase 2, `de`/`pt` Phase 3
 * (doc/roadmap/localisation.md §5). Listing a locale here without a message
 * file will fail the build in `next-intl`, which is the behaviour we want.
 */
export const LOCALES = ["en", "sw", "fr", "de", "pt"] as const;
export type Locale = (typeof LOCALES)[number];

/** `en` is unprefixed; every other locale is prefixed. */
export function localePath(locale: Locale, path = ""): string {
  const clean = path === "/" ? "" : path;
  return locale === DEFAULT_LOCALE ? clean || "/" : `/${locale}${clean}`;
}

/** Builds a complete, self-referencing alternates map. No orphans. */
export function buildLanguageAlternates(path = ""): Record<string, string> {
  return Object.fromEntries(
    LOCALES.map((locale) => [locale, localePath(locale, path)]),
  );
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