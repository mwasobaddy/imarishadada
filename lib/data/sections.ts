import { cacheLife, cacheTag } from "next/cache";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { SiteSection } from "@/lib/data/types";

/**
 * Editor-managed page copy, cached.
 *
 * ## Why this is separate from `lib/data/home.ts`
 *
 * `home.ts` wraps its readers in React's `cache()`, which is *per-request*
 * memoisation — it dedupes within a single render and is gone by the next
 * request. That is fine for dedupe and useless as a cache.
 *
 * This module uses `'use cache'`, which is Next's persistent cache. The page
 * stays fully prerendered and the copy is served from the edge. A Supabase
 * round trip happens once per cache window instead of once per visitor, which
 * is the difference between a static page and a dynamic one.
 *
 * ## The tag contract
 *
 * Every reader tags with both the specific key (`section:home-hero`) and the
 * collection (`sections`). A write calls `revalidateTag` for the specific tag,
 * so editing the hero does not invalidate every other section's cache.
 *
 * If a write lands without a matching `revalidateTag`, the editor sees their
 * change "not save". That is the failure mode to watch for, and it is why the
 * admin actions never write to Supabase directly — they go through
 * `revalidateSections()` in `app/[locale]/admin/actions/pages.ts`.
 *
 * ## Admin reads do not use this
 *
 * The editor must see its own writes immediately, so admin reads go through
 * Server Actions against the service client, not through a cached function.
 */

export const SECTIONS_TAG = "sections";
export const sectionTag = (key: string) => `section:${key}`;

/** The fields the public site renders. */
type SectionRow = {
  section_key: string;
  eyebrow: string | null;
  heading: string;
  body: string | null;
  cta_label: string | null;
  cta_href: string | null;
  cta_secondary_label: string | null;
  cta_secondary_href: string | null;
  stat_line: string | null;
  body_secondary: string | null;
  steps: { title: string; description: string }[] | null;
  images: { path: string; alt: string; caption?: string }[] | null;
  image_path: string | null;
  image_alt: string | null;
  active: boolean;
};

/**
 * A section that exists but is switched off, or is absent entirely.
 *
 * `heading` is empty and `active` is false, so a page that guards on `active`
 * renders nothing — which is what "Hide section" is supposed to mean. Under
 * RLS the two states are indistinguishable from the public side; see
 * `getSection`.
 */
function hidden(key: string): SiteSection {
  return {
    key,
    eyebrow: null,
    heading: "",
    body: null,
    ctaLabel: null,
    ctaHref: null,
    active: false,
  };
}

/**
 * Re-exported from `lib/data/visibility.ts`.
 *
 * The function moved out so that client components — the admin's live preview
 * renders the real public components — can use it without pulling
 * `next/cache` into the browser bundle. Server code keeps importing it from
 * here, where it has always lived.
 */
export { isVisible } from "@/lib/data/visibility";

/**
 * Fallbacks, used when Supabase is unreachable or not configured.
 *
 * These mirror `supabase/migrations/0013_pages.sql`. They exist so a database
 * blip renders the last-known-good copy rather than an empty heading — an
 * empty `<h1>` is worse than a stale one.
 *
 * They are NOT used when a row exists and is switched off, nor when a row is
 * simply absent. Both resolve to `hidden()`. See the note on `getSection`:
 * applying the fallback there made "Hide section" restore the code copy instead
 * of hiding anything.
 *
 * `active` is therefore omitted here and injected by `fallbackFor()`.
 */
