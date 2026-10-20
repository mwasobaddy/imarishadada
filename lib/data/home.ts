import { cache } from "react";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type {
  FeaturedStory,
  GivingTier,
  ImpactStat,
  Programme,
  SiteSection,
} from "@/lib/data/types";
import { effectiveConsentTier } from "@/lib/data/types";
import { resolveProgrammeImage } from "@/lib/data/programme-images";

/**
 * Fallback content for local development and pre-migration builds.
 *
 * Mirrors supabase/migrations/0002_phase1_seed.sql exactly. This exists so the
 * page renders before Supabase is configured — it is NOT a substitute for the
 * database. Acceptance criterion "every figure comes from the table" is NOT met
 * while this path is in use.
 */
const SEED: {
  programmes: Programme[];
  impactStats: ImpactStat[];
  givingTiers: GivingTier[];
} = {
  programmes: [
    {
      slug: "school-reentry",
      title: "School Re-entry",
      summary:
        "Mentorship, school fees and advocacy that walk a young mother back into education.",
      icon: "book",
      stat: "19 returned to school",
      statLabel: "19 returned to school",
      imagePath: null,
      imageAlt: null,
      sortOrder: 1,
    },
    {
      slug: "economic-empowerment",
      title: "Economic Empowerment",
      summary:
        "Financial literacy, business mentorship and start-up capital for young women.",
      icon: "sprout",
      stat: "23 funded",
      statLabel: "23 funded",
      imagePath: null,
      imageAlt: null,
      sortOrder: 2,
    },
    {
      slug: "dada-space",
      title: "Dada Space",
      summary: "Safe spaces for girls aged 9–16 to learn, connect and grow.",
      icon: "heart",
      stat: "Running since 2024",
      statLabel: "Running since 2024",
      imagePath: null,
      imageAlt: null,
      sortOrder: 3,
    },
  ],
  impactStats: [
    {
      slug: "young-mothers-back-in-school",
      value: 19,
      label: "young mothers returned to school",
      period: "2025–26",
      programmeSlug: "school-reentry",
      sortOrder: 1,
    },
    {
      slug: "young-women-funded",
      value: 23,
      label: "young women given start-up capital",
      period: "2025–26",
      programmeSlug: "economic-empowerment",
      sortOrder: 2,
    },
    {
      slug: "dada-space-running-since",
      value: 1,
      label: "safe space, Dada Space, Kibera",
      period: "since 2024",
      programmeSlug: "dada-space",
      sortOrder: 3,
    },
  ],
  givingTiers: [
    {
      id: null,
      slug: "materials-one-term",
      amount: 500,
      currency: "KES",
      cadence: "one_time",
      outcomeLabel: "school materials for one girl for one term",
      programmeSlug: "school-reentry",
      sortOrder: 1,
    },
    {
      id: null,
      slug: "psychosocial-month",
      amount: 2500,
      currency: "KES",
      cadence: "monthly",
      outcomeLabel: "psychosocial support for one young mother",
      programmeSlug: "school-reentry",
      sortOrder: 2,
    },
    {
      id: null,
      slug: "startup-capital-share",
      amount: 10000,
      currency: "KES",
      cadence: "one_time",
      outcomeLabel: "a share of start-up capital for one young woman",
      programmeSlug: "economic-empowerment",
      sortOrder: 3,
    },
    {
      id: null,
      slug: "re-entry-package",
      amount: 50000,
      currency: "KES",
      cadence: "one_time",
      outcomeLabel: "a full re-entry package for one girl",
      programmeSlug: "school-reentry",
      sortOrder: 4,
    },
    {
      id: null,
      slug: "dada-space-term",
      amount: 250000,
      currency: "KES",
      cadence: "one_time",
      outcomeLabel: "a full term of Dada Space",
      programmeSlug: "dada-space",
      sortOrder: 5,
    },
  ],
};

/**
 * PostgREST returns an embedded to-one relation as an object and a to-many
 * relation as an array, depending on how the FK cardinality is detected. The
 * generated types are absent until `supabase gen types` runs against the real
 * project, so normalise both shapes here rather than casting at the call site.
 */
