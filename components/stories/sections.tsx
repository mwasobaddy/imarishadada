import { Container } from "@/components/site/container";
import { SocialLinks, type SocialLink } from "@/components/site/social-links";
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
