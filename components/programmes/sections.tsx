import Link from "next/link";

import { Container } from "@/components/site/container";
import { JourneySnake } from "@/components/sections/journey-snake";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import type { SiteSection } from "@/lib/data/types";

/**
 * The editable sections of the programmes index.
 *
 * ## Why they are components
 *
 * They were written in the page file, so the admin's live preview could only
 * ever draw an approximation of them. The page and the preview now render the
 * same code.
 *
 * ## The pathway caveat is a gate, not copy
 *
 * `doc/roadmap/programmes.md` is explicit that the sequence is a claim rather
 * than a description, and that a donor will ask: "If Dada Space participants do
 * not in practice feed into re-entry and economic programmes, do not imply a
 * pipeline."
 *
 * The editor can reword the caveat — it lives in `programmes-pathway.body` —
 * but cannot switch it off. Removing it takes a code change, and therefore a
 * conversation. Same reasoning as the consent tiers.
 */
const PATHWAY_UNVERIFIED = true;

/** How the programmes fit together. */
export function ProgrammesPathway({ section }: { section: SiteSection }) {
  return (
    <section aria-labelledby="pathway-heading" className="bg-surface-lilac py-section">
      <Container>
        <div className="max-w-2xl">
          {section.eyebrow && (
            <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
              {section.eyebrow}
            </p>
          )}
          <h2
            id="pathway-heading"
            className="mt-3 text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
          >
            {section.heading}
          </h2>
        </div>

        {PATHWAY_UNVERIFIED ? (
          <p
            role="note"
            className="mt-8 max-w-2xl rounded-xl border-2 border-dashed border-brand-600/40 bg-surface p-5 text-sm leading-relaxed text-ink-muted"
          >
            <span className="font-semibold text-brand-600">Draft — not yet verified.</span>{" "}
            {section.body}
          </p>
        ) : null}

        <JourneySnake
          items={(section.steps ?? []).map((step) => ({
            title: step.title,
            body: step.description,
          }))}
        />
      </Container>
    </section>
  );
}

/** How we measure. */
export function ProgrammesMeasure({ section }: { section: SiteSection }) {
  return (
    <section aria-labelledby="measure-heading" className="bg-brand py-section">
      <Container>
        <div className="max-w-2xl">
          <h2
            id="measure-heading"
            className="text-3xl font-semibold tracking-tight text-ink-inverse sm:text-4xl"
          >
            {section.heading}
          </h2>
          <p className="measure mt-4 text-lg text-brand-100">{section.body}</p>
          <Link
            href={section.ctaHref ?? "/impact"}
            className="mt-6 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-brand-100 underline decoration-brand-100/40 underline-offset-4 hover:decoration-brand-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-50"
          >
            {section.ctaLabel}
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
        </div>
      </Container>
    </section>
  );
}

/** A gift that moves with a girl. */
export function ProgrammesUnrestricted({ section }: { section: SiteSection }) {
  return (
    <section aria-labelledby="unrestricted-heading" className="py-section bg-surface">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <h2
              id="unrestricted-heading"
              className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
            >
              {section.heading}
            </h2>
            <p className="measure mt-4 text-lg text-ink-muted">{section.body}</p>
          </div>

          <div className="flex flex-col justify-center rounded-2xl border border-brand-600/30 bg-brand-50 p-8">
            <p className="measure text-ink-muted">{section.bodySecondary}</p>
            <InteractiveHoverButton
              href={section.ctaHref ?? "/donate"}
              className="mt-6 min-h-13 w-fit rounded-full bg-gold px-8 text-base font-semibold text-gold-ink"
            >
              {section.ctaLabel}
            </InteractiveHoverButton>
          </div>
        </div>
      </Container>
    </section>
  );
}
