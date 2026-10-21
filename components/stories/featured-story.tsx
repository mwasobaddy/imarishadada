import Image from "next/image";
import Link from "next/link";

import type { StoryCard } from "@/lib/data/impact";

/**
 * The featured story at the top of the archive.
 *
 * ## Why this exists
 *
 * The archive used to open straight into a grid, which gave a reader no entry
 * point and gave the organisation no way to lead with anything. `charity: water`
 * — the reference archive for this kind of page — opens with one story, and the
 * pattern is worth copying: a single large card, a title that carries the hook,
 * and one action.
 *
 * ## The title is the hook, not the quote
 *
 * A quote-led card is a testimonial. A title-led card is a story. The whole
 * archive was quote-led, which is why it read as a wall of testimonials that
 * could not be scanned.
 *
 * ## A words-only featured story
 *
 * If the story is `named_no_face` or `anonymised` there is no photograph, and
 * the card collapses to a single column with the quote set large. It does not
 * render an empty frame where the image would be.
 */
export function FeaturedStoryCard({ story }: { story: StoryCard }) {
  // Same defence as the grid card: the tier is checked here as well as in the
  // data layer, so a reader change cannot leak a face.
  const mayShowImage = story.consentTier === "named_full" && Boolean(story.imagePath);
  const wordsOnly = !mayShowImage;

  return (
    <article
      className={`overflow-hidden rounded-card border border-border bg-card ${
        wordsOnly ? "" : "grid lg:grid-cols-[1.15fr_1fr]"
      }`}
    >
      {mayShowImage ? (
        <div className="relative aspect-[3/2] bg-surface-lilac lg:aspect-auto lg:min-h-[26rem]">
          {/* The LCP image on this page. `preload`, never `priority` — Next 16
              renamed it, and an animated hero is a delayed hero. */}
          <Image
            src={story.imagePath!}
            alt={story.imageAlt ?? ""}
            fill
            sizes="(max-width: 1024px) 92vw, 620px"
            preload
            className="object-cover"
          />
        </div>
      ) : null}

      <div className={wordsOnly ? "p-8 sm:p-12" : "flex flex-col justify-center p-8 sm:p-10"}>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold tracking-wide text-brand-600 uppercase">
          {story.programmeTitle ? <span>{story.programmeTitle}</span> : null}
          <span className="font-medium tracking-normal text-ink-muted normal-case">
            {new Intl.DateTimeFormat("en-KE", {
              month: "long",
              year: "numeric",
            }).format(new Date(story.publishedAt))}
            {story.readingMinutes ? ` · ${story.readingMinutes} min read` : ""}
          </span>
        </p>

        <h3
          className={`mt-4 font-semibold tracking-tight text-brand-600 ${
            wordsOnly ? "text-2xl sm:text-3xl" : "text-2xl"
          }`}
        >
          {story.title || "A story from Kibera"}
        </h3>

        <blockquote
          className={`mt-4 leading-relaxed text-ink ${
            wordsOnly ? "text-xl sm:text-2xl" : "text-lg"
          }`}
        >
          &ldquo;{story.quote}&rdquo;
        </blockquote>

        {story.consentTier !== "named_full" ? (
          <p className="mt-4 text-xs leading-relaxed text-ink-muted">
            {story.consentTier === "anonymised"
              ? "Name and photograph withheld at her request."
              : "Named with written consent. Photograph not published."}
          </p>
        ) : null}

        <Link
          href={`/stories/${story.slug}`}
          className="mt-7 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-full bg-brand px-6 text-sm font-semibold text-ink-inverse transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
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
    </article>
  );
}
