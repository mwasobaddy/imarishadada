import Link from "next/link";

import type { SiteSection } from "@/lib/data/types";

/**
 * The editable parts of `/faq`.
 *
 * ## Why the questions are not here
 *
 * The questions and answers live in the `faqs` table and are edited in
 * `/admin/faqs`, not in `site_sections` — a question is a row, not a paragraph
 * of page copy. What is editable as copy is the empty state and the closing
 * card, and those are what the admin's live preview renders.
 *
 * ## Why the empty state exists at all
 *
 * An empty shell would read as a broken page. The state says why: we publish
 * answers as they come up, and the reader can ask one in the meantime.
 */

/** Shown when no question has been published yet. */
export function FaqEmpty({ section }: { section: SiteSection }) {
  return (
    <div className="measure mx-auto max-w-xl rounded-card border-2 border-dashed border-brand-600/30 bg-surface-lilac p-8 text-center">
      <h2 className="text-xl font-semibold text-brand-600">{section.heading}</h2>
      {section.body ? <p className="mt-3 text-ink-muted">{section.body}</p> : null}
    </div>
  );
}

/** The closing card: still have a question? */
export function FaqContact({ section }: { section: SiteSection }) {
  return (
    <div className="rounded-2xl border border-brand-600/30 bg-brand-50 p-8">
      <h2 className="text-xl font-semibold text-brand-600">{section.heading}</h2>
      {section.body ? (
        <p className="measure mt-2 text-ink-muted">{section.body}</p>
      ) : null}
      {section.ctaLabel && section.ctaHref ? (
        <Link
          href={section.ctaHref}
          className="mt-6 inline-flex min-h-13 items-center justify-center rounded-lg bg-gold px-8 text-base font-semibold text-gold-ink transition-colors hover:bg-gold/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
        >
          {section.ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