const FALLBACKS: Record<string, Omit<SiteSection, "active">> = {
  "home-hero": {
    key: "home-hero",
    eyebrow: null,
    heading: "Every girl deserves a safe space, a second chance and a seat at the table.",
    body: "Imarisha Dada is a girl-led organisation in Kibera, Nairobi. We support young mothers returning to education, girls finding safe spaces to grow, and young women building their own income.",
    ctaLabel: "Donate",
    ctaHref: "/donate",
    ctaSecondaryLabel: "See our impact",
    ctaSecondaryHref: "#impact",
    statLine: "19 young mothers back in school. 23 young women funded. All in 2025–26.",
  },
  "home-programmes": {
    key: "home-programmes",
    eyebrow: "Our work",
    heading: "Four programmes, one aim: a girl in Kibera decides her own future",
    body: "School re-entry, economic empowerment, Dada Space and the Community Hub — designed with girls and community leaders, not delivered to them.",
    ctaLabel: "All programmes",
    ctaHref: "/programmes",
  },
  "home-giving": {
    key: "home-giving",
    eyebrow: "Ways to give",
    heading: "What your gift actually does",
    body: "Every amount below is tied to a specific outcome. Give monthly and a mentor's continuity matters as much as a single emergency.",
    ctaLabel: null,
    ctaHref: null,
  },
  "about-hero": {
    key: "about-hero",
    eyebrow: null,
    heading: "Imarisha Dada",
    body: "Empower a Sister",
    ctaLabel: null,
    ctaHref: null,
  },
  "about-story": {
    key: "about-story",
    eyebrow: "Our story",
    heading: "It started as a beauty parlour.",
    body: "Imarisha Dada is a young women-led, community-based organisation founded in 2024. It started as a beauty parlour where girls and young women could have their hair and nails done. The parlour created a space where girls could share their stories, heal and cry together.\n\nFrom those stories we wanted to hear more, so we began reaching out to young mothers who were vulnerable and at risk of dropping out of school, or who had already dropped out.\n\nWe later recruited 24 young mothers into the organisation. We introduced a safe space where they could share their stories without being judged, support one another, and find solutions to the challenges they face. Through those conversations we realised that many of them were struggling with unresolved trauma, which led us to introduce psychosocial support.\n\nWe later introduced economic empowerment, where each young mother was given start-up capital to begin a small business. Most of them used the support to start businesses and become more economically independent. We also supported those who wanted to return to school. Many of them have since completed their studies, and we continue to recruit and support other young mothers through the organisation.\n\nToday, Imarisha Dada continues to create safe spaces, strengthen the voices of girls and young mothers, and support them to build better and more independent lives.",
    ctaLabel: null,
    ctaHref: null,
  },
  "about-values": {
    key: "about-values",
    eyebrow: "What guides us",
    heading: "Six commitments we are held to.",
    body: null,
    ctaLabel: null,
    ctaHref: null,
  },
  "about-work": {
    key: "about-work",
    eyebrow: "What we do",
    heading: "Four programmes, one aim: a girl in Kibera decides her own future.",
    body: null,
    ctaLabel: null,
    ctaHref: null,
  },
  "about-approach": {
    key: "about-approach",
    eyebrow: "How we work",
    heading: "Community-owned, girl-led, evidence-informed.",
    body: null,
    ctaLabel: null,
    ctaHref: null,
  },
  "about-team": {
    key: "about-team",
    eyebrow: "Our team",
    heading: "The people behind the work",
    body: null,
    ctaLabel: null,
    ctaHref: null,
  },
  "about-vision": {
    key: "about-vision",
    eyebrow: "Vision",
    heading: "A safe, equal, and inclusive community where every girl thrives.",
    body: null,
    ctaLabel: null,
    ctaHref: null,
  },
  "about-mission": {
    key: "about-mission",
    eyebrow: "Mission",
    heading:
      "To amplify the voices of girls and young women and empower them to lead positive change in their communities.",
    body: null,
    ctaLabel: null,
    ctaHref: null,
  },
  /**
   * The About page carousel, rendered twice from one set.
   *
   * Mirrors migration `0017`. Without it a database blip empties the carousel,
   * and `AboutPhotoCarousel` returns null for an empty set — so the two columns
   * it anchors collapse and the story section loses its image entirely. Stale
   * photographs beat a missing layout.
   */
  "about-carousel": {
    key: "about-carousel",
    eyebrow: null,
    heading: "Programmes and sessions in Kibera",
    body: "Programmes and sessions in Kibera, photographed by Suma and published with written consent. Auto-advances, and pauses on hover or keyboard focus.",
    ctaLabel: null,
    ctaHref: null,
    images: [
      { path: "/images/about/about-two-women-classroom.avif", alt: "Two young women smiling together in a classroom in Kibera" },
      { path: "/images/about/about-mentor-and-participant.avif", alt: "A participant and a younger girl seated together during a session" },
      { path: "/images/about/about-core-values-presentation.avif", alt: "A participant presenting a chart to her group during a session" },
      { path: "/images/about/about-outdoor-candid.avif", alt: "Participants in branded t-shirts talking outdoors after a session" },
      { path: "/images/about/about-group-outdoors.avif", alt: "The full group photographed outside the community centre" },
      { path: "/images/about/about-facilitation.avif", alt: "A participant drawing on a flipchart while the group watches" },
    ],
  },
  /**
   * Impact, mirrors migration `0018`.
   *
   * The reporting period is deliberately absent from all of this copy — it is
   * rendered by the components from `REPORTING_PERIOD` in `lib/data/impact.ts`,
   * because it has to agree with `impact_stats.period` on every row and would
   * drift as prose. See the note at the foot of that migration.
   */
  "impact-hero": {
    key: "impact-hero",
    eyebrow: "Our impact",
    heading: "Numbers, and how we got them.",
    body: "Every figure on this page covers the same fixed reporting period, stated below. Where we do not have a number, we say so rather than estimate.",
    ctaLabel: null,
    ctaHref: null,
  },
  "impact-headline": {
    key: "impact-headline",
    eyebrow: null,
    heading: "The headline numbers",
    body: "Every figure below carries the period it covers.",
    ctaLabel: null,
    ctaHref: null,
  },
  "impact-by-programme": {
    key: "impact-by-programme",
    eyebrow: null,
    heading: "By programme",
    body: null,
    ctaLabel: null,
    ctaHref: null,
  },
  "impact-methodology": {
    key: "impact-methodology",
    eyebrow: "Methodology",
    heading: "How we count",
    body: "A number without a definition is a claim. These are ours.",
    ctaLabel: null,
    ctaHref: null,
    steps: [
      { title: "Participants", description: "A girl or young woman who attended at least one programme session." },
      { title: "Re-enrolment", description: "Confirmed by written confirmation from the receiving school, not by the participant's word alone." },
      { title: "Start-up capital", description: "Disbursed and acknowledged in writing by the recipient." },
      { title: "Safe spaces", description: "A location running a scheduled, staffed programme that participants attend without referral." },
    ],
  },
  "impact-gaps": {
    key: "impact-gaps",
    eyebrow: null,
    heading: "What we do not yet measure",
    body: "Anyone can publish a percentage. These are the things we cannot claim, and a funder should be able to see them without asking.",
    ctaLabel: null,
    ctaHref: null,
  },
  "impact-reports": {
    key: "impact-reports",
    eyebrow: null,
    heading: "Reports and documents",
    body: "The written record behind the numbers. A number with no picture behind it is an assertion, so the photographs below sit beside the figures.",
    ctaLabel: null,
    ctaHref: null,
    images: [
      { path: "/images/impact/impact-group-with-banner.avif", alt: "The full group of participants photographed with the organisation's banner", caption: "The cohort behind the 2025–26 figures" },
      { path: "/images/impact/impact-supplies-distributed.avif", alt: "Participants handing out supplies to families at the community centre", caption: "What a gift becomes on the ground" },
      { path: "/images/impact/impact-community-meal.avif", alt: "A community meal served at the community centre in Kibera", caption: "Community outreach, Kibera" },
      { path: "/images/impact/impact-group-outdoors.avif", alt: "Participants and staff standing together outside the community centre, smiling", caption: "The team and the girls, Kibera" },
    ],
  },
};

