import Link from "next/link";

import { Container } from "@/components/site/container";
import type { ImpactStat, Programme, SiteSection } from "@/lib/data/types";

/**
 * The figures, grouped by programme.
 *
 * ## Why this is a component and not part of the page
 *
 * It was inline in the page, which meant the admin's live preview could not
 * show it: the preview renders the *real* component, and there was no real
 * component. Extracting it gives the page and the preview one implementation.
 */
export function ImpactByProgramme({
  section,
  programmes,
  stats,
}: {
  section: SiteSection;
  programmes: Programme[];
  stats: ImpactStat[];
}) {
  // A programme with no figures is not shown. An empty card under a heading
  // that says "by programme" reads as a failure, not as honesty.
  const byProgramme = programmes
    .map((programme) => ({
      programme,
      stats: stats.filter((s) => s.programmeSlug === programme.slug),
    }))
    .filter((entry) => entry.stats.length > 0);

  if (byProgramme.length === 0) return null;

  return (
    <section aria-labelledby="by-programme-heading" className="py-section bg-surface">
      <Container>
        <h2
          id="by-programme-heading"
          className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
        >
          {section.heading}
        </h2>

        {section.body ? (
          <p className="measure mt-4 text-lg text-ink-muted">{section.body}</p>
        ) : null}

        <div className="mt-12 space-y-5">
          {byProgramme.map(({ programme, stats: rows }) => (
            <article
              key={programme.slug}
              className="rounded-card border border-border bg-card p-6 sm:p-8"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="text-xl font-semibold text-brand-600">
                  {programme.title}
                </h3>
                <Link
                  href={`/programmes/${programme.slug}`}
                  className="text-sm font-medium text-brand-600 underline decoration-brand-600/30 underline-offset-4 hover:decoration-brand-700"
                >
                  About this programme
                </Link>
              </div>

              <dl className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rows.map((row) => (
                  <div key={row.slug}>
                    <dt className="text-sm text-ink-muted">
                      {row.label}
                      <span className="mt-2 inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600">
                        {row.period}
                      </span>
                    </dt>
                    <dd className="tabular mt-1 text-4xl font-semibold text-brand-600">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
