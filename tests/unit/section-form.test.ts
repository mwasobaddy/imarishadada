import { describe, expect, it } from "vitest";

import {
  discardChanges,
  isDirty,
  previewHeading,
  previewKind,
  searchPreview,
  sectionLabel,
  sectionWarnings,
  stepsAreQuestions,
  toPatch,
  toSectionForm,
  truncate,
  SEO_TITLE_MAX,
  SEO_DESCRIPTION_MAX,
  type SectionForm,
  type SectionRow,
} from "@/lib/admin/section-form";

/**
 * Written but not executed. Per .opencode/rules/testing.md the team defers suite
 * execution until the project is feature-complete.
 *
 * These are the rules the page editor relies on. Each warning here mirrors a
 * write the server would reject or a page defect a reader would see, so a
 * regression in this file means the editor promises a clean save and then fails.
 */

function form(overrides: Partial<SectionForm> = {}): SectionForm {
  return {
    section_key: "home-hero",
    page_key: "home",
    sort_order: 1,
    active: true,
    eyebrow: "Our work",
    heading: "A heading",
    body: "A paragraph.",
    body_secondary: null,
    stat_line: null,
    cta_label: "Donate",
    cta_href: "/donate",
    cta_secondary_label: "",
    cta_secondary_href: "",
    steps: null,
    images: null,
    image_path: "",
    image_alt: "",
    seo_title: "",
    seo_description: "",
    ...overrides,
  };
}

describe("toSectionForm", () => {
  it("turns null text into empty strings so the inputs stay controlled", () => {
    const row: SectionRow = {
      section_key: "home-hero",
      page_key: "home",
      sort_order: 1,
      active: true,
      eyebrow: null,
      heading: "Heading",
      body: null,
      body_secondary: null,
      stat_line: null,
      cta_label: null,
      cta_href: null,
      cta_secondary_label: null,
      cta_secondary_href: null,
      steps: null,
      images: null,
      image_path: null,
      image_alt: null,
      seo_title: null,
      seo_description: null,
    };

    const result = toSectionForm(row);
    expect(result.eyebrow).toBe("");
    expect(result.cta_label).toBe("");
    expect(result.body_secondary).toBeNull();
    expect(result.steps).toBeNull();
  });

  it("keeps the difference between a missing field and an empty one", () => {
    const result = toSectionForm({
      ...toRow(form()),
      body_secondary: "",
      stat_line: null,
    });
    expect(result.body_secondary).toBe("");
    expect(result.stat_line).toBeNull();
  });

  it("normalises JSON columns without trusting their shape", () => {
    const result = toSectionForm({
      ...toRow(form()),
      steps: [{ title: "One" }, null, "nonsense"],
      images: [{ path: "/images/a.avif", alt: "A", caption: "C" }],
    });

    expect(result.steps).toEqual([
      { title: "One", description: "" },
      { title: "", description: "" },
      { title: "", description: "" },
    ]);
    expect(result.images).toEqual([
      { path: "/images/a.avif", alt: "A", caption: "C" },
    ]);
  });

  it("rejects a JSON column that is not an array", () => {
    const result = toSectionForm({ ...toRow(form()), steps: { title: "x" }, images: "x" });
    expect(result.steps).toBeNull();
    expect(result.images).toBeNull();
  });
});

describe("toPatch", () => {
  it("sends blank text as null, not an empty string", () => {
    const patch = toPatch(form({ eyebrow: "  ", body: "", cta_secondary_label: "" }));
    expect(patch.eyebrow).toBeNull();
    expect(patch.body).toBeNull();
    expect(patch.cta_secondary_label).toBeNull();
  });

  it("sends an empty list as null so a cleared gallery is stored as cleared", () => {
    const patch = toPatch(form({ steps: [], images: [] }));
    expect(patch.steps).toBeNull();
    expect(patch.images).toBeNull();
  });

  it("keeps the content of steps and drops a blank caption", () => {
    const patch = toPatch(
      form({
        steps: [{ title: "Enrol", description: "She signs up." }],
        images: [{ path: "/images/a.avif", alt: "A", caption: "  " }],
      }),
    );
    expect(patch.steps).toEqual([{ title: "Enrol", description: "She signs up." }]);
    expect(patch.images).toEqual([{ path: "/images/a.avif", alt: "A" }]);
  });

  it("sends every field the public page can render, so nothing is silently dropped", () => {
    const patch = toPatch(form());
    expect(Object.keys(patch).sort()).toEqual(
      [
        "body",
        "body_secondary",
        "cta_href",
        "cta_label",
        "cta_secondary_href",
        "cta_secondary_label",
        "eyebrow",
        "heading",
        "image_alt",
        "image_path",
        "images",
        "seo_description",
        "seo_title",
        "stat_line",
        "steps",
      ].sort(),
    );
  });
});

