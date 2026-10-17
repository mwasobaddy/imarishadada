/**
 * Decorative dotted map of East Africa, centred on Kibera, Nairobi.
 *
 * ## The map is one asset, not 818 DOM nodes
 *
 * These dots originate in `svg-dotted-map`, but they are never generated at
 * render time. `scripts/generate-kenya-dots.mjs` produces
 * `public/brand/kenya-map.svg`, and this component is just a CSS background.
 *
 * Both intermediate designs were measured and rejected:
 *
 * - Rendering the points with the shadcn `DottedMap` cost ~25s per prerender
 *   worker and made the production build fail outright — `/_global-error`
 *   exceeded the 60s page budget. A fixed decorative background should not be
 *   recomputed on every build.
 * - Precomputing the coordinates and rendering them as React `<circle>`
 *   elements fixed the build but shipped 818 nodes to every device. `hidden`
 *   on mobile hides them visually while still paying parse and transfer cost.
 *
 * As a single SVG referenced by CSS it is one request and one DOM node, and it
 * is genuinely absent below `sm`.
 *
 * ## Why this shape
 *
 * `svg-dotted-map` projects lat/lng linearly and drops points over water, so
 * the dots trace coastlines and lakes. Its resolution scales with the CANVAS
 * and saturates: 150x75 tops out near 4,263 dots worldwide with only ~199 in
 * East Africa, which reads as a constellation rather than a coastline. The
 * committed 300x150 canvas at 50k samples resolves Kenya properly — 815 dots.
 * The window is 3:1 and places Nairobi at 67% / 49%, so the marker reads as
 * deliberate placement rather than an edge crop.
 *
 * ## Deliberate limits
 *
 * Hidden below `sm`: at 390px the 3:1 window scales to ~130px tall and the dots
 * land near 0.24px radius — invisible, on the weakest hardware.
 *
 * The marker is static rather than pulsing, because an animation cannot be
 * expressed in a static asset and `prefers-reduced-motion` could not suppress
 * the SMIL version anyway. It is aria-hidden, pointer-events-none, and never a
 * substitute for stating the location in text.
 */
export function KenyaMap({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={
        className ??
        "pointer-events-none absolute inset-0 hidden bg-[url('/brand/kenya-map.svg')] bg-cover bg-center opacity-[0.22] sm:block"
      }
    />
  );
}