/**
 * The code copy for a key, switched on.
 *
 * `active: true` because a fallback is only ever reached when there is nothing
 * editorial to respect — the database is unreachable, or not configured at all.
 */
function fallbackFor(key: string): SiteSection | null {
  const fallback = FALLBACKS[key];
  return fallback ? { ...fallback, active: true } : null;
}

function toSection(row: SectionRow): SiteSection {
  const fallback = FALLBACKS[row.section_key];
  return {
    key: row.section_key,
    eyebrow: row.eyebrow ?? fallback?.eyebrow ?? null,
    heading: row.heading || fallback?.heading || "",
    body: row.body ?? fallback?.body ?? null,
    ctaLabel: row.cta_label ?? fallback?.ctaLabel ?? null,
    ctaHref: row.cta_href ?? fallback?.ctaHref ?? null,
    ctaSecondaryLabel: row.cta_secondary_label ?? fallback?.ctaSecondaryLabel ?? null,
    ctaSecondaryHref: row.cta_secondary_href ?? fallback?.ctaSecondaryHref ?? null,
    statLine: row.stat_line ?? fallback?.statLine ?? null,
    bodySecondary: row.body_secondary ?? fallback?.bodySecondary ?? null,
    steps: row.steps ?? fallback?.steps ?? null,
    images: row.images ?? fallback?.images ?? null,
    imagePath: row.image_path ?? fallback?.imagePath ?? null,
    imageAlt: row.image_alt ?? fallback?.imageAlt ?? null,
    active: row.active,
  };
}