describe("isDirty", () => {
  it("is false for an untouched form", () => {
    expect(isDirty(form(), form())).toBe(false);
  });

  it.each([
    ["heading", { heading: "Changed" }],
    ["body_secondary", { body_secondary: "" }],
    ["steps", { steps: [{ title: "One", description: "" }] }],
    ["images", { images: [{ path: "/images/a.avif", alt: "A", caption: "" }] }],
    ["seo_title", { seo_title: "A title" }],
  ])("detects a change to %s", (_name, patch) => {
    expect(isDirty(form(patch), form())).toBe(true);
  });

  it("ignores the visibility flag, which has its own action", () => {
    expect(isDirty(form({ active: false }), form({ active: true }))).toBe(false);
  });

  it("detects a change inside an array of steps", () => {
    const saved = form({ steps: [{ title: "One", description: "First" }] });
    const edited = form({ steps: [{ title: "One", description: "Second" }] });
    expect(isDirty(edited, saved)).toBe(true);
  });
});

describe("discardChanges", () => {
  it("returns the saved values without sharing array references", () => {
    const saved = form({
      steps: [{ title: "One", description: "First" }],
      images: [{ path: "/images/a.avif", alt: "A", caption: "" }],
    });
    const copy = discardChanges(saved);

    expect(copy).toEqual(saved);
    expect(copy.steps).not.toBe(saved.steps);
    expect(copy.images).not.toBe(saved.images);
  });
});

describe("sectionWarnings", () => {
  it("is empty for a complete section", () => {
    expect(sectionWarnings(form())).toEqual([]);
  });

  it("asks for a heading", () => {
    expect(sectionWarnings(form({ heading: "   " }))).toContain(
      "Add a heading. The page outline needs one.",
    );
  });

  it("asks for alt text when a single image is set", () => {
    const messages = sectionWarnings(form({ image_path: "/images/a.avif" }));
    expect(messages.some((m) => m.includes("Describe the image"))).toBe(true);
  });

  it("does not ask for alt text when there is no image", () => {
    expect(sectionWarnings(form({ image_path: "", image_alt: "" }))).toEqual([]);
  });

  it("names a photograph with no image and one with no description", () => {
    const messages = sectionWarnings(
      form({
        images: [
          { path: "", alt: "", caption: "" },
          { path: "/images/b.avif", alt: "", caption: "" },
          { path: "/images/c.avif", alt: "C", caption: "" },
        ],
      }),
    );
    expect(messages).toContain("Photograph 1 has no image selected. Add one, or remove the row.");
    expect(messages).toContain("Photograph 2 has no description. Add one, or remove the row.");
    expect(messages.some((m) => m.startsWith("Photograph 3"))).toBe(false);
  });

  it("names a step with no title", () => {
    const messages = sectionWarnings(
      form({ steps: [{ title: "Enrol", description: "" }, { title: " ", description: "x" }] }),
    );
    expect(messages).toContain("Step 2 needs a title. Remove the row or fill it in.");
  });

  it("catches a button with text and no link, and the reverse", () => {
    expect(sectionWarnings(form({ cta_href: "" }))).toContain(
      "The main button has text but no link, so it does nothing.",
    );
    expect(sectionWarnings(form({ cta_label: "" }))).toContain(
      "The main button has a link but no text, so it will not be shown.",
    );
    expect(
      sectionWarnings(form({ cta_secondary_label: "More", cta_secondary_href: "" })),
    ).toContain("The second button has text but no link, so it does nothing.");
  });

  it("leaves a section with no buttons alone", () => {
    expect(
      sectionWarnings(form({ cta_label: "", cta_href: "", cta_secondary_label: "", cta_secondary_href: "" })),
    ).toEqual([]);
  });

  it("warns about a search title outside the target range, either way", () => {
    expect(sectionWarnings(form({ seo_title: "Short" }))[0]).toMatch(/Aim for 50–60/);
    expect(sectionWarnings(form({ seo_title: "x".repeat(SEO_TITLE_MAX + 5) }))[0]).toMatch(
      /cut off around 60/,
    );
    expect(sectionWarnings(form({ seo_title: "" }))).toEqual([]);
  });

  it("warns about a search description outside the target range", () => {
    expect(sectionWarnings(form({ seo_description: "Too short" }))[0]).toMatch(
      /Aim for 140–160/,
    );
  });
});

