import Link from "next/link";

import type { FeaturedStory } from "@/lib/data/types";

/**
 * Custom block rather than @magicui/quote (does not exist) or
 * @aceternity/animated-testimonials (a carousel — heavier, and it hides content
 * from crawlers and screen readers).
 *
 * Renders nothing when there is no eligible story. The section is omitted
 * rather than filled with a placeholder.
 */
export function FeaturedStory({ story }: { story: FeaturedStory | null }) {
  if (!story) return null;

  const anonymised = story.consentTier === "anonymised";
  const noFace = story.consentTier === "named_no_face";

  return (
    <section aria-labelledby="story-heading" className="bg-surface-sand py-section">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
          <div>
            <p className="text-sm font-medium tracking-wide text-accent uppercase">
              One girl
            </p>
            <h2
              id="story-heading"
              className="mt-3 text-3xl font-semibold tracking-tight text-brand-900 sm:text-4xl"
            >
              {anonymised ? "A story we can only tell partly" : story.slug.replace(/-/g, " ")}
            </h2>
            <p className="measure mt-4 text-lg text-ink-muted">
              Every figure on this site came from a person. Here is one of them.
            </p>

            <Link
              href={`/stories/${story.slug}`}
              className="mt-8 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-brand-800 underline decoration-brand-800/30 underline-offset-4 hover:decoration-brand-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
            >
              Read her story
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

          <figure className="rounded-card border border-brand-900/10 bg-white p-8 sm:p-10">
            <blockquote className="measure text-xl leading-relaxed text-brand-900 sm:text-2xl">
              <p>“{story.quote}”</p>
            </blockquote>

            <figcaption className="mt-6 border-t border-brand-900/10 pt-5 text-sm">
              {anonymised ? (
                <span className="text-ink-muted">
                  Shared with consent. Name withheld to protect privacy.
                </span>
              ) : (
                <span className="text-ink-muted">
                  {story.attribution ? <>{story.attribution}</> : null}
                  {" · "}
                  <span className="text-ink-muted">
                    Name used with written consent.
                  </span>
                </span>
              )}
            </figcaption>

            {/* Consent notice rendered for every tier that shows a name. */}
            {noFace || story.consentTier === "named_full" ? (
              <p className="mt-4 rounded-lg bg-brand-50 px-4 py-3 text-xs text-ink-muted">
                This participant read this story and approved these words before we
                published them.
              </p>
            ) : null}
          </figure>
        </div>
      </div>
    </section>
  );
}