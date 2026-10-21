import { Container } from "@/components/site/container";
import { PullQuote } from "@/components/site/pull-quote";
import type { SiteSection } from "@/lib/data/types";

/**
 * A content block on a programme page.
 *
 * ## Why this exists
 *
 * A programme page used to be a title, a paragraph of body copy and a grid of
 * outcomes, with the framing sentence hardcoded in a component. Everything an
 * editor could not reach stayed there, and the framing was wrong for two of the
 * three programmes.
 *
 * The copy now lives in `site_sections` like the rest of the site, and this
 * renders it. One component covers the shapes a programme page needs:
 *
 *   - **Prose.** A heading and paragraphs.
 *   - **A list.** A heading and a set of items, such as the ten problems the
 *     girls in Dada Space name.
 *   - **A position.** A heading and nothing else. That is a quote, and it is
 *     set as one rather than as a section heading with an empty band under it.
 */
export function ProgrammeContent({ section }: { section: SiteSection }) {
  const steps = section.steps ?? [];
  const paragraphs = (section.body ?? "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const headingId = `${section.key}-heading`;

  // A heading with nothing under it is a position, not a block of copy.
  if (paragraphs.length === 0 && steps.length === 0) {
    return (
      <section className="bg-surface-lilac py-section">
        <Container>
          <PullQuote eyebrow={section.eyebrow} quote={section.heading} />
        </Container>
      </section>
    );
  }

  return (
    <section aria-labelledby={headingId} className="bg-surface py-section">
      <Container>
        {section.eyebrow?.trim() ? (
          <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
            {section.eyebrow}
          </p>
        ) : null}

        <h2
          id={headingId}
          className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
        >
          {section.heading}
        </h2>

        {paragraphs.map((paragraph, index) => (
          <p key={index} className="measure mt-4 text-lg leading-relaxed text-ink-muted">
            {paragraph}
          </p>
        ))}

        {steps.length > 0 ? (
          <ul className="mt-10 grid gap-5 sm:grid-cols-2">
            {steps.map((step, index) => (
              <li key={`${section.key}-${index}`} className="rounded-card border border-border bg-card p-6">
                <h3 className="text-lg font-semibold text-ink">{step.title}</h3>
                {step.description ? (
                  <p className="mt-2 text-base leading-relaxed text-ink-muted">
                    {step.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </Container>
    </section>
  );
}
