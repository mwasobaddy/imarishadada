"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

/**
 * Pin ring colours.
 *
 * A static map, not an interpolated class name. Tailwind's scanner only sees
 * complete class strings in the source, so `ring-${colour}` compiles to
 * nothing and the pin ends up with no ring at all — which is invisible on a
 * matching background and a visible hard disc on anything else.
 */
const PIN_RINGS = {
  "surface-lilac": "ring-surface-lilac",
  "surface": "ring-surface",
  "surface-pink": "ring-surface-pink",
} as const;

export type JourneyItem = {
  /** Used for the accessible label of the milestone. */
  title: string;
  /** Plain body copy. Ignored when `card` is supplied. */
  body?: string;
  /** Custom card content, for sections that need more than a title and a line. */
  card?: ReactNode;
};

/**
 * A path through a sequence of milestones.
 *
 * ## The two shapes
 *
 * **`snake`** — the path runs left to right along the top of the first row,
 * swings out past the last card, and comes back along the second row. The eye
 * follows one continuous line instead of scanning a grid. On a narrow screen
 * the same path straightens into a spine down the left.
 *
 * **`spine`** — one column, the path running down the left through each
 * milestone. This is the shape for a list that is genuinely ordered: the
 * barriers a girl hits, the steps a programme takes.
 *
 * ## Why not everywhere
 *
 * A path implies order. Drawing one through an unordered collection — the
 * organisation's values, the partner schools — would tell a visitor those
 * things are a sequence, and they are not. So this component is only used
 * where the content really is ordered.
 *
 * ## The path is measured, not hard-coded
 *
 * The line is built from the **measured** position of each milestone, so it
 * still lands exactly when the copy length, the column count or the window
 * width changes. That is why it is measured in an effect rather than computed
 * in JSX.
 *
 * ## Motion
 *
 * GSAP, not Motion. The draw is scroll-linked, and the project's hybrid policy
 * is explicit: if it moves in response to scroll, it is GSAP.
 *
 * The draw is `stroke-dashoffset`, which is paint-only and causes no layout.
 * It is scrubbed, so the line fills as the reader scrolls, and it is the only
 * thing that animates.
 *
 * **The content never animates in.** The cards, the numbers and the text are
 * in the server-rendered HTML and stay there. If JS is slow, blocked, or fails
 * outright, the reader gets the sequence with a line that has not drawn yet —
 * never a page with invisible copy. On a page whose argument is a girl's path
 * through the organisation's work, hiding that argument behind an animation
 * would be the worst possible failure.
 */
