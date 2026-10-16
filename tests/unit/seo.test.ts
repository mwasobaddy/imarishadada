import { describe, expect, it } from "vitest";

import {
  LOCALES,
  breadcrumbJsonLd,
  buildLanguageAlternates,
  jsonLdScript,
  localePath,
  organisationJsonLd,
  webSiteJsonLd,
} from "@/lib/seo";

describe("localePath", () => {
  it("serves English unprefixed", () => {
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
});

describe("buildLanguageAlternates", () => {
  it("returns every rollout locale, including self-reference", () => {
    const alts = buildLanguageAlternates("/donate");
    expect(Object.keys(alts).sort()).toEqual([...LOCALES].sort());
    expect(alts.en).toBe("/donate");
    expect(alts.sw).toBe("/sw/donate");
  });

  it("produces no orphans — every entry points at a real locale path", () => {
    for (const path of ["/", "/donate", "/programmes/school-reentry"]) {
      const alts = buildLanguageAlternates(path);
      for (const [locale, href] of Object.entries(alts)) {
        expect(href).toBe(localePath(locale as (typeof LOCALES)[number], path));
      }
    }
  });
});

describe("jsonLdScript", () => {
  it("escapes < so a value cannot break out of the script tag", () => {
    const output = jsonLdScript({ name: "</script><img onerror=alert(1)>" });
    expect(output).not.toContain("</script>");
    expect(output).toContain("\\u003c");
  });

  it("produces valid JSON", () => {
    expect(JSON.parse(jsonLdScript({ a: 1 }))).toEqual({ a: 1 });
  });
});

describe("organisationJsonLd", () => {
  it("emits an NGO with a stable @id", () => {
    const org = organisationJsonLd();
    expect(org["@type"]).toBe("NGO");
    expect(org["@id"]).toContain("#organisation");
  });

  it("omits fields we do not have rather than publishing placeholders", () => {
    const org = organisationJsonLd();
    // No fabricated registration number, phone, email, or social profiles.
    expect(org).not.toHaveProperty("telephone");
    expect(org).not.toHaveProperty("email");
    expect(org).not.toHaveProperty("sameAs");
    expect(org).not.toHaveProperty("identifier");
  });
});

describe("breadcrumbJsonLd", () => {
  it("numbers positions from one and absolutises urls", () => {
    const crumbs = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Impact", path: "/impact" },
    ]);
    expect(crumbs.itemListElement[0]!.position).toBe(1);
    expect(crumbs.itemListElement[1]!.position).toBe(2);
    expect(crumbs.itemListElement[1]!.item).toMatch(/^https:\/\/.*\/impact$/);
  });
});

describe("webSiteJsonLd", () => {
  it("references the organisation", () => {
    expect(webSiteJsonLd().publisher["@id"]).toBe(organisationJsonLd()["@id"]);
  });
});