function programmeSlugOf(value: unknown): string | null {
  if (Array.isArray(value)) return (value[0] as { slug?: string } | undefined)?.slug ?? null;
  if (value && typeof value === "object") {
    return (value as { slug?: string }).slug ?? null;
  }
  return null;
}

const SECTIONS: SiteSection[] = [
  {
    key: "home-programmes",
    eyebrow: "Our work",
    heading: "Three programmes, one aim: a girl in Kibera decides her own future",
    body: "School re-entry, economic empowerment, and safe spaces designed with girls and community leaders, not delivered to them.",
    ctaLabel: "All programmes",
    ctaHref: "/programmes",
  },
  {
    key: "about-hero",
    eyebrow: null,
    heading: "Imarisha Dada",
    body: "Empower a Sister",
    ctaLabel: null,
    ctaHref: null,
  },
  {
    key: "about-story",
    eyebrow: "Our story",
    heading: "We started with nineteen of them.",
    body: "Imarisha Dada began in Kibera with a simple observation: the girls who fell out of school here were not girls who had stopped learning. They were girls who had been pushed out \u2014 by pregnancy, by cost, by stigma, and by the assumption that a young mother had already chosen her path.",
    ctaLabel: null,
    ctaHref: null,
  },
  {
    key: "about-vision",
    eyebrow: "Vision",
    heading: "A safe, equal, and inclusive community where every girl thrives.",
    body: null,
    ctaLabel: null,
    ctaHref: null,
  },
  {
    key: "about-mission",
    eyebrow: "Mission",
    heading: "To amplify the voices of girls and young women and empower them to lead positive change in their communities.",
    body: null,
    ctaLabel: null,
    ctaHref: null,
  },
  {
    key: "about-values",
    eyebrow: "What guides us",
    heading: "Six commitments we are held to.",
    body: null,
    ctaLabel: null,
    ctaHref: null,
  },
  {
    key: "about-work",
    eyebrow: "What we do",
    heading: "Three programmes, one aim: a girl in Kibera decides her own future.",
    body: null,
    ctaLabel: "Support our work",
    ctaHref: "/donate",
  },
  {
    key: "about-team",
    eyebrow: "Our team",
    heading: "The people behind the work",
    body: null,
    ctaLabel: null,
    ctaHref: null,
  },
  {
    key: "about-approach",
    eyebrow: "How we work",
    heading: "Community-owned, girl-led, evidence-informed.",
    body: null,
    ctaLabel: null,
    ctaHref: null,
  },
  {
    key: "home-giving",
    eyebrow: "Ways to give",
    heading: "What your gift actually does",
    body: "Every amount below is tied to a specific outcome. Give monthly and a mentor's continuity matters as much as a single emergency.",
    ctaLabel: null,
    ctaHref: null,
  },
];

/** Section copy from `site_sections`. Falls back to the mirrored seed copy. */
export const getSection = cache(async (key: string): Promise<SiteSection> => {
  const fallback = SECTIONS.find((s) => s.key === key);
  if (!isSupabaseConfigured() || !fallback) return fallback!;

  const { data, error } = await createClient()
    .from("site_sections")
    .select("section_key, eyebrow, heading, body, cta_label, cta_href")
    .eq("section_key", key)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) return fallback;

  return {
    key,
    eyebrow: (data.eyebrow as string | null) ?? fallback.eyebrow,
    heading: (data.heading as string) ?? fallback.heading,
    body: (data.body as string | null) ?? fallback.body,
    ctaLabel: (data.cta_label as string | null) ?? null,
    ctaHref: (data.cta_href as string | null) ?? null,
  };
});


/**
 * Attach the consented photograph to a programme that has none.
 *
 * The seed rows carry `image_path: null` because they were written before the
 * photography existed. Without this, the seed path — which is what runs
 * whenever Supabase is not configured — renders the brand-tinted field and the
 * photographs never appear at all.
 */
function withProgrammeImages(rows: Programme[]): Programme[] {
  return rows.map((row) => ({
    ...row,
    ...resolveProgrammeImage(row.slug, row.imagePath, row.imageAlt),
  }));
}

