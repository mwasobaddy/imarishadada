import { cacheLife, cacheTag } from "next/cache";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getSection } from "@/lib/data/sections";
import { effectiveConsentTier, type ConsentTier, type SiteSection } from "@/lib/data/types";
import { truncateExcerpt } from "@/lib/stories/copy";

/**
 * Impact and stories data.
 *
 * Stories carry the highest safeguarding sensitivity on the site: minors and
 * young mothers. Consent is resolved here, server-side, and the tier is NEVER
 * exposed as an "is this allowed to show a face" flag the client could ignore —
 * the resolved story simply has no image and no attribution when the tier
 * forbids them, so there is nothing to leak.
 */

export type ConsentTierCounts = Record<ConsentTier, number>;

export type StoryCard = {
  slug: string;
  /** The story's own headline. Never the slug turned into words. */
  title: string;
  /**
   * The dek shown under the title.
   *
   * Falls back to the quote when the editor left `excerpt` blank, so a card is
   * never a title with nothing under it.
   */
  excerpt: string;
  /** True when `excerpt` is the quote, so a words-only card can avoid printing it twice. */
  excerptFromQuote: boolean;
  quote: string;
  attribution: string | null;
  consentTier: ConsentTier;
  imagePath: string | null;
  /**
   * Alt text for the photograph.
   *
   * Null for every tier that cannot show a face, and null for a `named_full`
   * story whose editor has not written one yet — the constraint on `stories`
   * only permits the latter for rows written before it existed.
   */
  imageAlt: string | null;
  programmeSlug: string | null;
  programmeTitle: string | null;
  readingMinutes: number | null;
  featured: boolean;
  publishedAt: string;
};

/** A card plus the story itself. Fetched only on `/stories/[slug]`. */
export type StoryDetail = StoryCard & {
  /** The story, as the editor wrote it. Paragraphs are separated by blank lines. */
  body: string;
};

/** Fallback so the page renders before Supabase is configured. */
const SEED_STORIES: StoryCard[] = [];

/**
 * The columns a card needs.
 *
 * `body` is deliberately absent: the index and the grid never render it, and
 * pulling a full testimony onto a page that shows two lines of it is exactly
 * the over-fetch the project rules forbid.
 */
const CARD_SELECT =
  "slug, title, excerpt, quote, attribution, consent_tier, consent_expires_at, image_path, image_alt, reading_minutes, featured, published_at, programmes(slug,title)";

/**
 * Resolve one row into a card.
 *
 * ## The consent branch is here, not in the component
 *
 * `attribution` and `imagePath` are resolved server-side, so a card for a tier
 * that cannot show a face receives no image path at all. There is no flag the
 * component could get wrong, and no `<img>` with a `hidden` class quietly
 * downloading a photograph of a minor.
 *
 * ## The title is kept, the attribution is not
 *
 * An `anonymised` story still has a title. Withholding it would leave the card
 * with nothing to lead on. The gate that keeps a name out of that title lives
 * in the admin action (`titleLeaksName`) and the metadata layer does not use an
 * anonymised title at all — see `app/[locale]/(site)/stories/[slug]/page.tsx`.
 */
function toStoryCard(row: Record<string, unknown>): StoryCard {
  const tier = effectiveConsentTier(
    row.consent_tier as ConsentTier,
    (row.consent_expires_at as string | null) ?? null,
  );

  const linked = row.programmes as unknown;
  const programme = Array.isArray(linked)
    ? (linked[0] as { slug?: string; title?: string } | undefined)
    : (linked as { slug?: string; title?: string } | null);

  const quote = ((row.quote as string | null) ?? "").trim();
  const rawExcerpt = ((row.excerpt as string | null) ?? "").trim();

  // Truncated here rather than with `line-clamp`, so the full text exists only
  // on the story's own page and is not indexed twice.
  const excerpt = truncateExcerpt(rawExcerpt || quote, 30);

  return {
    slug: row.slug as string,
    title: ((row.title as string | null) ?? "").trim(),
    excerpt,
    excerptFromQuote: !rawExcerpt,
    quote,
    // Anonymised must not leak a name, not even an initial.
    attribution: tier === "anonymised" ? null : ((row.attribution as string | null) ?? null),
    consentTier: tier,
    // Only `named_full` may resolve an image.
    imagePath: tier === "named_full" ? ((row.image_path as string | null) ?? null) : null,
    imageAlt: tier === "named_full" ? ((row.image_alt as string | null) ?? null) : null,
    programmeSlug: programme?.slug ?? null,
    programmeTitle: programme?.title ?? null,
    readingMinutes: (row.reading_minutes as number | null) ?? null,
    featured: (row.featured as boolean) ?? false,
    publishedAt: row.published_at as string,
  };
}

