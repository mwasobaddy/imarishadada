import Link from "next/link";

import { Container } from "@/components/site/container";
import { StoryCardItem } from "@/components/stories/story-card";
import type { StoryCard } from "@/lib/data/impact";
import type { SiteSection } from "@/lib/data/types";

/**
 * The archive grid.
 *
 * A grid, not a carousel. The roadmap is explicit, and it is right: a carousel
 * hides every story but one from crawlers, from screen readers, and from anyone
 * who does not wait for it to rotate.
 *
 * ## Empty state
 *
 * Stories did not exist at launch, so this renders a written explanation rather
 * than an empty grid or a spinner. The copy is editable; the decision to render
 * the empty state instead of a zero-item grid is not.
 */
export function StoryGrid({
  stories,
  section,
  emptySection,
}: {
  stories: StoryCard[];
  section: SiteSection;
  emptySection: SiteSection;
}) {
  if (stories.length === 0) {
    return (
      <section aria-labelledby="stories-empty-heading" className="py-section bg-surface">
        <Container>
          <div className="rounded-card border-2 border-dashed border-brand-600/30 bg-surface-lilac p-8 text-center sm:p-12">
            <h2
              id="stories-empty-heading"
              className="text-xl font-semibold text-brand-600 sm:text-2xl"
            >
              {emptySection.heading}
            </h2>
            {emptySection.body ? (
              <p className="measure mx-auto mt-3 text-ink-muted">{emptySection.body}</p>
            ) : null}
            {emptySection.ctaLabel && emptySection.ctaHref ? (
              <Link
                href={emptySection.ctaHref}
                className="mt-7 inline-flex min-h-11 items-center text-sm font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-700"
              >
                {emptySection.ctaLabel}
              </Link>
            ) : null}
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section aria-labelledby="stories-grid-heading" className="py-section bg-surface">
      <Container>
        <div className="max-w-2xl">
          <h2
            id="stories-grid-heading"
            className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
          >
            {section.heading}
          </h2>
          {section.body ? (
            <p className="measure mt-4 text-lg text-ink-muted">{section.body}</p>
          ) : null}
        </div>

        <ul className="mt-12 grid items-stretch gap-6 sm:grid-cols-2">
          {stories.map((story, i) => (
            // The first row is above the fold on a phone, so its images are the
            // ones worth loading eagerly. Everything below lazy-loads.
            <StoryCardItem key={story.slug} story={story} priority={i < 2} />
          ))}
        </ul>
      </Container>
    </section>
  );
}