export const getProgrammes = cache(async (): Promise<Programme[]> => {
  if (!isSupabaseConfigured()) return withProgrammeImages(SEED.programmes);

  const { data, error } = await createClient()
    .from("programmes")
    .select("slug, title, summary, icon, stat, stat_label, image_path, image_alt, sort_order")
    .eq("active", true)
    .order("sort_order");

  if (error) {
    console.error("[data] programmes query failed:", error.message);
    return withProgrammeImages(SEED.programmes);
  }
  if (!data?.length) return withProgrammeImages(SEED.programmes);

  return data.map((r) => ({
    slug: r.slug as string,
    title: r.title as string,
    summary: r.summary as string,
    icon: (r.icon as string) ?? "heart",
    stat: (r.stat as string) ?? null,
    statLabel: (r.stat_label as string | null) ?? (r.stat as string | null) ?? null,
    ...resolveProgrammeImage(
      r.slug as string,
      r.image_path as string | null,
      r.image_alt as string | null,
    ),
    sortOrder: (r.sort_order as number) ?? 0,
  }));
});

export const getImpactStats = cache(async (): Promise<ImpactStat[]> => {
  if (!isSupabaseConfigured()) return SEED.impactStats;

  const { data, error } = await createClient()
    .from("impact_stats")
    .select("slug, value, label, period, sort_order, programmes(slug)")
    .eq("active", true)
    .order("sort_order");

  if (error) {
    console.error("[data] impact_stats query failed:", error.message);
    return SEED.impactStats;
  }
  if (!data?.length) return SEED.impactStats;

  return data.map((r) => ({
    slug: r.slug as string,
    value: Number(r.value),
    label: r.label as string,
    period: r.period as string,
    programmeSlug: programmeSlugOf(r.programmes),
    sortOrder: (r.sort_order as number) ?? 0,
  }));
});

export const getGivingTiers = cache(async (): Promise<GivingTier[]> => {
  if (!isSupabaseConfigured()) return SEED.givingTiers;

  const { data, error } = await createClient()
    .from("giving_tiers")
    .select("id, slug, amount, currency, cadence, outcome_label, sort_order, programmes(slug)")
    .eq("active", true)
    .order("sort_order");

  if (error) {
    console.error("[data] giving_tiers query failed:", error.message);
    return SEED.givingTiers;
  }
  if (!data?.length) return SEED.givingTiers;

  return data.map((r) => ({
    id: (r.id as string) ?? null,
    slug: r.slug as string,
    amount: Number(r.amount),
    currency: (r.currency as string) ?? "KES",
    cadence: (r.cadence as "one_time" | "monthly") ?? "one_time",
    outcomeLabel: r.outcome_label as string,
    programmeSlug: programmeSlugOf(r.programmes),
    sortOrder: (r.sort_order as number) ?? 0,
  }));
});

/**
 * Featured story. Returns null when no eligible story exists — the home page
 * omits the section rather than rendering a placeholder.
 */
export const getFeaturedStory = cache(async (): Promise<FeaturedStory | null> => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await createClient()
    .from("stories")
    .select("slug, quote, attribution, consent_tier, consent_expires_at, image_path")
    .eq("published", true)
    .eq("featured", true)
    // The "not future-dated" guard lives in RLS, not here. The
    // `stories_anon_read` policy already filters `published_at <= now()`.
    // Calling `new Date()` at render time is an unstable value under
    // `cacheComponents` and fails the prerender.
    .order("published_at", { ascending: false })
    .limit(1);

  if (error || !data?.length) return null;

  const row = data[0]!;
  const tier = effectiveConsentTier(
    row.consent_tier as FeaturedStory["consentTier"],
    (row.consent_expires_at as string | null) ?? null,
  );

  return {
    slug: row.slug as string,
    quote: row.quote as string,
    attribution: (row.attribution as string | null) ?? null,
    consentTier: tier,
    // Never resolve an image for a tier that cannot display one.
    imagePath: tier === "named_full" ? ((row.image_path as string | null) ?? null) : null,
  };
});