import { Container } from "@/components/site/container";
import { JourneySnake } from "@/components/sections/journey-snake";
import { REPORTING_PERIOD } from "@/lib/data/reporting-period";
import type { SiteSection } from "@/lib/data/types";

/**
 * How the figures were counted.
 *
 * ## Why the definitions get a spine
 *
 * They are read in order, top to bottom, so they get a list device. Not a
 * snake: a snake would claim these are stages of a process, and they are
 * definitions, not stages.
 *
 * ## Why the period is rendered and not written
 *
 * It appears six times on the page and must agree with the period on every
 * figure. Written into editable copy it would drift the first time somebody
 * updated a number without updating the sentence around it — and on this page
 * a figure covering the wrong period is not a typo, it is the whole argument
 * failing.
 */
export function ImpactMethodology({ section }: { section: SiteSection }) {
  return (
    <section aria-labelledby="method-heading" className="bg-surface-lilac py-section">
      <Container>
        <div className="max-w-2xl">
          {section.eyebrow ? (
            <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
              {section.eyebrow}
            </p>
          ) : null}
          <h2
            id="method-heading"
            className="mt-3 text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
          >
            {section.heading}
          </h2>
          {section.body ? (
            <p className="measure mt-4 text-lg text-ink-muted">{section.body}</p>
          ) : null}
        </div>

        <dl className="mt-12">
          <JourneySnake
            variant="spine"
            pinRing="surface-lilac"
            items={(section.steps ?? []).map((step) => ({
              title: step.title,
              card: (
                <div className="rounded-card border border-border bg-card p-6">
                  <dt className="text-lg font-semibold text-brand-600">
                    {step.title}
                  </dt>
                  <dd className="measure mt-1 text-ink-muted">{step.description}</dd>
                </div>
              ),
            }))}
          />
        </dl>

        <p className="mt-8 text-sm text-ink-muted">
          <strong className="text-ink">Reporting period:</strong>{" "}
          {REPORTING_PERIOD.from} to {REPORTING_PERIOD.to}.
        </p>
      </Container>
    </section>
  );
}
