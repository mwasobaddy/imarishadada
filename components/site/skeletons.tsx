import { Container } from "@/components/site/container";
import { Skeleton, SkeletonLines, SkeletonStatus } from "@/components/ui/skeleton";

/**
 * Skeletons for the parts of the site that stream in.
 *
 * ## Why these exist
 *
 * Three parts of the site wait for the server: the story feed, the news feed
 * and the giving options. The shell around them is prerendered and arrives
 * at once, so without a fallback the reader gets a page with a hole in it —
 * a line of text, or nothing.
 *
 * ## The rule these follow
 *
 * Each one is built from the same blocks as the section it stands in for.
 * The story grid is two columns of cards with a 3:2 photograph and a
 * paragraph under it; the skeleton is two columns of cards with a 3:2 block
 * and a paragraph under it. The news grid is three columns of cards with a
 * 16:9 block; the skeleton is three columns of cards with a 16:9 block.
 *
 * A skeleton of the wrong shape is worse than no skeleton at all: the page
 * jumps when the content arrives, and the jump is the thing a skeleton was
 * supposed to prevent.
 *
 * ## What they are not
 *
 * They are not spinners, and they do not pretend to be content. There is no
 * fake headline, no fake photograph of a child, and no lorem ipsum. Every
 * block is an empty rectangle, which is honest: this is the shape of what is
 * coming, and nothing more.
 */

/* -------------------------------------------------------------------------- */
/* Stories                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * One card in the story archive.
 *
 * Mirrors `StoryCardItem`: a 3:2 image slot, then an eyebrow, a title and a
 * paragraph in the same padding.
 */
export function StoryCardSkeleton() {
  return (
    <li className="flex">
      <div className="flex h-full w-full flex-col overflow-hidden rounded-card border border-border bg-card">
        <Skeleton className="aspect-[3/2] w-full rounded-none" />
        <div className="flex flex-1 flex-col p-6 sm:p-7">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-3 h-5 w-4/5" />
          <SkeletonLines lines={3} className="mt-2.5" />
          {/* The attribution row, which the real card pins to the bottom. */}
          <div className="mt-auto flex items-baseline justify-between gap-x-4 border-t border-border pt-5">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
    </li>
  );
}

/**
 * The story feed: the programme filter, the featured story, and the archive
 * grid.
 */
export function StoriesFeedSkeleton() {
  return (
    <div aria-busy="true">
      <SkeletonStatus label="Loading stories" />

      {/* The filter row */}
      <section className="border-b border-border bg-surface py-6">
        <Container>
          <div className="flex flex-wrap gap-3">
            {/* The pills are as wide as their labels, and the labels differ. */}
            {[88, 120, 104, 96].map((width, index) => (
              <Skeleton
                key={index}
                className="h-11 rounded-lg"
                style={{ width }}
              />
            ))}
          </div>
        </Container>
      </section>

      {/* The featured story */}
      <section className="py-section bg-surface">
        <Container>
          <Skeleton className="h-9 w-2/5 sm:h-11" />
          {/* Mirrors `FeaturedStoryCard`: a 3:2 slot beside the words, and
              the same column ratio, so the height of the two matches. */}
          <div className="mt-8 overflow-hidden rounded-card border border-border bg-card lg:grid lg:grid-cols-[1.15fr_1fr]">
            <Skeleton className="aspect-[3/2] w-full rounded-none lg:aspect-auto lg:min-h-[26rem]" />
            <div className="flex flex-col justify-center p-8 sm:p-10">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="mt-4 h-8 w-11/12" />
              <SkeletonLines lines={4} className="mt-4" />
              <Skeleton className="mt-7 h-11 w-36 rounded-full" />
            </div>
          </div>
        </Container>
      </section>

      {/* The archive grid */}
      <section className="bg-surface py-section">
        <Container>
          <div className="max-w-2xl">
            <Skeleton className="h-9 w-3/5 sm:h-11" />
            <Skeleton className="mt-4 h-4 w-4/5" />
          </div>
          <ul className="mt-12 grid items-stretch gap-6 sm:grid-cols-2">
            {[0, 1, 2, 3].map((index) => (
              <StoryCardSkeleton key={index} />
            ))}
          </ul>
        </Container>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* News                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * One card in the news grid.
 *
 * Mirrors `PostCard`: a 16:9 image slot, then a category label, a title, a
 * date and an excerpt.
 */
export function PostCardSkeleton() {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-card border border-border bg-card">
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <div className="flex flex-1 flex-col p-6">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-2 h-5 w-11/12" />
        <Skeleton className="mt-2 h-3 w-32" />
        <SkeletonLines lines={3} className="mt-3" />
      </div>
    </article>
  );
}

/**
 * The news feed: the category filter, the featured post and the grid.
 */
export function NewsFeedSkeleton() {
  return (
    <div aria-busy="true">
      <SkeletonStatus label="Loading posts" />

      {/* The category filter */}
      <nav aria-label="News categories" className="border-b border-border bg-surface">
        <Container>
          <div className="flex flex-wrap gap-2 py-4">
            {[64, 96, 88, 112].map((width, index) => (
              <Skeleton
                key={index}
                className="h-9 rounded-full"
                style={{ width }}
              />
            ))}
          </div>
        </Container>
      </nav>

      <section className="bg-surface py-section">
        <Container>
          {/* The featured post */}
          <div className="mb-10">
            <Skeleton className="mb-4 h-4 w-40" />
            <div className="max-w-4xl">
              <article className="flex h-full flex-col overflow-hidden rounded-card border border-border bg-card">
                <Skeleton className="aspect-[16/9] w-full rounded-none" />
                <div className="flex flex-1 flex-col p-6">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="mt-2 h-7 w-3/4" />
                  <SkeletonLines lines={3} className="mt-3" />
                </div>
              </article>
            </div>
          </div>

          {/* The grid */}
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <li key={index}>
                <PostCardSkeleton />
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Giving                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The giving options: the amount, the currency, and what the gift does.
 *
 * Mirrors `TierSelector`: a legend, a two-column grid of amount cards, and a
 * currency select above them.
 */
export function GivingOptionsSkeleton() {
  return (
    <div aria-busy="true" className="space-y-6">
      <SkeletonStatus label="Loading giving options" />

      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-11 w-full max-w-xs rounded-lg" />

      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-5 shrink-0 rounded-full" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="mt-2 h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
