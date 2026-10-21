import Image from "next/image";
import Link from "next/link";

import type { StoryCard } from "@/lib/data/impact";

/**
 * One story in the archive.
 *
 * ## Two card types, deliberately
 *
 * | Tier | The image slot holds |
 * |---|---|
 * | `named_full` | The photograph |
 * | `named_no_face` | **The words.** No image element exists. |
 * | `anonymised` | **The words.** No image element exists. |
 *
 * The first version of this put a small note in a pale box where the photograph
 * would have been, and it read as a card that had **failed to load**. A
 * screenshot made that obvious in a way the markup did not.
 *
 * So the absence is not a gap. The quote takes the space the photograph would
 * have taken and is set at display size, and the tier is explained quietly
 * underneath. When we cannot show her face we show more of her words — which is
 * the honest version of the same idea, and it means a no-image card looks
 * designed rather than broken.
 *
 * ## Consent is already resolved
 *
 * `imagePath` arrives null for any tier that cannot show a face, and
 * `attribution` arrives null for `anonymised`. There is no tier check in this
 * file that could be got wrong, and no image element to hide with CSS — which
 * would still have downloaded the file.
 *
 * ## Reading order
 *
 * The eyebrow, title and dek come **first in the DOM** for both card types, and
 * the image slot is moved above them with CSS `order`. A screen reader
 * announcing the link gets the title before the pull quote, which is how a
 * reader scans the grid; the visual order is unchanged.
 */
export function StoryCardItem({
  story,
  priority = false,
}: {
  story: StoryCard;
  /** True for the first row only, so the LCP image is not lazy-loaded. */
  priority?: boolean;
}) {
  // Two independent conditions, deliberately.
  //
  // `getStories` already nulls `imagePath` for any tier that cannot show a
  // face. This repeats the check anyway, so a future change to the reader
  // cannot put a photograph of a minor on the page. The roadmap is explicit:
  // *"the component must not have an image element for those tiers"*.
  const mayShowImage = story.consentTier === "named_full" && Boolean(story.imagePath);
  const wordsOnly = !mayShowImage;

  const tierLabel =
    story.consentTier === "named_full"
      ? "Named & photographed"
      : story.consentTier === "named_no_face"
        ? "Named · no photo"
        : "Anonymised";

  const attribution =
    story.consentTier === "anonymised"
      ? "Name withheld at her request"
      : (story.attribution ?? "Name withheld");

  // A words-only card already shows the quote at display size. Printing it
  // again as the dek would be the same sentence twice in one card.
  const showDek = story.excerpt && !(wordsOnly && story.excerptFromQuote);

  return (
    <li className="flex">
      <Link
        href={`/stories/${story.slug}`}
        className="group flex h-full w-full flex-col overflow-hidden rounded-card border border-border bg-card transition-colors hover:border-brand-600/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
      >
        {/* ---- The image slot ------------------------------------------- */}
        {mayShowImage ? (
          <div className="relative order-1 aspect-[3/2] overflow-hidden bg-surface-lilac">
            <Image
              src={story.imagePath!}
              alt={story.imageAlt ?? ""}
              width={640}
              height={420}
              sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 560px"
              preload={priority}
              className="h-full w-full object-cover transition-transform duration-500 motion-reduce:transition-none group-hover:scale-[1.02]"
            />
          </div>
        ) : (
          <div className="relative order-1 flex aspect-[3/2] flex-col justify-between overflow-hidden bg-[radial-gradient(120%_100%_at_10%_0%,var(--color-surface-pink)_0%,transparent_58%),radial-gradient(95%_95%_at_92%_100%,var(--color-brand-50)_0%,transparent_62%)] bg-surface-lilac p-6 sm:p-8">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-7 left-3 font-serif text-[10rem] leading-none text-brand-600/10 select-none"
            >
              &ldquo;
            </span>

            <p className="relative mt-6 text-[1.6875rem] leading-[1.34] font-medium tracking-tight text-ink">
              &ldquo;{story.quote}&rdquo;
            </p>

            <p className="relative mt-5 border-t border-brand-600/20 pt-3.5 text-xs leading-relaxed text-ink-muted">
              {story.consentTier === "anonymised" ? (
                <>
                  <strong className="font-semibold text-brand-600">
                    Name and photograph withheld at her request.
                  </strong>{" "}
                  We will not reveal either to anyone — funder or journalist.
                </>
              ) : (
                <>
                  <strong className="font-semibold text-brand-600">
                    Photograph not published.
                  </strong>{" "}
                  Her consent covered her words, not her image.
                </>
              )}
            </p>
          </div>
        )}

        {/* ---- The editorial block -------------------------------------- */}
        <div className="order-2 flex flex-1 flex-col p-6 sm:p-7">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold tracking-wide text-brand-600 uppercase">
            {story.programmeTitle ? <span>{story.programmeTitle}</span> : null}
            {story.readingMinutes ? (
              <span className="font-medium tracking-normal text-ink-muted normal-case">
                · {story.readingMinutes} min read
              </span>
            ) : null}
          </p>

          <h3 className="mt-3 text-xl leading-snug font-semibold tracking-tight text-brand-600">
            {story.title || "A story from Kibera"}
          </h3>

          {showDek ? (
            <p className="measure mt-2.5 text-base leading-relaxed text-ink-muted">
              {story.excerpt}
            </p>
          ) : null}

          <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-border pt-5 text-sm text-ink-muted">
            <span>— {attribution}</span>
            <span className="text-xs">{tierLabel}</span>
          </div>
        </div>
      </Link>
    </li>
  );
}
