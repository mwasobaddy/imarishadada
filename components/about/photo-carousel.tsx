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
 * Swapping placeholders for real photography later means editing `CARDS` only —
 * the `alt` text is written to describe the eventual photograph, so it stays
 * correct once the real assets land.
 */
const CARDS: DepthCarouselItem[] = [
  {
    image: "/placeholders/card-1.svg",
    alt: "Placeholder for a photograph of students in a classroom in Kibera",
  },
  {
    image: "/placeholders/card-2.svg",
    alt: "Placeholder for a photograph of a mentor meeting with a student",
  },
  {
    image: "/placeholders/card-3.svg",
    alt: "Placeholder for a photograph of a young woman running her own business",
  },
  {
    image: "/placeholders/card-4.svg",
    alt: "Placeholder for a photograph of girls at the Dada Space",
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
        Placeholder images — to be replaced with consented photographs of the
        programme. Auto-advances, and pauses on hover or keyboard focus.
      </p>
    </div>
  );
}
