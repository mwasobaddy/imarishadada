import { Container } from "@/components/site/container";
import { StoryCardItem } from "@/components/stories/story-card";
import { StoriesEmpty } from "@/components/stories/sections";
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
    return <StoriesEmpty section={emptySection} />;
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
