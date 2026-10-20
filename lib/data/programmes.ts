import { cacheLife, cacheTag } from "next/cache";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  effectiveConsentTier,
  type ConsentTier,
  type FeaturedStory,
  type GivingTier,
  type ImpactStat,
  type Programme,
  type ProgrammeOutcome,
  type ProgrammePage,
  type SiteSection,
} from "@/lib/data/types";
import { resolveProgrammeImage } from "@/lib/data/programme-images";
import { getSection } from "@/lib/data/sections";

/**
 * Programme detail data.
 *
 * Route is `/programmes/[slug]` driven by `programmes.slug`. The spec is
 * explicit that a hardcoded route segment alongside a database slug is a bug,
 * not a style choice: "A canonical pointing at a different slug splits SEO
 * signals and breaks hreflang."
 *
 * Every getter degrades to a development fallback so the page renders before
 * Supabase is configured — the same caveat as the home seed.
 */

const OUTCOMES_BY_SLUG: Record<string, ProgrammeOutcome[]> = {
  "school-reentry": [
    {
      title: "Mentorship",
      description:
        "A matched mentor who has been through it herself, so the advice comes from experience rather than a manual.",
    },
    {
      title: "Fees and materials",
      description:
        "Removed as a barrier and paid directly to the school, so the money reaches the fees it was meant for.",
    },
    {
      title: "Psychosocial support",
      description:
        "Counselling for the mother, not only for the child. Re-entry fails when we treat it as a placement problem.",
    },
    {
      title: "School advocacy",
      description:
        "We negotiate with the school so she is not turned away at the gate on the day she decides to come back.",
    },
    {
      title: "Family engagement",
      description:
        "Home visits, so the household supports the decision instead of quietly undermining it.",
    },
    {
      title: "Follow-through",
      description:
        "Tracked through to completion, not just enrolment. Enrolment is where programmes usually stop counting.",
    },
  ],
  "economic-empowerment": [
    { title: "Financial literacy", description: "Savings, credit and mobile money, taught by women running businesses in the same estate." },
    { title: "Business mentorship", description: "A matched mentor with a trading business, for the practical questions a syllabus cannot answer." },
    { title: "Start-up capital", description: "Granted without collateral, which is what excludes the people most likely to need it." },
    { title: "Market linkage", description: "Introduction to buyers and cooperatives, because a product with no route to a customer is not income." },
    { title: "Peer network", description: "A cohort that keeps trading together, so the first year is not solved alone." },
    { title: "Business survival", description: "We measure how many are still trading at twelve months. Not how many were funded." },
  ],
  "dada-space": [
    { title: "After-school hours", description: "A structured afternoon so there is somewhere to be between the end of school and dinner." },
    { title: "Trained facilitators", description: "Women who are not afraid of a teenager's silence, because that silence is the usual reason girls stop attending." },
    { title: "Free and open to all", description: "No referral, no means test, no waiting list. Any girl who walks in is welcome." },
    { title: "Safeguarding", description: "A named safeguarding officer, and staff trained to recognise disclosure." },
    { title: "Mentorship pairs", description: "An older girl paired with a younger one, so someone in the room is speaking her language." },
    { title: "Childcare support", description: "For the girls who are already mothers, so attendance does not mean abandoning a baby." },
  ],
};

/**
 * Development fallback for programme tiers.
 *
 * Without this, `getProgrammeTiers` returns [] when Supabase is unconfigured
 * and `ProgrammeCost` renders nothing — which removed the donate CTA from the
 * programme page entirely. The page's whole job is to end in an ask.
 */
const FALLBACK_TIERS: Record<
  string,
  { slug: string; amount: number; outcomeLabel: string; cadence: "one_time" | "monthly" }[]
> = {
  "school-reentry": [
    { slug: "materials-one-term", amount: 500, outcomeLabel: "school materials for one girl for one term", cadence: "one_time" },
    { slug: "psychosocial-month", amount: 2500, outcomeLabel: "psychosocial support for one young mother", cadence: "monthly" },
    { slug: "re-entry-package", amount: 50000, outcomeLabel: "a full re-entry package for one girl, with a year of mentorship and follow-through", cadence: "one_time" },
  ],
  "economic-empowerment": [
    { slug: "startup-capital-share", amount: 10000, outcomeLabel: "a share of start-up capital for one young woman", cadence: "one_time" },
  ],
  "dada-space": [
    { slug: "dada-space-term", amount: 250000, outcomeLabel: "a full term of Dada Space", cadence: "one_time" },
  ],
};

