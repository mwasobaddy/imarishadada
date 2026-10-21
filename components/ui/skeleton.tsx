/**
 * The skeleton primitive.
 *
 * ## What a skeleton is for
 *
 * A placeholder that occupies the space the real thing will occupy, so the
 * page does not jump when the content arrives. It is not a spinner: a spinner
 * tells you something is happening and a skeleton shows you what is coming.
 *
 * ## The rules it follows
 *
 * **The shape is the page's shape.** Every skeleton in this codebase is built
 * from the same blocks as the section it stands in for — the same aspect
 * ratios, the same column counts, the same padding. A skeleton that is a
 * different shape from the content is worse than no skeleton, because the
 * layout shifts when the real thing arrives.
 *
 * **It moves nothing.** The animation is opacity, not width, not height, not
 * transform. A skeleton that animates its own size is a layout shift waiting
 * to happen.
 *
 * **It stops when the reader has asked it to.** `motion-reduce:animate-none`
 * turns the pulse off for anyone whose system asks for reduced motion.
 *
 * **It is not colour-coded as brand.** The blocks are the site's own lilac
 * surface, so a page that is still loading looks like the site rather than
 * like a different site.
 */
export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  /** For widths that no class can express, such as a measured label. */
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      style={style}
      className={`animate-pulse rounded-md bg-surface-lilac motion-reduce:animate-none ${className}`}
    />
  );
}

/**
 * A run of lines, the shape of a paragraph.
 *
 * The last line is shorter, because a paragraph whose lines are all the same
 * length reads as a table.
 */
export function SkeletonLines({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          className={`h-3 ${index === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

/**
 * A screen reader is told what is loading.
 *
 * The blocks are hidden from assistive technology — they are decoration — so
 * without this a screen reader would read the loading page as a page with no
 * content and no explanation.
 */
export function SkeletonStatus({ label }: { label: string }) {
  return (
    <span role="status" aria-live="polite" className="sr-only">
      {label}
    </span>
  );
}
