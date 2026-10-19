import type { MetadataRoute } from "next";

import { getProgrammeSlugs } from "@/lib/data/programmes";
import { PUBLISHED_LOCALES, localePath } from "@/lib/seo";

/**
 * `lastModified` for every route.
 *
 * Deliberately a fixed date rather than `new Date()`. Two reasons:
 *
 *   * `new Date()` inside the exported function is an unstable value under
 *     `cacheComponents` and fails prerendering.
 *   * More importantly, a build-time timestamp is a **lie** to a search
 *     engine. It says "this page changed at the moment we deployed", for every
 *     page, on every deploy — including pages that did not change. Search
 *     engines learn to ignore `lastModified` that is always now, and then it
 *     stops being a useful signal at all.
 *
 * Until a CMS gives us per-page timestamps, a single honest review date is
 * better than a per-deploy one.
 *
 * @see doc/roadmap/system-files.md §1
 */
const LAST_MODIFIED = new Date("2026-10-18T00:00:00.000Z");

/**
 * Every URL carries a full `languages` map. A bare URL would create an orphan
 * hreflang entry, which is a defect.
 * @see doc/roadmap/system-files.md §1
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] = [
    { path: "", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/donate", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/impact", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/about", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/ways-to-give", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/stories", priority: 0.7, changeFrequency: "weekly" as const },
    { path: "/partner", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/volunteer", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/transparency", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/faq", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.6, changeFrequency: "yearly" as const },
    { path: "/annual-report", priority: 0.6, changeFrequency: "yearly" as const },
    { path: "/news", priority: 0.5, changeFrequency: "weekly" as const },
    // Policy pages are indexable and are what a funder, a regulator or a
    // worried parent searches for. They are excluded from the 404's
    // `robots: { index: false }`, so leaving them out of the sitemap was an
    // omission rather than a decision.
    { path: "/legal/safeguarding", priority: 0.5, changeFrequency: "yearly" as const },
    { path: "/legal/privacy", priority: 0.4, changeFrequency: "yearly" as const },
    { path: "/legal/terms", priority: 0.4, changeFrequency: "yearly" as const },
    { path: "/legal/cookies", priority: 0.3, changeFrequency: "yearly" as const },
  ];

  const base = "https://imarishadada.org";

  // Programme detail pages are database-driven, so their slugs come from the
  // content layer rather than a hardcoded list here. Missing them would leave
  // the three highest-intent URLs out of the sitemap entirely.
  const programmeRoutes = (await getProgrammeSlugs()).map((slug) => ({
    path: `/programmes/${slug}`,
    priority: 0.8,
    changeFrequency: "monthly" as const,
  }));

  return [...routes, ...programmeRoutes].map((route) => ({
    url: `${base}${localePath("en", route.path)}`,
    lastModified: LAST_MODIFIED,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    // Only locales that resolve. Advertising `sw`/`fr`/`de`/`pt` here while
    // those routes 404 tells a search engine the translations are broken, which
    // can de-index the English page. `PUBLISHED_LOCALES` grows when localisation
    // ships; nothing else here changes.
    alternates: {
      languages: Object.fromEntries([
        ...PUBLISHED_LOCALES.map((locale) => [
          locale,
          `${base}${localePath(locale, route.path)}`,
        ]),
        ["x-default", `${base}${localePath("en", route.path)}`],
      ]),
    },
  }));
}