const FALLBACK_TITLE: Record<string, string> = {
  "school-reentry": "School Re-entry",
  "economic-empowerment": "Economic Empowerment",
  "dada-space": "Dada Space",
};

const FALLBACK_BODY: Record<string, string> = {
  "school-reentry": `A girl does not stop learning when she becomes a mother. She gets pushed out.

The barriers are specific and they compound. Childcare falls on her. Stigma follows her to school. Re-enrolment costs land on a household that has less of it. And the assumption everyone makes, that a young mother has already chosen her path, is the one that does the most damage, because it is the one nobody argues with.

When she leaves, the consequences are not hers alone. Less education means less income, which means more vulnerability, which means the next generation starts further behind. The girl who was pushed out is the reason another girl gets pushed out.

We work on the barriers, not on her motivation. Motivation is rarely the problem.`,
  "economic-empowerment": `Income is not a single decision. It is a stack of them: what can be sold, who can be lent to, whether a phone is worth buying, whether the market opens before the savings do.

Most financial literacy programmes teach budgeting to women who already have something to budget. Ours starts earlier. Financial literacy, then business mentorship from someone who has actually run something, then start-up capital without a collateral requirement that would rule out the people most likely to benefit from it.

The measure is not how many businesses were funded. It is how many are still trading a year later.`,
  "dada-space": `Dada Space is a room, and the room is the point.

For girls aged 9 to 16 in Kibera, a safe space is somewhere they can be without explaining themselves, without a parent deciding, without an audience. Somewhere the questions get asked and nobody treats them as trouble.

It runs after school. It is free. It is staffed by women who are not afraid of a teenager's silence. And it is open to any girl who walks in, no referral, no means test, no waiting list.

Because the girls who never attend anything structured are the ones who most need somewhere structured to attend.`,
};

type ProgrammeRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  icon: string;
  stat: string | null;
  stat_label: string | null;
  image_path: string | null;
  image_alt: string | null;
  outcomes: unknown;
  sort_order: number;
};

/**
 * PostgREST returns a jsonb column as already-parsed. Guard anyway — a
 * malformed value must not take the page down.
 */
function parseOutcomes(value: unknown): ProgrammeOutcome[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const { title, description } = entry as { title?: unknown; description?: unknown };
    if (typeof title !== "string" || !title.trim()) return [];
    return [{ title: title.trim(), description: typeof description === "string" ? description : "" }];
  });
}

/** A single programme, or null when the slug does not exist or is inactive. */
export async function getProgramme(slug: string): Promise<ProgrammePage | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("programmes");

    const fallback = OUTCOMES_BY_SLUG[slug]
      ? {
          id: null,
          slug,
          title: FALLBACK_TITLE[slug],
          summary: "",
          body: FALLBACK_BODY[slug] ?? "",
          icon: "heart",
          stat: null,
          statLabel: null,
          ...resolveProgrammeImage(slug, null, null),
          outcomes: OUTCOMES_BY_SLUG[slug],
          sortOrder: 0,
        } satisfies ProgrammePage
      : null;

    if (!isSupabaseConfigured()) return fallback;
    if (!fallback && !slug) return null;

    const { data, error } = await createClient()
      .from("programmes")
      .select(
        "id, slug, title, summary, body, icon, stat, stat_label, image_path, image_alt, outcomes, sort_order",
      )
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();

    if (error) {
      console.error(`[data] programme "${slug}" query failed:`, error.message);
      return fallback;
    }
    if (!data) return fallback;

    const row = data as unknown as ProgrammeRow;
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      body: row.body,
      icon: row.icon,
      stat: row.stat,
      statLabel: row.stat_label ?? row.stat,
      ...resolveProgrammeImage(
        row.slug,
        row.image_path,
        row.image_alt,
      ),
      outcomes: parseOutcomes(row.outcomes),
      sortOrder: row.sort_order,
    };
  }

/**
 * Every active programme slug, for `generateStaticParams`.
 *
 * The fallback lists all three so every programme card resolves before
 * Supabase is configured. Returning only one left the other two cards on the
 * homepage pointing at 404s, which is exactly the broken-donor-journey this
 * page set out to fix.
 */
