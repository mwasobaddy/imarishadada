"use client";

import { useEffect, useRef, useState } from "react";

import {
  HexagonPattern,
  hexCellsAround,
} from "@/components/ui/hexagon-pattern";

/**
 * Interactive hexagon field — the background of the entire hero.
 *
 * Interaction model
 * -----------------
 * The pointer listener is attached to `window`, not to the hero element, so
 * this component does not need to be passed a ref through a Server Component
 * boundary. Any event whose composed path contains `[data-hex-root]` counts as
 * being over the hero.
 *
 * Sections opt in declaratively with `data-hex-focus`. No section needs to be a
 * Client Component — the check is `closest()` at runtime, so `Programmes`,
 * `GivingWays` and the hero CTAs all stay server-rendered.
 *
 * Keyboard parity
 * --------------
 * `focusin` drives the same highlight. A keyboard user tabbing onto a Donate
 * button lights the surrounding hexagons exactly as a mouse hover would, so the
 * effect is never hover-only information.
 *
 * Performance gate (.opencode/rules/frontend-design.md)
 * -----------------------------------------------------
 *   - The highlight is a handful of `<polygon>` elements, not hundreds of
 *     interactive rects. Cheap enough to run on mobile, so unlike the previous
 *     grid-based implementation it is not gated behind a desktop-only branch.
 *   - Pointer moves are coalesced into one state write per animation frame.
 *     Without the rAF guard, a trackpad would re-render on every event.
 *   - `prefers-reduced-motion` does not disable highlighting — it is a small
 *     opacity change, not motion. The fade below is what is suppressed.
 */

const R = 40; // hexagon radius — must match the `radius` prop below
const DIRECTION = "horizontal" as const;

type Highlight = { cells: Array<[number, number]>; strong: boolean } | null;

export function HexagonField() {
  const [highlight, setHighlight] = useState<Highlight>(null);
  const frame = useRef<number | null>(null);
  const pending = useRef<{ x: number; y: number; strong: boolean } | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  // Mirrors `highlight` so pointermove can tell "already cleared" from
  // "needs clearing" without calling setState on every event outside the hero.
  const lit = useRef(false);

  useEffect(() => {
    const apply = () => {
      frame.current = null;
      const next = pending.current;
      pending.current = null;
      if (!next) return;

      const el = fieldRef.current;
      if (!el) return;

      // Pointer coordinates are viewport-relative; the pattern is positioned
      // inside the hero, so convert before mapping to grid space.
      const box = el.getBoundingClientRect();
      const x = next.x - box.left;
      const y = next.y - box.top;
      if (x < 0 || y < 0 || x > box.width || y > box.height) return;

      const radiusPx = next.strong ? 118 : 88;

      setHighlight({
        cells: hexCellsAround(x, y, {
          r: R,
          direction: DIRECTION,
          radiusPx,
          limit: 26,
        }),
        strong: next.strong,
      });
      lit.current = true;
    };

    const schedule = (x: number, y: number, strong: boolean) => {
      pending.current = { x, y, strong };
      if (frame.current === null) frame.current = requestAnimationFrame(apply);
    };

    const overHero = (target: EventTarget | null): HTMLElement | null =>
      target instanceof Element
        ? (target.closest("[data-hex-root]") as HTMLElement | null)
        : null;

    const clear = () => {
      if (!lit.current) return;
      lit.current = false;
      pending.current = null;
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current);
        frame.current = null;
      }
      setHighlight(null);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      // Leaving the hero must clear the field — otherwise the highlight stays
      // stuck on while the pointer scrolls through the rest of the page.
      if (!overHero(e.target)) {
        clear();
        return;
      }
      const inSection = (e.target as Element).closest("[data-hex-focus]");
      schedule(e.clientX, e.clientY, Boolean(inSection));
    };

    const onFocusIn = (e: FocusEvent) => {
      const el = e.target;
      if (!(el instanceof Element)) return;
      const root = el.closest("[data-hex-root]");
      if (!root) return;
      const box = (el as HTMLElement).getBoundingClientRect();
      schedule(
        box.left + box.width / 2,
        box.top + box.height / 2,
        true,
      );
    };

    const onFocusOut = (e: FocusEvent) => {
      if (e.target instanceof Element && e.target.closest("[data-hex-root]")) {
        clear();
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("focusin", onFocusIn);
    window.addEventListener("focusout", onFocusOut);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("focusout", onFocusOut);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);

  const cells = highlight?.cells ?? [];

  return (
    <div
      ref={fieldRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden [mask-image:radial-gradient(ellipse_78%_68%_at_50%_42%,black_30%,transparent_100%)]"
    >
      {/* Static field. Deliberately faint — it sits directly behind the hero
          headline and subtitle, and .opencode/rules/frontend-design.md
          requires ≥ 4.5:1 body-text contrast. A loud field fails that and makes
          the hover highlight (which must stay obvious) hard to read. */}
      <HexagonPattern
        radius={R}
        direction={DIRECTION}
        strokeDasharray="4 3"
        className="h-full w-full fill-pattern/[0.04] stroke-pattern/[0.30] stroke-[0.5]"
      />

      {/* Hover / focus highlight, layered on top of the same grid. High
          contrast against the faint base so the interaction reads clearly. */}
      {cells.length > 0 ? (
        <HexagonPattern
          radius={R}
          direction={DIRECTION}
          hexagons={cells}
          className={
            "h-full w-full transition-opacity duration-300 " +
            (highlight?.strong
              ? "fill-brand/10 stroke-brand/30 stroke-[0.8]"
              : "fill-brand/[0.06] stroke-brand/20 stroke-[0.7]")
          }
        />
      ) : null}
    </div>
  );
}