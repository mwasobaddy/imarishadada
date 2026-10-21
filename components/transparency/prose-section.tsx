import Link from "next/link";

import type { SiteSection } from "@/lib/data/types";

/**
 * A prose section with a heading, a body, an optional second paragraph and an
 * optional button.
 *
 * ## Why it was extracted
 *
 * It lived inside the page file, which meant the admin's live preview — which
 * renders the *real* components — had nothing to call for six of the seven
 * sections on `/transparency`. Every transparency section now renders through
 * this, so the preview and the page are the same code.
 *
 * ## Why the `id` is a prop
 *
 * The footer's "Raise a concern" link points at `/transparency#complaints`, and
 * the in-page navigation links to each anchor. The id is load-bearing, so it
 * travels with the section rather than being invented where it is used.
 */
export function ProseSection({
  id,
  section,
  children,
}: {
  /** The anchor this section is reached by. */
  id: string;
  section: SiteSection;
  /** Anything that belongs under the paragraph — a table, a list. */
  children?: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-2xl font-semibold tracking-tight text-brand-600 sm:text-3xl">
        {section.heading}
      </h2>
      {section.body ? (
        <p className="measure mt-4 leading-relaxed text-ink-muted">{section.body}</p>
      ) : null}
      {children}
      {section.bodySecondary ? (
        <p className="measure mt-6 border-l-2 border-brand-600/30 pl-5 text-sm leading-relaxed text-ink-muted">
          {section.bodySecondary}
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
    </section>
  );
}
