"use client";

import DepthCarousel, { type DepthCarouselItem } from "@/components/ui/depth-carousel";

/**
 * Project-configured wrapper around the vendored React Bits `DepthCarousel`.
 *
 * The upstream component is generic: it defaults to six remote `picsum.photos`
 * URLs and a near-black stage. Both are wrong here — the photographs must be
 * local consented ones, and the stage has to sit inside the About page's layout
 * rather than dictate its own full-bleed height.
 *
 * Autoplay and pause behaviour come from upstream and are left intact: it
 * blocks `navigateBy` while `hovered` or `focused` is set, so the carousel
 * pauses on mouse hover AND on keyboard focus, and it skips tweening entirely
 * when `prefers-reduced-motion: reduce` is set.
 *
 * ## The images come from the database now
 *
 * They used to be a `CARDS` array in this file — the last hardcoded image set
 * on the site, so changing a photograph meant editing code and deploying. They
 * live in `site_sections.images` for the `about-carousel` section and are
 * passed in from the server component.
 *
 * Alt text is required per image. A photograph of a participant with no alt is
 * an accessibility defect, not a warning, and the database rejects the row.
 *
 * @see doc/image-review.md §About
 */
export function AboutPhotoCarousel({
  images,
  caption,
  className,
}: {
  images: { path: string; alt: string }[];
  /** Shown under the stage. Comes from the section's body. */
  caption?: string | null;
  className?: string;
}) {
  // An empty carousel is worse than no carousel: it is a grey box that reads as
  // a broken image. The About page omits the section instead.
  if (images.length === 0) return null;

  const items: DepthCarouselItem[] = images.map((i) => ({
    image: i.path,
    alt: i.alt,
  }));

  return (
    <div className={className}>
      <DepthCarousel
        items={items}
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
        // the receding cards to near-black. These photographs are light, so a
        // gentler falloff keeps the stack legible as images rather than shadows.
        falloff={0.1}
        tint="#7B45B5"
        className="rounded-card"
      />

      {caption && (
        <p className="mt-4 text-xs leading-relaxed text-ink-muted">{caption}</p>
      )}
    </div>
  );
}
