import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StoryCardItem } from "@/components/stories/story-card";
import type { StoryCard } from "@/lib/data/impact";

/**
 * Written but not executed. Per .opencode/rules/testing.md the team defers suite
 * execution until the project is feature-complete.
 *
 * This is the safeguarding test for the archive. The roadmap's requirement is
 * not "we will not set the image" — it is that a `named_no_face` or
 * `anonymised` card **must not have an image element at all**. A `<img>` hidden
 * with CSS, or `loading="lazy"` on a hidden element, still downloads the file.
 *
 * So the assertion is on the DOM, and the fixtures deliberately pass a
 * populated `imagePath` for tiers that must not use it. If the component ever
 * trusts `imagePath` alone, these fail.
 */

// `next/image` resolves to a plain <img> here; the point is whether an element
// exists at all, not how it is optimised.
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img data-testid="story-photo" {...props} />;
  },
}));

const base: StoryCard = {
  slug: "she-went-back",
  title: "She went back at nineteen",
  excerpt: "Her first year ended when she got pregnant.",
  excerptFromQuote: false,
  quote: "Before Dada Space I was hiding my pregnancy from everyone.",
  attribution: "Amina, 19 · Kibera",
  consentTier: "named_full",
  imagePath: "/images/consent/amina.webp",
  imageAlt: "Amina writing at a desk during a session",
  programmeSlug: "school-reentry",
  programmeTitle: "School Re-entry",
  readingMinutes: 4,
  featured: false,
  publishedAt: "2026-04-12T00:00:00.000Z",
};

function renderCard(overrides: Partial<StoryCard>) {
  return render(
    <ul>
      <StoryCardItem story={{ ...base, ...overrides }} />
    </ul>,
  );
}

describe("StoryCardItem — consent tiers", () => {
  it("renders the photograph for named_full", () => {
    renderCard({ consentTier: "named_full" });
    expect(screen.getByTestId("story-photo")).toBeInTheDocument();
  });

  it("renders no image element for named_no_face, even when a path is set", () => {
    renderCard({ consentTier: "named_no_face", imagePath: "/images/consent/amina.webp" });
    expect(screen.queryByTestId("story-photo")).not.toBeInTheDocument();
  });

  it("renders no image element for anonymised, even when a path is set", () => {
    renderCard({ consentTier: "anonymised", imagePath: "/images/consent/amina.webp" });
    expect(screen.queryByTestId("story-photo")).not.toBeInTheDocument();
  });

  it("renders the name for named_no_face", () => {
    renderCard({ consentTier: "named_no_face", imagePath: null });
    expect(screen.getByText(/Amina, 19/)).toBeInTheDocument();
  });

  it("renders no name for anonymised", () => {
    renderCard({ consentTier: "anonymised", imagePath: null, attribution: null });
    expect(screen.queryByText(/Amina/)).not.toBeInTheDocument();
    expect(screen.getByText(/Name withheld at her request/)).toBeInTheDocument();
  });

  it("explains the withheld photograph rather than leaving a gap", () => {
    renderCard({ consentTier: "named_no_face", imagePath: null });
    expect(screen.getByText(/Photograph not published/)).toBeInTheDocument();
  });

  it("explains the withheld name and photograph for anonymised", () => {
    renderCard({ consentTier: "anonymised", imagePath: null, attribution: null });
    expect(screen.getByText(/withheld at her request/)).toBeInTheDocument();
  });
});

describe("StoryCardItem — content", () => {
  it("leads with the title, not the quote", () => {
    renderCard({});
    expect(
      screen.getByRole("heading", { name: "She went back at nineteen" }),
    ).toBeInTheDocument();
  });

  it("falls back to a neutral title when the story has none", () => {
    renderCard({ title: "" });
    expect(
      screen.getByRole("heading", { name: "A story from Kibera" }),
    ).toBeInTheDocument();
  });

  it("does not print the quote twice on a words-only card", () => {
    // The quote is already the visual on a no-image card. When the excerpt is
    // the quote, printing it again as the dek is the same sentence twice.
    renderCard({
      consentTier: "anonymised",
      imagePath: null,
      attribution: null,
      excerptFromQuote: true,
      excerpt: base.quote,
    });
    expect(screen.getAllByText(/hiding my pregnancy/)).toHaveLength(1);
  });

  it("shows a real excerpt alongside the quote", () => {
    renderCard({ consentTier: "anonymised", imagePath: null, attribution: null });
    expect(screen.getByText(/Her first year ended/)).toBeInTheDocument();
  });
});