describe("previewKind", () => {
  it("uses the masthead for a hero", () => {
    expect(previewKind(form({ section_key: "about-hero" }))).toBe("hero");
  });

  it("prefers a gallery over steps when a section has both", () => {
    expect(
      previewKind(
        form({
          section_key: "about-carousel",
          images: [{ path: "/images/a.avif", alt: "A", caption: "" }],
          steps: [{ title: "One", description: "" }],
        }),
      ),
    ).toBe("gallery");
  });

  it("uses steps when there are steps", () => {
    expect(
      previewKind(form({ section_key: "programmes-pathway", steps: [{ title: "One", description: "" }] })),
    ).toBe("steps");
  });

  it("falls back to a copy block", () => {
    expect(previewKind(form({ section_key: "about-story" }))).toBe("copy");
  });
});

describe("labels and placeholders", () => {
  it("falls back to a readable label rather than a raw key", () => {
    expect(sectionLabel(form({ heading: "  " }))).toBe("Untitled section");
    expect(sectionLabel(form({ heading: " Our work " }))).toBe("Our work");
  });

  it("shows a placeholder only when the heading is blank", () => {
    expect(previewHeading(form({ heading: "" }))).toBe("Your heading appears here");
    expect(previewHeading(form({ heading: "Real" }))).toBe("Real");
  });

  it("treats the contact FAQ steps as questions, not stages", () => {
    expect(stepsAreQuestions(form({ section_key: "contact-faqs" }))).toBe(true);
    expect(stepsAreQuestions(form({ section_key: "programmes-pathway" }))).toBe(false);
  });
});

describe("truncate", () => {
  it("leaves a short string alone", () => {
    expect(truncate("Short", 20)).toBe("Short");
  });

  it("cuts on a word boundary and marks the cut", () => {
    expect(truncate("one two three four five", 12)).toBe("one two…");
  });

  it("collapses whitespace first", () => {
    expect(truncate("  one\n\n two  ", 50)).toBe("one two");
  });
});

describe("searchPreview", () => {
  it("falls back to the heading and paragraph when no metadata is set", () => {
    const preview = searchPreview(form({ seo_title: "", seo_description: "" }));
    expect(preview.title).toBe("A heading");
    expect(preview.description).toBe("A paragraph.");
  });

  it("uses the metadata when it is set", () => {
    const preview = searchPreview(form({ seo_title: "Custom", seo_description: "Custom copy" }));
    expect(preview).toEqual({ title: "Custom", description: "Custom copy" });
  });

  it("shows what search would truncate", () => {
    const preview = searchPreview(form({ seo_description: "word ".repeat(60) }));
    expect(preview.description.length).toBeLessThanOrEqual(SEO_DESCRIPTION_MAX);
    expect(preview.description.endsWith("…")).toBe(true);
  });
});

/** A form converted back to a row, for the normalisation tests. */
function toRow(source: SectionForm): SectionRow {
  return {
    ...source,
    eyebrow: source.eyebrow || null,
    body: source.body || null,
    cta_label: source.cta_label || null,
    cta_href: source.cta_href || null,
    cta_secondary_label: source.cta_secondary_label || null,
    cta_secondary_href: source.cta_secondary_href || null,
    image_path: source.image_path || null,
    image_alt: source.image_alt || null,
    seo_title: source.seo_title || null,
    seo_description: source.seo_description || null,
  };
}
