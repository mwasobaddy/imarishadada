import { describe, expect, it, vi } from "vitest";

import {
  FAQ_CATEGORY_LABEL,
  FAQ_CATEGORY_ORDER,
  groupFaqs,
  type FaqRow,
} from "@/lib/data/faqs";

/**
 * Written but not executed. Per .opencode/rules/testing.md the team defers suite
 * execution until the project is feature-complete.
 *
 * What this file is defending:
 *
 * 1. **The category vocabulary matches the database.** `faqs.category` is a
 *    CHECK constraint with seven values. This file lists the same seven. A
 *    category that exists in the constraint but not in `FAQ_CATEGORY_ORDER` is
 *    **silently dropped** from the page — no error, no empty state, just a
 *    question nobody can read.
 *
 *    That was a live risk before this change: the table allowed seven categories
 *    and the old page's group list had four, so `volunteering` and
 *    `partnerships` entries would have vanished the moment the page read the
 *    table.
 *
 * 2. **Order is deliberate, not incidental.** Giving leads because it is what
 *    most visitors arrive for. A test that only checked membership would not
 *    notice a reshuffle.
 */

const row = (overrides: Partial<FaqRow> = {}): FaqRow => ({
  id: "faq-1",
  question: "Do you offer monthly giving?",
  answer: "Yes.",
  category: "giving",
  ...overrides,
});

describe("FAQ_CATEGORY_ORDER", () => {
  /**
   * Mirrors the CHECK constraint on `public.faqs.category`, written out rather
   * than derived, because a constraint is not visible to TypeScript.
   *
   * If a migration adds a category, add it here too.
   */
  const CATEGORIES_ALLOWED_BY_THE_DATABASE = [
    "giving",
    "programmes",
    "about",
    "safeguarding",
    "general",
    "volunteering",
    "partnerships",
  ];

  it.each(CATEGORIES_ALLOWED_BY_THE_DATABASE)("renders %s", (category) => {
    expect(FAQ_CATEGORY_ORDER).toContain(category);
  });

  it("invents no category the database would reject", () => {
    for (const category of FAQ_CATEGORY_ORDER) {
      expect(CATEGORIES_ALLOWED_BY_THE_DATABASE).toContain(category);
    }
  });

  it("lists each category exactly once", () => {
    expect(new Set(FAQ_CATEGORY_ORDER).size).toBe(FAQ_CATEGORY_ORDER.length);
  });

  it("leads with giving", () => {
    // Not alphabetical. Most visitors arrive wanting to know how to give.
    expect(FAQ_CATEGORY_ORDER[0]).toBe("giving");
  });

  it("has a display label for every category", () => {
    for (const category of FAQ_CATEGORY_ORDER) {
      expect(FAQ_CATEGORY_LABEL[category]).toBeTruthy();
    }
  });
});

describe("groupFaqs", () => {
  it("returns nothing for no rows", () => {
    expect(groupFaqs([])).toEqual([]);
  });

  it("groups rows under their category", () => {
    const groups = groupFaqs([
      row({ id: "a", category: "giving" }),
      row({ id: "b", category: "safeguarding" }),
    ]);
    expect(groups.map((g) => g.category)).toEqual(["giving", "safeguarding"]);
  });

  it("orders groups by the declared order, not by the rows", () => {
    // Rows arrive in `sort_order`, which is editorial and independent of the
    // group order. A page whose sections reordered themselves when someone
    // edited a question would be worse than useless.
    const groups = groupFaqs([
      row({ id: "a", category: "safeguarding" }),
      row({ id: "b", category: "giving" }),
      row({ id: "c", category: "about" }),
    ]);
    expect(groups.map((g) => g.category)).toEqual(["giving", "about", "safeguarding"]);
  });

  it("omits a category with no entries", () => {
    const groups = groupFaqs([row({ category: "giving" })]);
    expect(groups.map((g) => g.category)).toEqual(["giving"]);
    expect(groups.find((g) => g.category === "volunteering")).toBeUndefined();
  });

  it("uses the category key as the anchor id", () => {
    // So the anchor cannot drift from the label. The old page slugified the
    // label ("About us" -> "about-us") which is a second place to get wrong.
    const groups = groupFaqs([row({ category: "about" })]);
    expect(groups[0]!.id).toBe("about");
    expect(groups[0]!.label).toBe("About us");
  });

  it("keeps every entry within its group", () => {
    const groups = groupFaqs([
      row({ id: "a", category: "giving" }),
      row({ id: "b", category: "giving" }),
      row({ id: "c", category: "about" }),
    ]);
    expect(groups.find((g) => g.category === "giving")!.entries).toHaveLength(2);
    expect(groups.find((g) => g.category === "about")!.entries).toHaveLength(1);
  });

  it("drops a category the page does not know, and says so", () => {
    // The failure mode this guards. It must not be silent: a new category in
    // the CHECK constraint without a matching entry here would make questions
    // unreadable with nothing to notice.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const groups = groupFaqs([row({ category: "recycling" })]);

    expect(groups).toEqual([]);
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0]![0]).toContain("recycling");

    spy.mockRestore();
  });
});
