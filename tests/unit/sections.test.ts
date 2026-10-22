import { describe, expect, it } from "vitest";

import { SECTION_SELECT, isVisible } from "@/lib/data/sections";
import { resolveProgrammeImage } from "@/lib/data/programme-images";
import type { SiteSection } from "@/lib/data/types";

/**
 * Written but not executed. Per .opencode/rules/testing.md the team defers suite
 * execution until the project is feature-complete — a passing build here is not
 * evidence these pass. Run with `npm test` when the gate is lifted.
 *
 * What this file is defending:
 *
 * 1. A column missing from `SECTION_SELECT` does not fail loudly. PostgREST
 *    returns `undefined`, the mapper falls back to the code copy, and for
 *    `active` the section resolves as hidden. That shipped once: every section
 *    on every migrated page vanished and `npm run build` was green.
 *
 * 2. A hidden section must not fall back to the hardcoded copy. It used to,
 *    because the query filtered on `active` and a hidden row was
 *    indistinguishable from a missing one — so "Hide section" restored the code
 *    default instead of removing the section.
 *
 * 3. `programmes.image_path` is the only source of a programme's photograph.
 *    A `PROGRAMME_IMAGE_FALLBACK` map used to override an empty column, which
 *    meant clearing an image revealed a different one.
 */

const section = (overrides: Partial<SiteSection> = {}): SiteSection => ({
  key: "test-section",
  eyebrow: null,
  heading: "A heading",
  body: null,
  ctaLabel: null,
  ctaHref: null,
  active: true,
  ...overrides,
});

describe("SECTION_SELECT", () => {
  /**
   * The list is written out rather than derived from `SectionRow`, because
   * `SectionRow` is a type and does not exist at runtime. If a field is added
   * to the mapper, add it here too.
   */
  const COLUMNS_READ_BY_THE_MAPPER = [
    "section_key",
    "eyebrow",
    "heading",
    "body",
    "cta_label",
    "cta_href",
    "cta_secondary_label",
    "cta_secondary_href",
    "stat_line",
    "body_secondary",
    "steps",
    "images",
    "image_path",
    "image_alt",
    "active",
  ];

  it.each(COLUMNS_READ_BY_THE_MAPPER)("selects %s", (column) => {
    expect(SECTION_SELECT).toContain(column);
  });

  it("never selects every column", () => {
    // The project rules forbid `select("*")`. This is a narrow, auditable list.
    expect(SECTION_SELECT).not.toContain("*");
  });
});

describe("isVisible", () => {
  it("shows a section the editor has switched on", () => {
    expect(isVisible(section({ active: true }))).toBe(true);
  });

  it("hides a section the editor has switched off", () => {
    // The whole point: off means off, not "revert to the copy in code".
    expect(isVisible(section({ active: false }))).toBe(false);
  });

  it("hides a section that is absent", () => {
    expect(isVisible(undefined)).toBe(false);
    expect(isVisible(null)).toBe(false);
  });

  it("hides a section with an empty heading", () => {
    // `hidden()` produces an empty heading. A section that renders nothing
    // visible should not be treated as visible.
    expect(isVisible(section({ heading: "", active: false }))).toBe(false);
  });
});

describe("resolveProgrammeImage", () => {
  it("returns the database path and alt", () => {
    expect(
      resolveProgrammeImage(
        "school-reentry",
        "/images/programmes/re-entry/re-entry-mother-writing.webp",
        "A young mother writing during a session",
      ),
    ).toEqual({
      imagePath: "/images/programmes/re-entry/re-entry-mother-writing.webp",
      imageAlt: "A young mother writing during a session",
    });
  });

  it("returns null when the column is empty, whatever the slug", () => {
    // This is the behaviour the deleted fallback map broke. An empty path must
    // mean "no photograph", so the card renders its brand-tinted field.
    for (const slug of ["school-reentry", "economic-empowerment", "dada-space"]) {
      expect(resolveProgrammeImage(slug, null, null)).toEqual({
        imagePath: null,
        imageAlt: null,
      });
    }
  });

  it("treats whitespace as empty", () => {
    expect(resolveProgrammeImage("dada-space", "   ", "  ")).toEqual({
      imagePath: null,
      imageAlt: null,
    });
  });

  it("does not invent alt text for an image", () => {
    // An image without alt is rejected at the database
    // (`programmes_alt_required_with_image`). If one slips through, the
    // consumer must decide — this must not silently supply a filename.
    expect(
      resolveProgrammeImage("dada-space", "/images/x.webp", null).imageAlt,
    ).toBeNull();
  });
});
