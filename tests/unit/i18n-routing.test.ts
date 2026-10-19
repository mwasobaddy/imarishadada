import { describe, expect, it } from "vitest";

import {
  PUBLISHED_LOCALES,
  buildLanguageAlternates,
  isPublishedLocale,
  localePath,
} from "@/lib/seo";
import { routing } from "@/i18n/routing";

/**
 * Locale routing and hreflang.
 *
 * doc/roadmap/localisation.md §6 requires TDD here specifically: "locale
 * detection and redirect, message-key resolution, and `hreflang` generation.
 * These are logic and easy to get subtly wrong."
 *
 * The failure this suite protects against is concrete and already happened
 * once: the sitemap advertised five locales while only one resolved. Hreflang
 * pointing at 404s can get the English pages de-indexed as
 * duplicate/incorrect-hreflang — a worse outcome than having no translations.
 */
describe("routing", () => {
  it("serves English unprefixed", () => {
    // `localePrefix: "as-needed"`. These URLs are printed on receipts, in
    // funder PDFs and in search results we cannot edit, so they must not
    // change when localisation lands.
    expect(localePath("en", "/donate")).toBe("/donate");
    expect(localePath("en")).toBe("/");
    expect(localePath("en", "/")).toBe("/");
  });

  it("prefixes every other locale", () => {
    expect(localePath("sw", "/donate")).toBe("/sw/donate");
    expect(localePath("fr", "/impact")).toBe("/fr/impact");
    expect(localePath("de", "/impact")).toBe("/de/impact");
    expect(localePath("pt", "/impact")).toBe("/pt/impact");
  });

  it("only routes locales that are actually published", () => {
    // The proxy and the sitemap both read this. A locale the proxy serves but
    // the sitemap omits — or the reverse — is a one-line inconsistency that
    // becomes a 404 for a real visitor.
    expect(routing.locales).toEqual(PUBLISHED_LOCALES);
  });

  it("uses the as-needed prefix strategy", () => {
    expect(routing.localePrefix).toBe("as-needed");
  });

  it("defaults to English", () => {
    expect(routing.defaultLocale).toBe("en");
  });
});

describe("isPublishedLocale", () => {
  it("accepts a published locale", () => {
    expect(isPublishedLocale("en")).toBe(true);
  });

  it("rejects a locale that is not served", () => {
    expect(isPublishedLocale("sw")).toBe(false);
    expect(isPublishedLocale("klingon")).toBe(false);
    expect(isPublishedLocale("")).toBe(false);
  });

  it("rejects a locale with a different case", () => {
    // A case-insensitive check would let `/EN/donate` through and produce a
    // message catalogue lookup that does not exist.
    expect(isPublishedLocale("EN")).toBe(false);
  });
});

describe("buildLanguageAlternates", () => {
  it("advertises published locales plus x-default, and nothing else", () => {
    const alts = buildLanguageAlternates("/donate");
    expect(Object.keys(alts).sort()).toEqual(
      [...PUBLISHED_LOCALES, "x-default"].sort(),
    );
  });

  it("omits every locale that would 404", () => {
    const alts = buildLanguageAlternates("/donate");
    for (const locale of ["sw", "fr", "de", "pt"]) {
      if (!isPublishedLocale(locale)) {
        expect(alts).not.toHaveProperty(locale);
      }
    }
  });

  it("points x-default at the English url", () => {
    // x-default is where a visitor whose language matches none of ours is
    // sent. It must be the English page, not the first locale in the list.
    expect(buildLanguageAlternates("/donate")["x-default"]).toBe("/donate");
    expect(buildLanguageAlternates("/")["x-default"]).toBe("/");
  });

  it("self-references the current locale", () => {
    // A hreflang set with no self-reference is an orphan, and orphans are a
    // defect Google explicitly reports.
    const alts = buildLanguageAlternates("/impact");
    expect(alts.en).toBe("/impact");
  });

  it("produces no orphans — every entry points at a real locale path", () => {
    for (const path of ["/", "/donate", "/programmes/school-reentry"]) {
      const alts = buildLanguageAlternates(path);
      for (const [locale, href] of Object.entries(alts)) {
        if (locale === "x-default") {
          expect(href).toBe(localePath("en", path));
          continue;
        }
        expect(href).toBe(localePath(locale as "en", path));
      }
    }
  });
});
