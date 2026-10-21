import { Container } from "@/components/site/container";
import { StoryCardItem } from "@/components/stories/story-card";
import type { StoryCard } from "@/lib/data/impact";
import type { SiteSection } from "@/lib/data/types";

/**
 * Other stories to read next.
 *
 * ## Omitted below three
 *
 * The roadmap is explicit — *"Three stories minimum, or omit the section"* — and
 * it is the right rule. A "more stories" row with one card in it is a worse
 * signal than no row at all: it tells the reader the archive is nearly empty,
 * which is true but is not what this section is for.
 *
 * ## Consent still applies to every card
 *
 * These are ordinary `StoryCardItem`s, so each one resolves its own tier. There
 * is no shortcut here that could show a face the tier forbids.
 */
export function RelatedStories({
  stories,
  section,
}: {
  stories: StoryCard[];
  section: SiteSection;
}) {
  if (stories.length < 3) return null;

  return (
    <section aria-labelledby="story-more-heading" className="py-section bg-surface">
      <Container>
        <h2
          id="story-more-heading"
          className="text-2xl font-semibold tracking-tight text-brand-600 sm:text-3xl"
        >
          {section.heading}
        </h2>

        <ul className="mt-8 grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <StoryCardItem key={story.slug} story={story} />
          ))}
        </ul>
      </Container>
    </section>
  );
}
