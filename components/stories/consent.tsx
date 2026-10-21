import Link from "next/link";

import { Container } from "@/components/site/container";
import type { ConsentTierCounts } from "@/lib/data/impact";
import type { SiteSection } from "@/lib/data/types";

/**
 * The consent ledger, compact.
 *
 * Sits in the masthead, directly under the hero copy, so the first thing a
 * reader learns about this archive is that it is consent-managed. The roadmap's
 * argument is that this is *"rarer and more credible than an archive with 40
 * portraits of unnamed children"* — and it only works if it is read before the
 * photographs, not after them.
 *
 * Zero counts are shown rather than hidden. "0 anonymised" is a fact about the
 * archive; omitting it would make the ledger a highlight reel.
 */
export function ConsentLedger({ counts }: { counts: ConsentTierCounts }) {
  const total = counts.named_full + counts.named_no_face + counts.anonymised;

  // Nothing to count, and nothing honest to claim.
  if (total === 0) return null;

  const rows = [
    { label: "stories published", value: total },
    { label: "named & photographed", value: counts.named_full },
    { label: "named, not photographed", value: counts.named_no_face },
    { label: "anonymised", value: counts.anonymised },
  ];

  return (
    <dl className="mt-8 flex flex-wrap gap-2">
      {rows.map((row) => (
        <div
          key={row.label}
          className="inline-flex items-baseline gap-2 rounded-full border border-border bg-card px-4 py-2 text-[0.8125rem] text-ink-muted"
        >
          <dd className="tabular text-base font-semibold text-brand-600">{row.value}</dd>
          <dt>{row.label}</dt>
        </div>
      ))}
    </dl>
  );
}

/**
 * The full consent note.
 *
 * Kept as a section rather than folded into the ledger, because it is the only
 * place on the site that states the under-18 rule and links to the policy. A
 * donor, a funder or a journalist who wants to know how consent actually works
 * should find the answer without asking.
 */
export function ConsentNote({
  counts,
  section,
}: {
  counts: ConsentTierCounts;
  section: SiteSection;
}) {
  const total = counts.named_full + counts.named_no_face + counts.anonymised;

  return (
    <section aria-labelledby="consent-note-heading" className="bg-surface-lilac py-section">
      <Container>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2
              id="consent-note-heading"
              className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
            >
              {section.heading}
            </h2>
            {section.body ? (
              <p className="measure mt-4 text-lg text-ink-muted">{section.body}</p>
            ) : null}
            {section.ctaLabel && section.ctaHref ? (
              <Link
                href={section.ctaHref}
                className="mt-5 inline-flex min-h-11 items-center text-sm font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-700"
              >
                {section.ctaLabel}
              </Link>
            ) : null}
          </div>

          {total > 0 ? (
            <dl className="self-start">
              {[
                { term: "Named and photographed", count: counts.named_full },
                { term: "Named, not photographed", count: counts.named_no_face },
                { term: "Anonymised", count: counts.anonymised },
              ].map((row) => (
                <div
                  key={row.term}
                  className="flex items-baseline justify-between gap-4 border-b border-border py-3.5"
                >
                  <dt className="text-ink">{row.term}</dt>
                  <dd className="tabular text-lg font-semibold text-brand-600">
                    {row.count}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
