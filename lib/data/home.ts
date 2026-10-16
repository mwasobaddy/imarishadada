import { cache } from "react";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { FeaturedStory, GivingTier, ImpactStat, Programme } from "@/lib/data/types";
import { effectiveConsentTier } from "@/lib/data/types";

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
      sortOrder: 1,
    },
    {
      slug: "economic-empowerment",
      title: "Economic Empowerment",
      summary:
        "Financial literacy, business mentorship and start-up capital for young women.",
      icon: "sprout",
      stat: "23 funded",
      sortOrder: 2,
    },
    {
      slug: "dada-space",
      title: "Dada Space",
      summary: "Safe spaces for girls aged 9–16 to learn, connect and grow.",
      icon: "heart",
      stat: "Running since 2024",
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
      slug: "materials-one-term",
      amount: 500,
      currency: "KES",
      cadence: "one_time",
      outcomeLabel: "school materials for one girl for one term",
      programmeSlug: "school-reentry",
      sortOrder: 1,
    },
    {
      slug: "psychosocial-month",
      amount: 2500,
      currency: "KES",
      cadence: "monthly",
      outcomeLabel: "psychosocial support for one young mother",
      programmeSlug: "school-reentry",
      sortOrder: 2,
    },
    {
      slug: "startup-capital-share",
      amount: 10000,
      currency: "KES",
      cadence: "one_time",
      outcomeLabel: "a share of start-up capital for one young woman",
      programmeSlug: "economic-empowerment",
      sortOrder: 3,
    },
    {
      slug: "re-entry-package",
      amount: 50000,
      currency: "KES",
      cadence: "one_time",
      outcomeLabel: "a full re-entry package for one girl",
      programmeSlug: "school-reentry",
      sortOrder: 4,
    },
    {
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

export const getProgrammes = cache(async (): Promise<Programme[]> => {
  if (!isSupabaseConfigured()) return SEED.programmes;

  const { data, error } = await createClient()
    .from("programmes")
    .select("slug, title, summary, icon, stat, sort_order")
    .eq("active", true)
    .order("sort_order");

  if (error) {
    console.error("[data] programmes query failed:", error.message);
    return SEED.programmes;
  }
  if (!data?.length) return SEED.programmes;

  return data.map((r) => ({
    slug: r.slug as string,
    title: r.title as string,
    summary: r.summary as string,
    icon: (r.icon as string) ?? "heart",
    stat: (r.stat as string) ?? null,
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
    .select("slug, amount, currency, cadence, outcome_label, sort_order, programmes(slug)")
    .eq("active", true)
    .order("sort_order");

  if (error) {
    console.error("[data] giving_tiers query failed:", error.message);
    return SEED.givingTiers;
  }
  if (!data?.length) return SEED.givingTiers;

  return data.map((r) => ({
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
    .lte("published_at", new Date().toISOString())
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