/**
 * Published stories, newest first, optionally for one programme.
 *
 * Future-dated rows are filtered by RLS (`stories_anon_read`), not by a
 * client-side `new Date()` — which is an unstable value under `cacheComponents`
 * and fails the prerender.
 */
export async function getStories(programmeSlug?: string): Promise<StoryCard[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("stories");

  if (!isSupabaseConfigured()) {
    return programmeSlug ? [] : SEED_STORIES;
  }

  const query = createClient()
    .from("stories")
    .select(CARD_SELECT)
    .eq("published", true)
    .order("published_at", { ascending: false });

  const { data, error } = programmeSlug
    ? await query.eq("programmes.slug", programmeSlug)
    : await query;

  if (error) {
    console.error("[data] stories query failed:", error.message);
    return [];
  }

  return (data ?? [])
    .filter((r) => r.quote || r.title)
    .map((r) => toStoryCard(r as Record<string, unknown>));
}

/**
 * One story, with its body.
 *
 * Resolved from the published list rather than by slug, so the same RLS policy
 * that hides unpublished and future-dated rows applies here too. A slug that
 * exists but is unpublished is a 404, not a page.
 */
export async function getStory(slug: string): Promise<StoryDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("stories", `story:${slug}`);

  if (!isSupabaseConfigured()) return null;

  const { data, error } = await createClient()
    .from("stories")
    .select(`${CARD_SELECT}, body`)
    .eq("published", true)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error(`[data] story "${slug}" failed:`, error.message);
    return null;
  }
  if (!data) return null;

  const row = data as Record<string, unknown>;
  return {
    ...toStoryCard(row),
    body: ((row.body as string | null) ?? "").trim(),
  };
}

/**
 * Slugs for `generateStaticParams`.
 *
 * Unused while the archive is empty — see the note in
 * `app/[locale]/(site)/stories/[slug]/page.tsx` for why that export cannot
 * exist yet. Kept because it is the one piece of that work already written, and
 * because a reader that enumerates published slugs is useful on its own.
 */
export async function getStorySlugs(): Promise<string[]> {
  const stories = await getStories();
  return stories.map((s) => s.slug);
}

/**
 * Other stories to read next.
 *
 * Same programme first, because a reader who finished one re-entry story is the
 * reader most likely to read another. Falls back to the newest stories when the
 * programme has too few — but the section is omitted entirely below three,
 * per the roadmap, rather than padded with unrelated stories.
 */
export async function getRelatedStories(
  currentSlug: string,
  programmeSlug: string | null,
  limit = 3,
): Promise<StoryCard[]> {
  const stories = await getStories();
  const others = stories.filter((s) => s.slug !== currentSlug);

  const sameProgramme = programmeSlug
    ? others.filter((s) => s.programmeSlug === programmeSlug)
    : [];

  if (sameProgramme.length >= limit) return sameProgramme.slice(0, limit);

  const seen = new Set(sameProgramme.map((s) => s.slug));
  const rest = others.filter((s) => !seen.has(s.slug));
  return [...sameProgramme, ...rest].slice(0, limit);
}

const SEED_COUNTS: ConsentTierCounts = {
  named_full: 0,
  named_no_face: 0,
  anonymised: 0,
};

/**
 * How many stories sit at each consent tier.
 *
 * Published on the stories page as a transparency measure: it is more credible
 * to say "six stories, two anonymised" than to imply every participant is named.
 */
export async function getConsentCounts(): Promise<ConsentTierCounts> {
  "use cache";
  cacheLife("hours");
  cacheTag("stories");

  const stories = await getStories();
  if (!isSupabaseConfigured()) return SEED_COUNTS;

  const counts: ConsentTierCounts = { ...SEED_COUNTS };
  for (const story of stories) counts[story.consentTier] += 1;
  return counts;
}

/**
 * Impact statistics across every programme, newest reporting period last.
 */
export async function getAllImpactStats() {
  "use cache";
  cacheLife("hours");
  cacheTag("impact-stats");

  if (!isSupabaseConfigured()) {
    return [
      { slug: "young-mothers-back-in-school", value: 19, label: "young mothers returned to school", period: "2025–26", programmeSlug: "school-reentry", sortOrder: 1 },
      { slug: "young-women-funded", value: 23, label: "young women given start-up capital", period: "2025–26", programmeSlug: "economic-empowerment", sortOrder: 2 },
      { slug: "dada-space-running-since", value: 1, label: "safe space, Dada Space, Kibera", period: "since 2024", programmeSlug: "dada-space", sortOrder: 3 },
    ];
  }

  const { data, error } = await createClient()
    .from("impact_stats")
    .select("slug, value, label, period, sort_order, programmes(slug)")
    .eq("active", true)
    .order("sort_order");

  if (error) {
    console.error("[data] impact_stats (all) failed:", error.message);
    return [];
  }

  return (data ?? []).map((r) => {
    const linked = r.programmes as unknown;
    const prog = Array.isArray(linked)
      ? (linked[0] as { slug?: string } | undefined)
      : (linked as { slug?: string } | null);
    return {
      slug: r.slug as string,
      value: Number(r.value),
      label: r.label as string,
      period: r.period as string,
      programmeSlug: prog?.slug ?? null,
      sortOrder: (r.sort_order as number) ?? 0,
    };
  });
}