const FALLBACK_SLUGS = ["school-reentry", "economic-empowerment", "dada-space"];

export async function getProgrammeSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("programmes");

  if (!isSupabaseConfigured()) return FALLBACK_SLUGS;

  const { data, error } = await createClient()
    .from("programmes")
    .select("slug")
    .eq("active", true)
    .order("sort_order");

  if (error || !data?.length) return FALLBACK_SLUGS;
  return data.map((r) => r.slug as string);
}

/**
 * Impact figures attributed to this programme.
 *
 * Only what is in `impact_stats` is rendered. Figures the spec marks "verify
 * before publishing" were never seeded, so they simply do not appear — the page
 * cannot accidentally publish an unsourced number.
 */
export async function getProgrammeStats(programmeSlug: string): Promise<ImpactStat[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("impact-stats");

    if (!isSupabaseConfigured()) {
      return programmeSlug === "school-reentry"
        ? [
            {
              slug: "young-mothers-back-in-school",
              value: 19,
              label: "young mothers returned to school",
              period: "2025–26",
              programmeSlug: "school-reentry",
              sortOrder: 1,
            },
          ]
        : [];
    }

    const { data, error } = await createClient()
      .from("impact_stats")
      .select("slug, value, label, period, sort_order, programmes(slug)")
      .eq("active", true)
      .eq("programmes.slug", programmeSlug)
      .order("sort_order");

    if (error) {
      console.error(`[data] impact_stats for "${programmeSlug}" failed:`, error.message);
      return [];
    }

    return (data ?? []).map((r) => {
      const linked = r.programmes as unknown;
      const slug =
        Array.isArray(linked)
          ? ((linked[0] as { slug?: string } | undefined)?.slug ?? null)
          : ((linked as { slug?: string } | null)?.slug ?? null);
      return {
        slug: r.slug as string,
        value: Number(r.value),
        label: r.label as string,
        period: r.period as string,
        programmeSlug: slug,
        sortOrder: (r.sort_order as number) ?? 0,
      };
    });
  }

/** Giving tiers attached to this programme, cheapest first. */
export async function getProgrammeTiers(programmeSlug: string): Promise<GivingTier[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("giving-tiers");

    const fallback = (FALLBACK_TIERS[programmeSlug] ?? []).map<GivingTier>((t, i) => ({
      id: null,
      slug: t.slug,
      amount: t.amount,
      currency: "KES",
      cadence: t.cadence,
      outcomeLabel: t.outcomeLabel,
      programmeSlug,
      sortOrder: i + 1,
    }));

    if (!isSupabaseConfigured()) return fallback;

    const { data, error } = await createClient()
      .from("giving_tiers")
      .select(
        "id, slug, amount, currency, cadence, outcome_label, sort_order, programmes(slug)",
      )
      .eq("active", true)
      .eq("programmes.slug", programmeSlug)
      .order("amount");

    if (error) {
      console.error(`[data] giving_tiers for "${programmeSlug}" failed:`, error.message);
      return fallback;
    }
    if (!data?.length) return fallback;

    return (data ?? []).map((r) => {
      const linked = r.programmes as unknown;
      const slug =
        Array.isArray(linked)
          ? ((linked[0] as { slug?: string } | undefined)?.slug ?? null)
          : ((linked as { slug?: string } | null)?.slug ?? null);
      return {
        id: (r.id as string) ?? null,
        slug: r.slug as string,
        amount: Number(r.amount),
        currency: (r.currency as string) ?? "KES",
        cadence: (r.cadence as "one_time" | "monthly") ?? "one_time",
        outcomeLabel: r.outcome_label as string,
        programmeSlug: slug,
        sortOrder: (r.sort_order as number) ?? 0,
      };
    });
  }

/**
 * Stories attached to this programme, with consent enforced.
 *
 * This is the highest safeguarding sensitivity in the organisation — minors and
 * young mothers — so the tier is resolved through `effectiveConsentTier` and an
 * expired consent is treated as anonymised. A girl consented at 11 is a
 * different situation from the same person at 19.
 *
 * The tier is NEVER taken from the client and is not admin-editable
 * (programme-school-reentry.md §4.5).
 */
