"use client";

import DepthCarousel, { type DepthCarouselItem } from "@/components/ui/depth-carousel";

/**
 * Project-configured wrapper around the vendored React Bits `DepthCarousel`.
 *
 * The upstream component is generic: it defaults to six remote `picsum.photos`
 * URLs and a near-black stage. Both are wrong here — the placeholders must be
 * local, consented-subject slots, and the stage has to sit inside the About
 * page's layout rather than dictate its own full-bleed height.
 *
 * Autoplay and pause behaviour come from upstream and are left intact:
 * it blocks `navigateBy` while `hovered` or `focused` is set, so the carousel
 * pauses on mouse hover AND on keyboard focus, and it skips tweening entirely
 * when `prefers-reduced-motion: reduce` is set.
 *
 * These are **real photographs** from the organisation's own sessions, published
 * with written consent. The selection and placement decisions are recorded in
 * `doc/image-review.md`.
 *
 * The `alt` text describes each photograph, not a placeholder, so it stays
 * correct as the carousel is re-curated.
 */
const CARDS: DepthCarouselItem[] = [
  {
    image: "/images/about/about-two-women-classroom.avif",
    alt: "Two young women smiling together in a classroom in Kibera",
  },
  {
    image: "/images/about/about-mentor-and-participant.avif",
    alt: "A participant and a younger girl seated together during a session",
  },
  {
    image: "/images/about/about-core-values-presentation.avif",
    alt: "A participant presenting a chart to her group during a session",
  },
  {
    image: "/images/about/about-outdoor-candid.avif",
    alt: "Participants in branded t-shirts talking outdoors after a session",
  },
  {
    image: "/images/about/about-group-outdoors.avif",
    alt: "The full group photographed outside the community centre",
  },
  {
    image: "/images/about/about-facilitation.avif",
    alt: "A participant drawing on a flipchart while the group watches",
  },
];

export function AboutPhotoCarousel({ className }: { className?: string }) {
  return (
    <div className={className}>
      <DepthCarousel
        items={CARDS}
        autoplay
        autoplayDelay={4200}
        loop
        // Upstream default is 300x380; slightly wider suits the two-column grid.
        cardWidth={260}
        cardHeight={330}
        visibleCards={3}
        depth={180}
        spread={78}
        blur={4}
        duration={760}
        // Upstream falls off at 0.2, which combined with the multiply tint drove
        // the receding cards to near-black. These placeholders are light, so a
        // gentler falloff keeps the stack legible as images rather than shadows.
        falloff={0.1}
        tint="#7B45B5"
        className="rounded-card"
      />

      <p className="mt-4 text-xs leading-relaxed text-ink-muted">
        Programmes and sessions in Kibera, photographed by Suma and published
        with written consent. Auto-advances, and pauses on hover or keyboard
        focus.
      </p>
    </div>
  );
}
