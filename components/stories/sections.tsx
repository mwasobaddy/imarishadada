import Link from "next/link";

import { Container } from "@/components/site/container";
import { SocialLinks, type SocialLink } from "@/components/site/social-links";
import { FeaturedStoryCard } from "@/components/stories/featured-story";
import type { StoryCard } from "@/lib/data/impact";
import type { SiteSection } from "@/lib/data/types";

/**
 * The Ladies Room, our storytelling programme.
 *
 * ## Why it is a component
 *
 * It was written in the Stories page file, so the admin's live preview could
 * only draw an approximation of it. The page and the preview now render the
 * same thing.
 *
 * ## Why the channels are separate
 *
 * The URLs live in settings, not in this file, so a channel can be corrected
 * without a deploy — and a link that points nowhere is left out rather than
 * rendered.
 */
export function LadiesRoom({
  section,
  links,
  linksLabel,
}: {
  section: SiteSection;
  /** The channels, read from settings by the page. */
  links: SocialLink;
  /** The heading above the channels. */
  linksLabel: string;
}) {
  return (
    <section aria-labelledby="ladies-room-heading" className="bg-surface-lilac py-section">
      <Container>
        {section.eyebrow ? (
          <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
            {section.eyebrow}
          </p>
        ) : null}
        <h2
          id="ladies-room-heading"
          className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
        >
          {section.heading}
        </h2>
        {section.body ? (
          <p className="measure mt-4 text-lg leading-relaxed text-ink-muted">
            {section.body}
          </p>
        ) : null}

        <SocialLinks className="mt-8" links={links} label={linksLabel} />
      </Container>
    </section>
  );
}

/**
 * The editable parts of the stories index.
 *
 * ## Why they are components
 *
 * The featured story band and the empty state were written in the page and in
 * the grid component, so the admin's live preview could only draw an
 * approximation of them. The page and the preview now render the same code.
 */

/** The featured story, under its heading. */
export function StoriesFeatured({
  section,
  story,
}: {
  section: SiteSection;
  story: StoryCard | null;
}) {
  if (!story) return null;

  return (
    <section aria-labelledby="featured-heading" className="py-section bg-surface">
      <Container>
        <h2
          id="featured-heading"
          className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
        >
          {section.heading}
        </h2>
        <div className="mt-8">
          <FeaturedStoryCard story={story} />
        </div>
      </Container>
    </section>
  );
}

/**
 * Shown when no story has been published.
 *
 * Never an empty grid. It says what happened and what to do next, so a reader
 * who followed a link and arrived at nothing is not left guessing.
 */
export function StoriesEmpty({ section }: { section: SiteSection }) {
  return (
    <section aria-labelledby="stories-empty-heading" className="py-section bg-surface">
      <Container>
        <div className="rounded-card border-2 border-dashed border-brand-600/30 bg-surface-lilac p-8 text-center sm:p-12">
          <h2
            id="stories-empty-heading"
            className="text-xl font-semibold text-brand-600 sm:text-2xl"
          >
            {section.heading}
          </h2>
          {section.body ? (
            <p className="measure mx-auto mt-3 text-ink-muted">{section.body}</p>
          ) : null}
          {section.ctaLabel && section.ctaHref ? (
            <Link
              href={section.ctaHref}
              className="mt-7 inline-flex min-h-11 items-center text-sm font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-700"
            >
              {section.ctaLabel}
            </Link>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