export async function getProgrammeStories(programmeSlug: string): Promise<FeaturedStory[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("stories");

    if (!isSupabaseConfigured()) return [];

    const { data, error } = await createClient()
      .from("stories")
      .select(
        "slug, quote, attribution, consent_tier, consent_expires_at, image_path, published_at",
      )
      .eq("published", true)
      .eq("programmes.slug", programmeSlug)
      // Future-dated stories are filtered by RLS (`stories_anon_read`). A
      // client-side `new Date()` is unstable under `cacheComponents`.
      .order("published_at", { ascending: false });

    if (error) {
      console.error(`[data] stories for "${programmeSlug}" failed:`, error.message);
      return [];
    }

    return (data ?? []).flatMap((r) => {
      if (!r.quote) return [];
      const tier = effectiveConsentTier(
        r.consent_tier as ConsentTier,
        (r.consent_expires_at as string | null) ?? null,
      );
      return [
        {
          slug: r.slug as string,
          quote: r.quote as string,
          // Anonymised must not leak a name into the attribution.
          attribution:
            tier === "anonymised" ? null : ((r.attribution as string | null) ?? null),
          consentTier: tier,
          // Only `named_full` may resolve an image.
          imagePath:
            tier === "named_full" ? ((r.image_path as string | null) ?? null) : null,
        } satisfies FeaturedStory,
      ];
    });
  }

/** Other programmes, for the "see what else we run" footer. */
export async function getOtherProgrammes(currentSlug: string): Promise<Programme[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("programmes");

    if (!isSupabaseConfigured()) return [];

    const { data, error } = await createClient()
      .from("programmes")
      .select("slug, title, summary, icon, stat, stat_label, image_path, image_alt, sort_order")
      .eq("active", true)
      .neq("slug", currentSlug)
      .order("sort_order")
      .limit(2);

    if (error || !data?.length) return [];

    return data.map((r) => ({
      slug: r.slug as string,
      title: r.title as string,
      summary: r.summary as string,
      icon: (r.icon as string) ?? "heart",
      stat: (r.stat as string) ?? null,
      statLabel: (r.stat_label as string | null) ?? (r.stat as string | null),
      imagePath: (r.image_path as string | null) ?? null,
      imageAlt: (r.image_alt as string | null) ?? null,
      sortOrder: (r.sort_order as number) ?? 0,
    }));
  }

/**
 * Partner schools with recorded written agreement.
 *
 * `agreement_on` is a required column: a name cannot be stored at all without a
 * date, so an unconfirmed school cannot accidentally reach the page.
 */
export async function getPartnerSchools(programmeSlug?: string): Promise<
    { name: string; area: string | null; note: string | null }[]
  > {
  "use cache";
  cacheLife("hours");
  cacheTag("partner-schools");

    if (!isSupabaseConfigured()) return [];

    const query = createClient()
      .from("partner_schools")
      // `programmes(slug)` is in the select because the filter below uses it.
      // PostgREST rejects a filter on an embedded resource that is not also
      // selected — "programmes is not an embedded resource in this request".
      // The embed is otherwise unused; it exists to make the filter legal.
      .select("name, area, note, programmes(slug)")
      .eq("active", true)
      .not("agreement_on", "is", null)
      .order("sort_order");

    const { data, error } = programmeSlug
      ? await query.eq("programmes.slug", programmeSlug)
      : await query;

    if (error) {
      console.error("[data] partner_schools query failed:", error.message);
      return [];
    }

    return (data ?? []).map((r) => ({
      name: r.name as string,
      area: (r.area as string | null) ?? null,
      note: (r.note as string | null) ?? null,
    }));
  }


/**
 * The four sections of the programmes index, keyed by section key.
 *
 * Same shape as `getAboutSections` so the two pages are wired identically and
 * a new page is a copy of an existing one rather than a new pattern.
 */
export async function getProgrammeSections(): Promise<Record<string, SiteSection>> {
  "use cache";
  cacheLife("hours");
  cacheTag("sections");

  const keys = [
    "programmes-hero",
    "programmes-pathway",
    "programmes-measure",
    "programmes-unrestricted",
  ];
  return Object.fromEntries(
    await Promise.all(keys.map(async (key) => [key, await getSection(key)] as const)),
  );
}
