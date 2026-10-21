import { cacheLife, cacheTag } from "next/cache";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getSection } from "@/lib/data/sections";
import type { SiteSection } from "@/lib/data/types";

/**
 * FAQ entries.
 *
 * ## Where this content used to live
 *
 * `faqs` has had a full schema since migration 0007 and a working admin editor
 * at `/admin/content/faqs` with create, update, delete and toggle. The public
 * page rendered a static `FAQS` constant from `lib/data/pages.ts`, so an editor
 * adding a question saw nothing change.
 *
 * Migration 0025 moved the constant's content into the table, where the editor
 * was already writing. The constant is gone.
 */

export type FaqCategory =
  | "giving"
  | "programmes"
  | "about"
  | "safeguarding"
  | "volunteering"
  | "partnerships"
  | "general";

export type Faq = {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
};

/**
 * Every category the page can render, in the order it renders them.
 *
 * ## This must match the CHECK constraint on `faqs.category`
 *
 * Same contract as `SOCIAL_ORDER` in `components/about/social-icon.tsx`: the
 * database enforces a fixed vocabulary and this is its display side. A category
 * that exists in the constraint but not here would be **silently dropped** —
 * the page would render nothing for it and no error would be raised.
 *
 * That was a live risk before this file existed: the table allows seven
 * categories and the old page's group list had four, so `volunteering` and
 * `partnerships` entries would have vanished. The order is not alphabetical —
 * giving leads because it is what most visitors arrive for.
 */
export const FAQ_CATEGORY_ORDER: FaqCategory[] = [
  "giving",
  "programmes",
  "about",
  "safeguarding",
  "volunteering",
  "partnerships",
  "general",
];

/** Display names. A category with no entries is omitted from the page. */
export const FAQ_CATEGORY_LABEL: Record<FaqCategory, string> = {
  giving: "Giving",
  programmes: "Programmes",
  about: "About us",
  safeguarding: "Safeguarding",
  volunteering: "Volunteering",
  partnerships: "Partnerships",
  general: "General",
};

export type FaqGroup = {
  category: FaqCategory;
  label: string;
  /** Anchor id — the category key itself, so it cannot drift from the label. */
  id: string;
  entries: Faq[];
};

export type FaqRow = {
  id: string;
  question: string;
  answer: string;
  category: string;
};

/**
 * Group rows into the categories the page renders, in render order.
 *
 * Pure and exported so the ordering rule can be tested without a database. The
 * ordering is the part that can silently go wrong: a category present in the
 * database but missing from `FAQ_CATEGORY_ORDER` would simply not render, with
 * no error anywhere.
 *
 * So an unknown category is **not** dropped quietly — it is logged. A new
 * category added to the CHECK constraint without being added here will say so in
 * the server log the first time a row uses it, instead of vanishing.
 */
export function groupFaqs(rows: FaqRow[]): FaqGroup[] {
  const known = new Set<string>(FAQ_CATEGORY_ORDER);

  for (const row of rows) {
    if (!known.has(row.category)) {
      console.error(
        `[faqs] category "${row.category}" is not in FAQ_CATEGORY_ORDER, so its ` +
          `${rows.filter((r) => r.category === row.category).length} entr(ies) will not render. ` +
          `Add it to FAQ_CATEGORY_ORDER and FAQ_CATEGORY_LABEL.`,
      );
    }
  }

  return FAQ_CATEGORY_ORDER.flatMap((category) => {
    const entries = rows
      .filter((r) => r.category === category)
      .map((r) => ({
        id: r.id,
        question: r.question,
        answer: r.answer,
        category,
      }));

    return entries.length === 0
      ? []
      : [
          {
            category,
            label: FAQ_CATEGORY_LABEL[category],
            id: category,
            entries,
          },
        ];
  });
}

/**
 * Published questions, grouped and ordered.
 *
 * Grouping happens in `groupFaqs` rather than here so the page has one thing to
 * render and the ordering rule lives next to the vocabulary it depends on.
 *
 * A group with no entries is dropped. An empty category is not a gap to
 * explain — it is a category nobody has written for yet.
 */
export async function getFaqGroups(): Promise<FaqGroup[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("faqs");

  if (!isSupabaseConfigured()) return [];

  const { data, error } = await createClient()
    .from("faqs")
    .select("id, question, answer, category, sort_order")
    .eq("published", true)
    .order("sort_order");

  if (error) {
    console.error("[data] faqs query failed:", error.message);
    return [];
  }

  return groupFaqs((data ?? []) as FaqRow[]);
}

/** The page's sections, keyed. */
export async function getFaqSections(): Promise<Record<string, SiteSection>> {
  "use cache";
  cacheLife("hours");
  cacheTag("sections");

  const keys = ["faq-hero", "faq-empty", "faq-contact"];
  return Object.fromEntries(
    await Promise.all(
      keys.map(async (key) => [key, await getSection(key)] as const),
    ),
  );
}
