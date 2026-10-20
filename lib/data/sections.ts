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
  images: { path: string; alt: string }[] | null;
  image_path: string | null;
  image_alt: string | null;
};

/**
 * Fallbacks, used when Supabase is unreachable or a key is not seeded.
 *
 * These mirror `supabase/migrations/0013_pages.sql`. They exist so a database
 * blip renders the last-known-good copy rather than an empty heading — an
 * empty `<h1>` is worse than a stale one.
 */
const FALLBACKS: Record<string, SiteSection> = {
  "home-hero": {
    key: "home-hero",
    eyebrow: null,
    heading: "Every girl in Kibera deserves to go back to school.",
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
    heading: "Three programmes, one aim: a girl in Kibera decides her own future",
    body: "School re-entry, economic empowerment, and safe spaces — designed with girls and community leaders, not delivered to them.",
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
    heading: "We started with nineteen of them.",
    body: "Imarisha Dada began in Kibera with a simple observation: the girls who fell out of school here were not girls who had stopped learning. They were girls who had been pushed out — by pregnancy, by cost, by stigma, and by the assumption that a young mother had already chosen her path.",
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
    heading: "Three programmes, one aim: a girl in Kibera decides her own future.",
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
};

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
  };
}

const SELECT =
  "section_key, eyebrow, heading, body, cta_label, cta_href, cta_secondary_label, cta_secondary_href, stat_line, body_secondary, steps, images, image_path, image_alt";

/**
 * One section, by key. Cached until the matching `revalidateTag` fires.
 */
export async function getSection(key: string): Promise<SiteSection> {
  "use cache";
  cacheLife("hours");
  cacheTag(sectionTag(key), SECTIONS_TAG);

  if (!isSupabaseConfigured()) {
    return FALLBACKS[key] ?? { key, eyebrow: null, heading: "", body: null, ctaLabel: null, ctaHref: null };
  }

  const { data, error } = await createClient()
    .from("site_sections")
    .select(SELECT)
    .eq("section_key", key)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error(`[sections] "${key}" failed:`, error.message);
    return FALLBACKS[key] ?? { key, eyebrow: null, heading: "", body: null, ctaLabel: null, ctaHref: null };
  }

  return toSection(data as SectionRow);
}

/**
 * Every active section on a page, in order.
 *
 * Used by pages that render a run of sections rather than named keys.
 */
export async function getPageSections(pageKey: string): Promise<SiteSection[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(SECTIONS_TAG, `page:${pageKey}`);

  if (!isSupabaseConfigured()) return [];

  const { data, error } = await createClient()
    .from("site_sections")
    .select(SELECT)
    .eq("page_key", pageKey)
    .eq("active", true)
    .order("sort_order");

  if (error || !data) {
    if (error) console.error(`[sections] page "${pageKey}" failed:`, error.message);
    return [];
  }

  return (data as SectionRow[]).map(toSection);
}
