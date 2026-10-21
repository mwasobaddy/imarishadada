import { describe, expect, it } from "vitest";

import { coverAltBlocker, pageFrom, publishBlocker, readingMinutes } from "@/lib/news/rules";

/**
 * Written but not executed. Per .opencode/rules/testing.md the team defers suite
 * execution until the project is feature-complete.
 *
 * These are the gates on a post. A cover without a description and a published
 * post with no excerpt would both reach the public page, so each is pinned here.
 */

const complete = {
  title: "Girls return to school in Kibera",
  excerpt: "Twelve girls started the term.",
  body: "The first paragraph.\n\nThe second.",
  cover_path: null,
  cover_alt: null,
};

describe("coverAltBlocker", () => {
  it("allows a post with no cover", () => {
    expect(coverAltBlocker({ cover_path: null, cover_alt: null })).toBeNull();
  });

  it("blocks a cover with no description", () => {
    expect(coverAltBlocker({ cover_path: "/images/a.jpg", cover_alt: "" })).not.toBeNull();
    expect(coverAltBlocker({ cover_path: "/images/a.jpg", cover_alt: "   " })).not.toBeNull();
    expect(coverAltBlocker({ cover_path: "/images/a.jpg", cover_alt: null })).not.toBeNull();
  });

  it("allows a cover with a description", () => {
    expect(coverAltBlocker({ cover_path: "/images/a.jpg", cover_alt: "Girls in a classroom" })).toBeNull();
  });

  it("ignores a field an update does not include", () => {
    expect(coverAltBlocker({})).toBeNull();
  });
});

describe("publishBlocker", () => {
  it("allows a complete post", () => {
    expect(publishBlocker(complete)).toBeNull();
  });

  it.each([
    ["title", { title: "" }],
    ["excerpt", { excerpt: "   " }],
    ["body", { body: "" }],
  ])("blocks a post with no %s", (_field, patch) => {
    const reason = publishBlocker({ ...complete, ...patch });
    expect(reason).toMatch(/before it can be published/);
  });

  it("names every missing field, not just the first", () => {
    const reason = publishBlocker({ ...complete, title: "", excerpt: "" });
    expect(reason).toMatch(/a title, an excerpt/);
  });

  it("applies the cover description rule to a publish too", () => {
    const reason = publishBlocker({ ...complete, cover_path: "/images/a.jpg", cover_alt: null });
    expect(reason).toMatch(/alt text/);
  });
});

describe("pageFrom", () => {
  const row = (i: number) => ({ id: i, publishedAt: `2026-10-${String(30 - i).padStart(2, "0")}T00:00:00Z` });

  it("returns no cursor when everything fits on the page", () => {
    const rows = [row(0), row(1)];
    expect(pageFrom(rows, 12)).toEqual({ posts: rows, nextCursor: null });
  });

  it("returns a cursor when there is one more row than the page holds", () => {
    // The reader fetches limit + 1. The extra row proves another page exists.
    const rows = [row(0), row(1), row(2)];
    const result = pageFrom(rows, 2);
    expect(result.posts).toEqual([row(0), row(1)]);
    expect(result.nextCursor).toBe(row(1).publishedAt);
  });

  it("does not return the extra row", () => {
    const result = pageFrom([row(0), row(1), row(2)], 2);
    expect(result.posts).toHaveLength(2);
  });
});

describe("readingMinutes", () => {
  it("is at least one minute, even for a short post", () => {
    expect(readingMinutes("Short.")).toBe(1);
  });

  it("counts roughly 200 words a minute", () => {
    const words = Array.from({ length: 600 }, () => "word").join(" ");
    expect(readingMinutes(words)).toBe(3);
  });
});
