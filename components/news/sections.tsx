import Link from "next/link";

import type { SiteSection } from "@/lib/data/types";

/**
 * The news page's empty state.
 *
 * ## Why it exists
 *
 * Never an empty grid. It is shown when nothing is published, and when a
 * filter or a page is pointed at nothing — a reader who followed a link and
 * arrived at a blank list needs to be told what happened and what to do next.
 */
export function NewsEmpty({ section }: { section: SiteSection }) {
  return (
    <div className="rounded-card border-2 border-dashed border-brand-600/30 bg-surface-lilac p-10 text-center">
      <h2 className="text-2xl font-semibold text-brand-600">{section.heading}</h2>
      {section.body ? (
        <p className="measure mx-auto mt-3 leading-relaxed text-ink-muted">
          {section.body}
        </p>
      ) : null}
      {section.ctaLabel && section.ctaHref ? (
        <Link
          href={section.ctaHref}
          className="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
        >
          {section.ctaLabel} →
        </Link>
      ) : null}
    </div>
  );
}
