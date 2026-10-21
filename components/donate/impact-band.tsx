import Link from "next/link";

import type { ImpactStat, SiteSection } from "@/lib/data/types";

/**
 * The reason to give, above the form.
 *
 * ## Why this exists
 *
 * Nielsen Norman Group's research on donation barriers found that one of the
 * biggest is *"users not finding enough information about what the organization
 * does, and how they will spend the donated money."* The page opened with a
 * heading and one sentence, and then asked for a card number.
 *
 * ## The figure is rendered, never written
 *
 * The number comes from `impact_stats` — the same dated rows `/impact`
 * publishes, each carrying its own period. It is **not** in the section copy,
 * because a donation page that overstates its impact is a legal problem rather
 * than a copy problem.
 *
 * An editor chooses which figure leads by reordering at `/admin/impact`. The
 * editable copy is only the sentence around it, which is why the two cannot
 * drift: there is no number for anyone to mistype.
 *
 * ## Nothing renders if there is nothing true to say
 *
 * With no active impact stat and no copy, the band is omitted rather than
 * filled with a claim. An empty `19` would be worse than no band.
 */
export function ImpactBand({
  stat,
  section,
}: {
  stat: ImpactStat | null;
  section: SiteSection;
}) {
  const hasCopy = Boolean(section.body);

  // A band with no figure and no sentence is a coloured rectangle.
  if (!stat && !hasCopy) return null;

  return (
    <aside
      aria-labelledby="donate-impact-heading"
      className="mt-8 flex max-w-2xl items-start gap-5 rounded-xl border border-border border-l-4 border-l-brand-600 bg-brand-50 p-5 sm:gap-6 sm:p-6"
    >
      <h2 id="donate-impact-heading" className="sr-only">
        {section.heading}
      </h2>

      {stat ? (
        <p
          aria-hidden="true"
          className="tabular shrink-0 text-4xl leading-none font-semibold text-brand-600 sm:text-5xl"
        >
          {stat.value}
        </p>
      ) : null}

      <div className="min-w-0">
        {stat ? (
          // The figure, its label and its period are one sentence so a screen
          // reader hears "19 young mothers returned to school in 2025–26"
          // rather than a bare number followed by disconnected text.
          <p className="text-base leading-relaxed text-ink">
            <span className="sr-only">
              {stat.value} {stat.label} in {stat.period}.
            </span>
            <span aria-hidden="true" className="font-medium">
              {stat.label.charAt(0).toUpperCase() + stat.label.slice(1)} in{" "}
              {stat.period}.
            </span>
          </p>
        ) : null}

        {hasCopy ? (
          <p className="measure mt-1.5 text-base leading-relaxed text-ink-muted">
            {section.body}
          </p>
        ) : null}

        {section.ctaLabel && section.ctaHref ? (
          <Link
            href={section.ctaHref}
            className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
          >
            {section.ctaLabel} →
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