export function JourneySnake({
  items,
  variant = "snake",
  pinRing = "surface-lilac",
  className,
}: {
  items: JourneyItem[];
  variant?: "snake" | "spine";
  /** The background the pin's ring should match, so the line appears to pass
   *  behind the pin rather than through it. */
  pinRing?: keyof typeof PIN_RINGS;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const pathRef = useRef<SVGPathElement>(null);
  const lengthRef = useRef(0);
  const [nodes, setNodes] = useState<{ x: number; y: number }[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  /**
   * Measure each milestone's centre, as a percentage of the container.
   *
   * Percentages, because the SVG scales with `preserveAspectRatio="none"` —
   * the container has no fixed aspect ratio, and a path drawn in pixels would
   * drift from the cards the moment the copy length changed.
   */
  useLayoutEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      if (!container) return;
      const box = container.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) return;

      // Pixel coordinates, not percentages.
      //
      // The SVG's viewBox is set to the container's real pixel size, so the
      // path, the stroke width and the dash pattern are all in the same
      // units. That matters: with a percentage viewBox and
      // `preserveAspectRatio="none"`, the dash has to be expressed in screen
      // pixels (because `vector-effect="non-scaling-stroke"` puts dashes in
      // screen space), which means the dash length and the path length are
      // measured in two different coordinate systems and the line renders as
      // a row of disconnected fragments. Working in pixels throughout
      // removes that whole class of bug.
      const measured = nodeRefs.current
        .map((el) => {
          if (!el) return null;
          const b = el.getBoundingClientRect();
          return {
            x: b.left + b.width / 2 - box.left,
            y: b.top + b.height / 2 - box.top,
          };
        })
        .filter((n): n is { x: number; y: number } => n !== null);

      setNodes(measured);
      setSize({ w: box.width, h: box.height });
    };

    measure();

    // Re-measure on any size change. The observer watches the container, so a
    // font swap, a translation change or a window resize all redraw the path.
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [items.length]);

  const path = buildPath(nodes, size.w);

  /**
   * Own the dash pattern.
   *
   * Two things are going on here, and both are deliberate.
   *
   * **The dash is set here, not by GSAP.** GSAP writes unitless values with a
   * `px` suffix, and `stroke-dasharray: 1px` against a normalised path is not
   * one dash the length of the path — it is a dash of one user unit repeated
   * forever, which draws the line as a row of disconnected fragments. Setting
   * `strokeDasharray` directly, from the path's real length, avoids the unit
   * problem entirely.
   *
   * **It is set from the measured length, every time the path changes.**
   * `getTotalLength()` is only meaningful for the current geometry, and the
   * geometry changes whenever the copy changes or the window resizes.
   */
  useLayoutEffect(() => {
    const el = pathRef.current;
    if (!el) return;
    const length = el.getTotalLength();
    lengthRef.current = length;
    el.style.strokeDasharray = String(length);
    // Visible by default. The animation hides it again on a wide screen before
    // the first paint, so there is no flash — but if the animation never runs
    // (a narrow screen, reduced motion, or no JavaScript at all) the line is
    // simply there.
    el.style.strokeDashoffset = "0";
  }, [path]);

  useGSAP(
    () => {
      const el = pathRef.current;
      if (!el) return;

      const mm = gsap.matchMedia();

      mm.add(
        {
          isDesktop: "(min-width: 1024px)",
          reduced: "(prefers-reduced-motion: no-preference)",
        },
        (context) => {
          const { isDesktop, reduced } = context.conditions as {
            isDesktop: boolean;
            reduced: boolean;
          };

          const length = lengthRef.current;
          if (!length) return;

          if (!isDesktop || !reduced) {
            // No animation on a narrow screen, under reduced motion, or
            // without JavaScript. The line stays where the layout effect left
            // it — fully drawn. The sequence is still a sequence.
            el.style.strokeDashoffset = "0";
            return;
          }

          // A proxy, not the element. The offset is written by hand on every
          // frame, so GSAP never touches the dash properties and never has to
          // guess a unit for them.
          el.style.strokeDashoffset = String(length);
          const progress = { value: 1 };

          gsap.to(progress, {
            value: 0,
            ease: "none",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top 75%",
              end: "bottom 75%",
              scrub: 0.6,
            },
            onUpdate: () => {
              el.style.strokeDashoffset = String(progress.value * length);
            },
          });
        },
      );

      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [path] },
  );

  const spine = variant === "spine";

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      {/* The spine. `aria-hidden` — it carries no information the numbered
          milestones do not already carry. `overflow-visible` so the turn is
          not clipped, and `vector-effect` keeps the stroke the same width
          however the viewBox is stretched. */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible"
        viewBox={`0 0 ${Math.max(size.w, 1)} ${Math.max(size.h, 1)}`}
        fill="none"
      >
        <path
          ref={pathRef}
          d={path}
          stroke="var(--color-brand-600)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>

      <ol
        className={
          spine
            ? "relative z-10 space-y-8"
            : "relative z-10 grid gap-x-8 gap-y-10 lg:grid-cols-3 lg:gap-y-12"
        }
      >
        {items.map((item, i) => (
          <li
            key={item.title}
            className={
              spine
                ? "mb-0"
                : // The second row is reversed so the line flows right to left,
                  // which is what turns a grid into a snake. The DOM order is
                  // untouched, so a screen reader still hears 1, 2, 3, 4, 5, 6.
                  i === 3
                  ? "lg:col-start-3 lg:row-start-2"
                  : i === 4
                    ? "lg:col-start-2 lg:row-start-2"
                    : i === 5
                      ? "lg:col-start-1 lg:row-start-2"
                      : ""
            }
          >
            <div
              className={
                spine
                  ? "flex items-start gap-5"
                  : "flex items-start gap-4 lg:flex-col lg:items-center lg:gap-3"
              }
            >
              {/* The milestone pin. It sits on the line, so the number is
                  visually attached to the sequence. */}
              <span
                ref={(el) => {
                  nodeRefs.current[i] = el;
                }}
                aria-hidden="true"
                className={`grid size-10 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-semibold text-brand-50 tabular ring-4 ${PIN_RINGS[pinRing]}`}
              >
                {i + 1}
              </span>

              {item.card ?? (
                <div className="rounded-card border border-border bg-card p-5 sm:p-6 w-full">
                  <h3 className="text-lg font-semibold text-brand-600">{item.title}</h3>
                  {item.body ? (
                    <p className="measure mt-1 text-ink-muted">{item.body}</p>
                  ) : null}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * Build the path through the measured milestone positions.
 *
 * The route is not simply "connect each pair of milestones". A milestone on
 * the last column of a row has to *turn* before it can reach the first
 * column of the next row, and a straight line between them would cut
 * diagonally across the card in between.
 *
 * So a turn is routed as three waypoints: out to the far edge of the
 * container, down the edge, and back in. The result is a road that runs along
 * the top of the first row, swings out past the last card, comes back along
 * the top of the second row, and stops at the first milestone — which is what
 * makes the shape read as a snake rather than a grid.
 *
 * The corners are rounded with quadratic segments, the way a road is.
 */
function buildPath(nodes: { x: number; y: number }[], containerWidth: number): string {
  if (nodes.length === 0) return "";
  if (nodes.length === 1) return `M ${nodes[0]!.x} ${nodes[0]!.y}`;

  // --- Waypoints ---
  const points: { x: number; y: number }[] = [{ ...nodes[0]! }];

  // Which heights hold more than one milestone? Those are the rows. A
  // vertical segment between two rows is a *turn* — the path has to swing
  // out past the last card and come back — whereas a vertical segment within
  // a single column is just the next step down, and the path should run
  // straight through the pins.
  //
  // On a wide screen the milestones share two heights, so the segment from
  // the end of row one to the start of row two is a turn. On a narrow screen
  // every milestone has its own height, so no segment is a turn and the path
  // is a plain spine down the left, straight through the pins.
  const rowHeights = new Map<number, number>();
  for (const node of nodes) {
    const key = Math.round(node.y * 10) / 10;
    rowHeights.set(key, (rowHeights.get(key) ?? 0) + 1);
  }
  const isRow = (y: number) => (rowHeights.get(Math.round(y * 10) / 10) ?? 0) > 1;

  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i]!;
    const b = nodes[i + 1]!;

    const vertical = Math.abs(b.y - a.y) > Math.abs(b.x - a.x);
    const isTurn = vertical && isRow(a.y) && isRow(b.y);

    if (isTurn) {
      // A turn. Route out past the edge of the container so the line never
      // runs across a card, down the edge, and back in.
      //
      // The edge is just outside the container on purpose: the cards stop at
      // the container's edge, so a line running exactly on it would be half
      // hidden under the card it is supposed to be turning around.
      const edge = a.x > containerWidth / 2 ? containerWidth + 14 : -14;
      points.push({ x: edge, y: a.y });
      points.push({ x: edge, y: b.y });
    }

    points.push({ x: b.x, y: b.y });
  }

  return roundedPolyline(points, 22);
}

/**
 * A polyline with rounded corners.
 *
 * Each corner is replaced by a line to a point a short way back along the
 * incoming edge, a quadratic curve through the corner itself, and a line on
 * from a short way along the outgoing edge. The radius is in the path's own
 * units, which are pixels — the same units the path itself is built in, so
 * the corners are true circles.
 */
function roundedPolyline(
  points: { x: number; y: number }[],
  radius: number,
): string {
  if (points.length < 2) return "";

  let d = `M ${points[0]!.x} ${points[0]!.y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]!;
    const corner = points[i]!;
    const next = points[i + 1]!;

    const inLen = Math.hypot(corner.x - prev.x, corner.y - prev.y) || 1;
    const outLen = Math.hypot(next.x - corner.x, next.y - corner.y) || 1;

    const inR = Math.min(radius, inLen / 2);
    const outR = Math.min(radius, outLen / 2);

    const from = {
      x: corner.x - ((corner.x - prev.x) / inLen) * inR,
      y: corner.y - ((corner.y - prev.y) / inLen) * inR,
    };
    const to = {
      x: corner.x + ((next.x - corner.x) / outLen) * outR,
      y: corner.y + ((next.y - corner.y) / outLen) * outR,
    };

    d += ` L ${from.x} ${from.y} Q ${corner.x} ${corner.y} ${to.x} ${to.y}`;
  }

  const last = points[points.length - 1]!;
  d += ` L ${last.x} ${last.y}`;

  return d;
}
