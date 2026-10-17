import Link from "next/link";

import { ProgrammeCard } from "@/components/sections/programme-card";
import type { Programme, SiteSection } from "@/lib/data/types";

/**
 * All copy in this section comes from `site_sections` (key `home-programmes`)
 * and the cards read from `programmes`. Nothing here is hardcoded, so an
 * editor can change a heading or reorder a programme without a deploy.
 *
 * Icon cards were replaced with image-based `content-card` styling — three
 * identical line icons above three identical cards reads as generated.
 */
export function Programmes({
  programmes,
  section,
}: {
  programmes: Programme[];
  section: SiteSection;
}) {
  if (programmes.length === 0) return null;

  return (
    <section aria-labelledby="programmes-heading" className="py-section bg-surface">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            {section.eyebrow ? (
              <p className="mb-3 text-sm font-medium tracking-wide text-brand-600 uppercase">
                {section.eyebrow}
              </p>
            ) : null}

            <h2
              id="programmes-heading"
              className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
            >
              {section.heading}
            </h2>

            {section.body ? (
              <p className="measure mt-4 text-lg text-ink-muted">{section.body}</p>
            ) : null}
          </div>

          {section.ctaHref ? (
            <Link
              href={section.ctaHref}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-brand-600 underline decoration-brand-600/30 underline-offset-4 hover:decoration-brand-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
            >
              {section.ctaLabel ?? "All programmes"}
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          ) : null}
        </div>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {programmes.map((programme) => (
            <li key={programme.slug} className="flex">
              <ProgrammeCard programme={programme} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}