/**
 * Methodology definitions.
 *
 * Static by design: these are statements about how we count, not data. They are
 * what makes a number defensible, so they live next to the numbers.
 *
 * The reporting period is a real, fixed window. It is not derived from
 * `new Date()`, which would change on every render and make the page
 * non-deterministic.
 */
export const REPORTING_PERIOD = {
  from: "1 April 2025",
  to: "31 March 2026",
  label: "2025–26",
} as const;

export const METHODOLOGY = [
  {
    term: "Participants",
    definition:
      "A girl or young woman who attended at least one programme session.",
  },
  {
    term: "Re-enrolment",
    definition:
      "Confirmed by written confirmation from the receiving school, not by the participant's word alone.",
  },
  {
    term: "Start-up capital",
    definition:
      "Disbursed and acknowledged in writing by the recipient.",
  },
  {
    term: "Safe spaces",
    definition:
      "A location running a scheduled, staffed programme that participants attend without referral.",
  },
] as const;

/**
 * What we do NOT yet measure.
 *
 * Publishing the gaps is the most credible thing on the page. A funder reading
 * a wall of percentages should be able to see the blind spots without having to
 * ask.
 *
 * ## This is now a fallback
 *
 * The four gaps live in `transparency_gaps`, which has existed since migration
 * `0007` and been publicly readable since `0009` — it was simply never filled,
 * so this page and the transparency page each carried their own copy of the
 * same four gaps, in two different phrasings.
 *
 * Migration `0018` seeded the table with one canonical phrasing. This array
 * mirrors it so a database blip renders the last-known-good list rather than an
 * empty section; `getMeasurementGaps()` prefers the table.
 */
export const MEASUREMENT_GAPS = [
  "Long-term retention beyond twelve months.",
  "Income change for participants funded with start-up capital.",
  "Whether re-enrolment holds once follow-through funding ends.",
  "Cost per participant.",
] as const;

/**
 * The gaps, from the table.
 *
 * Ordered by `sort_order`, which is editorial: the list is read top to bottom
 * and the first item is the one a reader remembers. `status` is deliberately
 * not filtered on — a gap that has been closed is more informative than one
 * that has been deleted, so the row stays and the status changes.
 */
export async function getMeasurementGaps(): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("transparency-gaps");

  if (!isSupabaseConfigured()) return [...MEASUREMENT_GAPS];

  const { data, error } = await createClient()
    .from("transparency_gaps")
    .select("item, sort_order")
    .order("sort_order");

  if (error) {
    console.error("[data] transparency_gaps query failed:", error.message);
    return [...MEASUREMENT_GAPS];
  }
  if (!data?.length) return [...MEASUREMENT_GAPS];

  return data.map((r) => r.item as string);
}

/**
 * The Impact page's sections, keyed.
 *
 * Mirrors `getAboutSections()`. Each key resolves through `getSection`, which
 * carries its own cache tag, so editing the methodology block does not
 * invalidate the hero.
 */
export async function getImpactSections(): Promise<Record<string, SiteSection>> {
  "use cache";
  cacheLife("hours");
  cacheTag("sections");

  const keys = [
    "impact-hero",
    "impact-headline",
    "impact-by-programme",
    "impact-methodology",
    "impact-gaps",
    "impact-reports",
  ];
  return Object.fromEntries(
    await Promise.all(
      keys.map(async (key) => [key, await getSection(key)] as const),
    ),
  );
}

/**
 * The Stories page's sections, keyed.
 *
 * The archive and the story detail share one page key, because they are one
 * editorial surface: an editor who rewrites "How we share these stories" on the
 * index expects the consent banner on a story to be sitting beside it in the
 * admin, not filed under a different page.
 */
export async function getStoriesSections(): Promise<Record<string, SiteSection>> {
  "use cache";
  cacheLife("hours");
  cacheTag("sections");

  const keys = [
    "stories-hero",
    "stories-featured",
    "stories-grid",
    "stories-empty",
    "stories-consent",
    "story-consent-banner",
    "story-anonymised",
    "story-cohort",
    "story-more",
    "story-share",
  ];
  return Object.fromEntries(
    await Promise.all(
      keys.map(async (key) => [key, await getSection(key)] as const),
    ),
  );
}
