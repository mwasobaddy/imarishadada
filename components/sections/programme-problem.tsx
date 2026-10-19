"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

/**
 * Sticky-scroll "the problem" section.
 *
 * GSAP, not Motion — this is scroll-linked. Per the project's animation policy:
 * if it moves in response to scroll, it is GSAP.
 *
 * ## Why the pinning is guarded
 *
 * The spec is emphatic, and the reasoning is sound:
 *
 *   * **No pinning below `lg`.** Pinning on mobile is the number-one cause of
 *     jank and of the back button appearing to break. The section degrades to
 *     three stacked cards.
 *   * **No pinning under `prefers-reduced-motion`.** Same guard as above, and
 *     the content then reads as an ordinary vertical stack.
 *
 * `gsap.matchMedia` handles both conditions in one place, so the desktop path
 * cannot accidentally run on a phone.
 */
export function ProgrammeProblem({ paragraphs }: { paragraphs: string[] }) {
  const container = useRef<HTMLElement>(null);

  useGSAP(
    () => {
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

          if (!isDesktop || !reduced) return;

          const panels = gsap.utils.toArray<HTMLElement>("[data-problem-panel]");
          if (panels.length < 2) return;

          /*
           * Deliberately does NOT animate opacity from 0.
           *
           * The panels are fully visible in the HTML and stay fully visible
           * until GSAP proves it will run. A `from`-to-zero tween would make
           * this section's entire argument invisible whenever JS is slow,
           * blocked or fails — and on this page that argument is the reason a
           * donor gives. Only transform and a border highlight are animated, so
           * the worst case is "no animation", never "no content".
           */
          /*
           * No GSAP `pin`.
           *
           * `pin` reserves a pin-spacing spacer the height of the pinned
           * element, and with the right column ending well before the left,
           * that left roughly 600px of blank page between this section and the
           * next. The left column is already `lg:sticky` in CSS, which gives
           * the same visual result with no layout reservation and no risk of a
           * stranded gap. What GSAP adds here is only the scrubbed emphasis.
           */
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: container.current,
              start: "top 70%",
              end: "bottom 60%",
              scrub: true,
            },
          });

          panels.forEach((panel, i) => {
            tl.fromTo(
              panel,
              { borderColor: "var(--color-border)" },
              { borderColor: "var(--color-brand-600)", ease: "none", duration: 0.5 },
              i * 0.5,
            );
          });

          return () => {
            tl.scrollTrigger?.kill();
            tl.kill();
          };
        },
      );

      return () => mm.revert();
    },
    { scope: container, dependencies: [paragraphs], revertOnUpdate: true },
  );

  return (
    <section ref={container} aria-labelledby="problem-heading" className="bg-surface py-section">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
          {/* Sticky on desktop only; the CSS below is the mobile fallback. */}
          <div
            data-problem-sticky
            className="lg:sticky lg:top-24 lg:self-start"
          >
            <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
              The problem
            </p>
            <h2
              id="problem-heading"
              className="mt-3 text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
            >
              She did not choose to leave.
            </h2>
            <p className="measure mt-4 text-lg text-ink-muted">
              Every barrier below is structural. None of them are about how much a
              young mother wants to learn.
            </p>
          </div>

          <div className="space-y-6">
            {paragraphs.map((text, i) => (
              <p
                key={text.slice(0, 32)}
                data-problem-panel
                className="rounded-2xl border border-border bg-card p-6 text-lg leading-relaxed text-ink-muted sm:p-8"
              >
                <span className="mr-2 font-semibold text-brand-600 tabular" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
