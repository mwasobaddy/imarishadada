import { Container } from "@/components/site/container";
import type { SiteSection } from "@/lib/data/types";

/**
 * What we do not yet measure.
 *
 * ## Where the list comes from
 *
 * From `transparency_gaps`, not from a constant in this file and not from a
 * second list on the transparency page. The same four gaps were written twice,
 * in two phrasings; migration 0018 settled on one and both pages read it.
 */
export function ImpactGaps({
  section,
  gaps,
}: {
  section: SiteSection;
  gaps: string[];
}) {
  return (
    <section aria-labelledby="gaps-heading" className="py-section bg-surface">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-16">
          <div>
            <h2
              id="gaps-heading"
              className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
            >
              {section.heading}
            </h2>
            {section.body ? (
              <p className="measure mt-4 text-lg text-ink-muted">{section.body}</p>
            ) : null}
          </div>

          <ul className="space-y-4">
            {gaps.map((gap) => (
              <li
                key={gap}
                className="flex gap-4 rounded-card border-2 border-dashed border-brand-600/30 bg-surface-lilac p-5"
              >
                <span aria-hidden="true" className="text-brand-600">
                  ✕
                </span>
                <span className="text-ink-muted">{gap}</span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
