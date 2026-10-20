import { cacheLife, cacheTag } from "next/cache";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getSection } from "@/lib/data/sections";
import { effectiveConsentTier, type ConsentTier, type SiteSection } from "@/lib/data/types";

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
  quote: string;
  attribution: string | null;
  consentTier: ConsentTier;
  imagePath: string | null;
  programmeSlug: string | null;
  programmeTitle: string | null;
  readingMinutes: number | null;
  publishedAt: string;
};

/** Fallback so the page renders before Supabase is configured. */
const SEED_STORIES: StoryCard[] = [];

const SEED_COUNTS: ConsentTierCounts = {
  named_full: 0,
  named_no_face: 0,
  anonymised: 0,
};

export async function getStories(programmeSlug?: string): Promise<StoryCard[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("stories");

    if (!isSupabaseConfigured()) {
      return programmeSlug ? [] : SEED_STORIES;
    }

    const query = createClient()
      .from("stories")
      .select(
        "slug, quote, attribution, consent_tier, consent_expires_at, image_path, reading_minutes, published_at, programmes(slug,title)",
      )
      .eq("published", true)
      // Future-dated stories are filtered by RLS (`stories_anon_read`), not by
      // a client-side `new Date()` — which is an unstable value under
      // `cacheComponents` and fails the prerender.
      .order("published_at", { ascending: false });

    const { data, error } = programmeSlug
      ? await query.eq("programmes.slug", programmeSlug)
      : await query;

    if (error) {
      console.error("[data] stories query failed:", error.message);
      return [];
    }

    return (data ?? []).flatMap((r) => {
      if (!r.quote) return [];
      const tier = effectiveConsentTier(
        r.consent_tier as ConsentTier,
        (r.consent_expires_at as string | null) ?? null,
      );
      const linked = r.programmes as unknown;
      const prog = Array.isArray(linked)
        ? (linked[0] as { slug?: string; title?: string } | undefined)
        : (linked as { slug?: string; title?: string } | null);

      return [
        {
          slug: r.slug as string,
          quote: r.quote as string,
          // Anonymised must not leak a name, not even an initial.
          attribution: tier === "anonymised" ? null : ((r.attribution as string | null) ?? null),
          consentTier: tier,
          // Only `named_full` may resolve an image.
          imagePath: tier === "named_full" ? ((r.image_path as string | null) ?? null) : null,
          programmeSlug: prog?.slug ?? null,
          programmeTitle: prog?.title ?? null,
          readingMinutes: (r.reading_minutes as number | null) ?? null,
          publishedAt: r.published_at as string,
        },
      ];
    });
  }

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
