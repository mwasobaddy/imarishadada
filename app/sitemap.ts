import type { MetadataRoute } from "next";

import { LOCALES, localePath } from "@/lib/seo";

// Module scope: `new Date()` inside the exported function is an unstable value
// under `cacheComponents` and fails prerendering. Replace with real content
// timestamps once a CMS is wired (doc/roadmap/system-files.md §1).
const LAST_MODIFIED = new Date();

/**
 * Every URL carries a full `languages` map. A bare URL would create an orphan
 * hreflang entry, which is a defect.
 * @see doc/roadmap/system-files.md §1
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/donate", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/programmes", priority: 0.8, changeFrequency: "monthly" as const },
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
  ];

  const base = "https://imarishadada.org";

  return routes.map((route) => ({
    url: `${base}${localePath("en", route.path)}`,
    lastModified: LAST_MODIFIED,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    alternates: {
      languages: Object.fromEntries(
        LOCALES.map((locale) => [locale, `${base}${localePath(locale, route.path)}`]),
      ),
    },
  }));
}