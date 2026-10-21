import { describe, expect, it } from "vitest";

import {
  ALL_SECTION_FIELDS,
  SECTION_FIELDS,
  fieldsFor,
} from "@/lib/admin/section-fields";
import { EXACT_SECTION_KEYS } from "@/components/admin/section-preview-registry";

/**
 * Written but not executed. Per .opencode/rules/testing.md the team defers
 * suite execution until the project is feature-complete.
 *
 * ## What this pins
 *
 * The editor shows a section only the fields its page reads. That list is
 * hand-written, because it is a reading of each component, and a hand-written
 * list drifts: a new section is previewed without anyone deciding what an
 * editor may type into it.
 *
 * So the two lists are pinned to each other. A section that can be previewed
 * must have a field list, and a field list may only name fields that exist.
 */
describe("the section field map", () => {
  it("covers every section the editor can preview", () => {
    const missing = [...EXACT_SECTION_KEYS].filter(
      (key) => !SECTION_FIELDS[key],
    );

    expect(
      missing,
      "these sections can be previewed but have no field list, so the editor would show fields the page never reads",
    ).toEqual([]);
  });

  it("names only fields that exist", () => {
    for (const [key, fields] of Object.entries(SECTION_FIELDS)) {
      for (const field of fields) {
        expect(
          ALL_SECTION_FIELDS,
          `${key} names an unknown field: ${field}`,
        ).toContain(field);
      }
    }
  });

  it("always reads a heading", () => {
    // A section with no heading renders an empty element in the outline.
    for (const [key, fields] of Object.entries(SECTION_FIELDS)) {
      expect(fields, `${key} has no heading field`).toContain("heading");
    }
  });

  it("falls back to every field for a section it does not know", () => {
    expect(fieldsFor("a-section-that-does-not-exist")).toEqual(
      ALL_SECTION_FIELDS,
    );
  });
});

describe("the fields each section reads", () => {
  it("does not offer the hero a label above the heading", () => {
    // The hero prints its own label — ":: KIBERA, NAIROBI ::".
    expect(fieldsFor("home-hero")).not.toContain("eyebrow");
    expect(fieldsFor("home-hero")).toContain("image");
    expect(fieldsFor("home-hero")).toContain("stat_line");
  });

  it("does not offer the six core values a paragraph they never read", () => {
    // The values come from their own table; the section is the heading.
    expect(fieldsFor("about-values")).toEqual(["eyebrow", "heading"]);
  });

  it("does not offer the featured story a paragraph", () => {
    // The page renders the heading above the card, and nothing else.
    expect(fieldsFor("stories-featured")).toEqual(["heading"]);
  });

  it("offers the quote a label and a heading, and nothing else", () => {
    expect(fieldsFor("about-quote")).toEqual(["eyebrow", "heading"]);
    expect(fieldsFor("dada-quote")).toEqual(["eyebrow", "heading"]);
  });

  it("offers the gallery its photographs and its caption", () => {
    expect(fieldsFor("about-carousel")).toContain("images");
    expect(fieldsFor("about-carousel")).toContain("body");
  });

  it("offers a section with a list its steps", () => {
    expect(fieldsFor("programmes-pathway")).toContain("steps");
    expect(fieldsFor("volunteer-safeguarding")).toContain("steps");
    expect(fieldsFor("contact-faqs")).toContain("steps");
  });

  it("does not offer a second button to a section with one button", () => {
    expect(fieldsFor("about-story")).not.toContain("cta");
    expect(fieldsFor("about-story")).not.toContain("cta_secondary");
    expect(fieldsFor("home-hero")).toContain("cta_secondary");
  });
});
