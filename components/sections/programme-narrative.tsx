"use client";

import { useRef } from "react";

import { JourneySnake } from "@/components/sections/journey-snake";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

/**
 * The programme's narrative: a framing column and a scroll of panels.
 *
 * GSAP, not Motion — this is scroll-linked. Per the project's animation policy:
 * if it moves in response to scroll, it is GSAP.
 *
 * ## Why the framing is a prop and not a string here
 *
 * This used to hardcode "The problem" and "She did not choose to leave." That
 * was true of school re-entry and false of the other programmes: the economic
 * empowerment page opened with a claim about barriers while its panels talked
 * about money. The framing now comes from the page copy in the database, so
 * each programme opens with the sentence that is true of it.
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
export function ProgrammeNarrative({
  paragraphs,
  eyebrow,
  heading,
  intro,
}: {
  paragraphs: string[];
  /** Small label above the heading, e.g. "The problem". */
  eyebrow?: string | null;
  /** The sentence the page opens with. */
  heading?: string | null;
  /** One or two sentences under the heading. */
  intro?: string | null;
}) {
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

  const hasFrame = Boolean(heading?.trim());

  return (
    <section
      ref={container}
      aria-labelledby={hasFrame ? "narrative-heading" : undefined}
      className="bg-surface py-section"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        {/*
          Two columns when there is a framing sentence to pin, one when there
          is not. A programme with no lead section should not leave an empty
          column where the sentence would have been.
        */}
        <div
          className={`grid gap-10 lg:gap-20 ${
            hasFrame ? "lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]" : ""
          }`}
        >
          {/* Sticky on desktop only; the CSS below is the mobile fallback. */}
          {hasFrame ? (
            <div
              data-problem-sticky
              className="lg:sticky lg:top-24 lg:self-start"
            >
              {eyebrow?.trim() ? (
                <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
                  {eyebrow}
                </p>
              ) : null}
              <h2
                id="narrative-heading"
                className="mt-3 text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
              >
                {heading}
              </h2>
              {intro?.trim() ? (
                <p className="measure mt-4 text-lg text-ink-muted">{intro}</p>
              ) : null}
            </div>
          ) : null}

          {/* The barriers are a genuine sequence — a girl meets them in this
              order — so they get a path, not a list. The pin carries the
              number, so the copy no longer has to carry it inline. */}
          <JourneySnake
            variant="spine"
            pinRing="surface"
            items={paragraphs.map((text) => ({
              title: text.slice(0, 32),
              card: (
                <p
                  data-problem-panel
                  className="rounded-2xl border border-border bg-card p-6 text-lg leading-relaxed text-ink-muted sm:p-8"
                >
                  {text}
                </p>
              ),
            }))}
          />
        </div>
      </div>
    </section>
  );
}