/**
 * The columns `toSection` reads.
 *
 * Exported, and asserted against by a test, because omitting one here does not
 * fail loudly: PostgREST returns `undefined` for a column that was not
 * selected, `toSection` falls back to the code copy, and — for `active` — the
 * section resolves as hidden. That exact omission shipped once: every section
 * on every migrated page disappeared, and the build was green.
 *
 * Never `select("*")` — the project rules forbid it, and a narrow column list
 * is the point.
 */
export const SECTION_SELECT =
  "section_key, eyebrow, heading, body, cta_label, cta_href, cta_secondary_label, cta_secondary_href, stat_line, body_secondary, steps, images, image_path, image_alt, active";

/**
 * One section, by key. Cached until the matching `revalidateTag` fires.
 *
 * ## Why the fallback is not used when the row is absent
 *
 * `site_sections_public_read` is `using (active = true)`, so anon cannot see a
 * row the editor has switched off. From this side, "hidden" and "absent" are
 * the same signal.
 *
 * This used to fall back to the code copy in both cases, which meant **"Hide
 * section" silently restored the hardcoded copy instead of removing the
 * section** — the exact opposite of what the button says, with no error to
 * notice. The fallback is for a database that is unreachable or unconfigured,
 * not for a decision an editor made, so it now applies only on a query error.
 *
 * The trade-off, stated plainly: a section key added in code before its seed
 * migration is applied renders nothing rather than the code copy. That is
 * visible immediately in development, and it is preferable to a control that
 * lies.
 */
export async function getSection(key: string): Promise<SiteSection> {
  "use cache";
  cacheLife("hours");
  cacheTag(sectionTag(key), SECTIONS_TAG);

  if (!isSupabaseConfigured()) {
    return fallbackFor(key) ?? hidden(key);
  }

  const { data, error } = await createClient()
    .from("site_sections")
    .select(SECTION_SELECT)
    .eq("section_key", key)
    .maybeSingle();

  // A database problem. Render the last-known-good copy rather than an empty
  // heading — an empty `<h1>` is worse than a stale one.
  if (error) {
    console.error(`[sections] "${key}" failed:`, error.message);
    return fallbackFor(key) ?? hidden(key);
  }

  // No row, no error: the editor switched it off. Render nothing.
  if (!data) return hidden(key);

  const row = data as SectionRow;
  // Defensive. Unreachable while the policy filters on `active`, and correct
  // the day it stops.
  if (!row.active) return hidden(key);

  return toSection(row);
}

/**
 * Every visible section on a page, in order.
 *
 * Used by pages that render a run of sections rather than named keys. Hidden
 * rows do not appear: `site_sections_public_read` filters them out at the
 * database, which is the same reason `getSection` cannot distinguish hidden
 * from absent.
 */
export async function getPageSections(pageKey: string): Promise<SiteSection[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(SECTIONS_TAG, `page:${pageKey}`);

  if (!isSupabaseConfigured()) return [];

  const { data, error } = await createClient()
    .from("site_sections")
    .select(SECTION_SELECT)
    .eq("page_key", pageKey)
    .order("sort_order");

  if (error || !data) {
    if (error) console.error(`[sections] page "${pageKey}" failed:`, error.message);
    return [];
  }

  return (data as SectionRow[]).map((row) =>
    row.active ? toSection(row) : hidden(row.section_key),
  );
}
