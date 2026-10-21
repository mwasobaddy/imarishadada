import { describe, expect, it } from "vitest";

import { fillTemplate, titleLeaksName, truncateExcerpt } from "@/lib/stories/copy";

/**
 * Written but not executed. Per .opencode/rules/testing.md the team defers suite
 * execution until the project is feature-complete — a passing build here is not
 * evidence these pass. Run with `npm test` when the gate is lifted.
 *
 * What this file is defending:
 *
 * 1. Excerpts are truncated in the **data layer**. The roadmap is explicit that
 *    CSS `line-clamp` alone leaves the full testimony in the DOM, indexed twice
 *    under two URLs.
 *
 * 2. An anonymised story must never carry the participant's name in its title.
 *    Nothing enforced that before: the tier withholds the attribution and knows
 *    nothing about the title, so "Amina's story" could publish as anonymised
 *    with her name in the search result.
 */

describe("truncateExcerpt", () => {
  it("leaves a short excerpt exactly as written", () => {
    expect(truncateExcerpt("She went back at nineteen.", 30)).toBe(
      "She went back at nineteen.",
    );
  });

  it("cuts on a word boundary and marks the cut", () => {
    const long = "one two three four five six seven eight";
    expect(truncateExcerpt(long, 4)).toBe("one two three four…");
  });

  it("does not cut mid-word", () => {
    // A character cut would produce "th…" here, which reads as a bug.
    const result = truncateExcerpt("extraordinary circumstances", 1);
    expect(result).toBe("extraordinary…");
  });

  it("treats an excerpt of exactly the limit as complete", () => {
    expect(truncateExcerpt("one two three", 3)).toBe("one two three");
  });

  it("collapses newlines and runs of whitespace", () => {
    // An excerpt is one line. A raw "\n\n" from the admin textarea would
    // otherwise survive into the card.
    expect(truncateExcerpt("first line\n\nsecond   line", 30)).toBe(
      "first line second line",
    );
  });

  it("returns an empty string for whitespace only", () => {
    expect(truncateExcerpt("   \n  ", 30)).toBe("");
  });
});

describe("fillTemplate", () => {
  it("fills a known token", () => {
    expect(fillTemplate("{name} has given permission.", { name: "Amina" })).toBe(
      "Amina has given permission.",
    );
  });

  it("fills every occurrence", () => {
    expect(fillTemplate("{name} and {name} again", { name: "Grace" })).toBe(
      "Grace and Grace again",
    );
  });

  it("leaves an unknown token visible rather than blanking it", () => {
    // Blanking produces " has given written permission", which reads as a
    // finished sentence and ships. A visible `{nmae}` is caught in review.
    expect(fillTemplate("{nmae} has given permission.", { name: "Amina" })).toBe(
      "{nmae} has given permission.",
    );
  });

  it("leaves a token with no value visible", () => {
    expect(fillTemplate("This is one of {period}.", { period: null })).toBe(
      "This is one of {period}.",
    );
  });

  it("leaves a token with an empty value visible", () => {
    expect(fillTemplate("This is one of {period}.", { period: "   " })).toBe(
      "This is one of {period}.",
    );
  });
});

describe("titleLeaksName", () => {
  it("catches the name in a possessive title", () => {
    // The exact mistake this exists to stop.
    expect(titleLeaksName("Amina's story", "Amina, 19 · Kibera")).toBe(true);
  });

  it("catches the name anywhere in the title", () => {
    expect(titleLeaksName("How Amina went back to school", "Amina")).toBe(true);
  });

  it("catches a two-part name on either part", () => {
    expect(titleLeaksName("Amina Wanjiku went back", "Amina Wanjiku")).toBe(true);
    expect(titleLeaksName("Wanjiku went back", "Amina Wanjiku")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(titleLeaksName("AMINA went back", "Amina")).toBe(true);
  });

  it("ignores punctuation in either string", () => {
    expect(titleLeaksName("Amina's story", "Amina,")).toBe(true);
  });

  it("allows a title that does not name her", () => {
    expect(titleLeaksName("Three months of walking past the gate", "Amina, 19")).toBe(
      false,
    );
  });

  it("does not fire on a place name", () => {
    // "Kibera" is in almost every attribution and in many titles, and it
    // identifies nobody. Matching it would reject good titles.
    expect(titleLeaksName("A story from Kibera", "Amina, 19 · Kibera")).toBe(false);
  });

  it("does not fire when no attribution was recorded", () => {
    // Nothing to compare against. The runtime defence — anonymised metadata
    // never uses the story's title at all — is what covers this case.
    expect(titleLeaksName("Amina's story", null)).toBe(false);
    expect(titleLeaksName("Amina's story", "")).toBe(false);
  });

  it("does not fire on an empty title", () => {
    expect(titleLeaksName("", "Amina")).toBe(false);
  });

  it("does not match a short fragment of a name", () => {
    // Two-letter tokens are initials and match too much to be useful.
    expect(titleLeaksName("An inspiring story", "Al, 19")).toBe(false);
  });
});
