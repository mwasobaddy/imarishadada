import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/site/container";
import { REPORTING_PERIOD } from "@/lib/data/reporting-period";
import type { SiteSection } from "@/lib/data/types";

/**
 * The photographs, and the written record.
 *
 * ## Why the photographs are here
 *
 * A number with no picture behind it is an assertion. The figures on this page
 * are the organisation's own, and putting a face to "19 young mothers back in
 * school" is what makes the number mean something to a donor who has never
 * heard of Kibera. Every photograph here is consented and credited in
 * doc/image-review.md.
 *
 * ## Why the two documents stay in code
 *
 * A document is a row in a table — title, description, file URL, published
 * date — not a paragraph of page copy, and the annual report's title is
 * derived from the reporting period, so it has to move with the figures.
 * Putting either into `site_sections` would freeze the period into prose and
 * give the safeguarding policy a second, unversioned home when it already has
 * a route. The `documents` table is the next piece of work, not this one.
 */
export function ImpactReports({ section }: { section: SiteSection }) {
  const photos = section.images ?? [];

  return (
    <section aria-labelledby="reports-heading" className="bg-brand py-section">
      <Container>
        <div className="max-w-2xl">
          <h2
            id="reports-heading"
            className="text-3xl font-semibold tracking-tight text-ink-inverse sm:text-4xl"
          >
            {section.heading}
          </h2>
          {section.body ? (
            <p className="measure mt-4 text-lg text-brand-100">{section.body}</p>
          ) : null}
        </div>

        {photos.length > 0 ? (
          <ul className="mt-12 grid gap-5 sm:grid-cols-2">
            {photos.map((photo) => (
              <li
                key={photo.path}
                className="overflow-hidden rounded-card bg-brand-100/10"
              >
                <Image
                  src={photo.path}
                  alt={photo.alt}
                  width={1400}
                  height={933}
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 560px"
                  className="aspect-[3/2] w-full object-cover"
                />
                {photo.caption ? (
                  <p className="px-5 py-3 text-sm text-brand-100">{photo.caption}</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        <h3 className="mt-12 text-sm font-semibold tracking-wide text-brand-100 uppercase">
          The written record
        </h3>
        <ul className="mt-5 space-y-3">
          <li className="rounded-card border border-brand-100/30 bg-brand-100/10 p-5">
            <p className="font-semibold text-ink-inverse">
              Annual Report {REPORTING_PERIOD.label}
            </p>
            <p className="mt-1 text-sm text-brand-100">
              In preparation. Published once it is complete and signed off.
            </p>
          </li>
          <li className="rounded-card border border-brand-100/30 bg-brand-100/10 p-5">
            <p className="font-semibold text-ink-inverse">Safeguarding policy</p>
            <p className="mt-1 text-sm text-brand-100">
              How we protect the children and young women we work with.
            </p>
            <Link
              href="/legal/safeguarding"
              className="mt-2 inline-block text-sm font-medium text-brand-100 underline decoration-brand-100/40 underline-offset-4 hover:decoration-brand-100"
            >
              Read the policy
            </Link>
          </li>
        </ul>
      </Container>
    </section>
  );
}
