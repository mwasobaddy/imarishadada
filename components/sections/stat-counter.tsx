"use client";

import { useEffect, useRef } from "react";

import type { ImpactStat } from "@/lib/data/types";

/**
 * Custom rather than @magicui/number-ticker: we need locale-aware
 * Intl.NumberFormat, a mandatory period label, and reduced-motion parity.
 *
 * Counts a proxy object's value and writes to textContent — never animates
 * innerHTML or a layout property. Final value is already in the DOM so screen
 * readers and no-JS users get the real number, not zero.
 *
 * ## Why it does not use GSAP
 *
 * It used to. GSAP and ScrollTrigger together are about 48 KB of gzipped
 * JavaScript, and the homepage loaded all of it for this one count-up — on a
 * metered connection, that is a second of somebody's data spent on a number
 * ticking up.
 *
 * A count-up is not scroll-linked motion; it is a number changing when the
 * figure comes into view. So it is written out: an observer notices the
 * figure, and a requestAnimationFrame loop moves the number towards its value.
 * Forty lines, no library, and the homepage gives the 48 KB back.
 *
 * The figures are still counted when they scroll into view, and a reader who
 * has asked for reduced motion gets the final number at once.
 */
/**
 * Headline impact figures with a GSAP count-up.
 *
 * Reused by `/impact` rather than rebuilt, per impact.md §4.2. `headingId`,
 * `heading` and `intro` are optional and default to the homepage wording, so
 * adding a second consumer cannot change the homepage.
 */
export function StatCounter({
  stats,
  headingId = "impact-heading",
  heading = "Last year, in Kibera",
  intro = "Every figure below carries the period it covers.",
  period,
}: {
  stats: ImpactStat[];
  headingId?: string;
  heading?: string;
  intro?: string;
  /**
   * The reporting window, rendered rather than written.
   *
   * It appears six times on `/impact` and must agree with the per-row `period`
   * on every figure. As prose it would drift the first time someone updated a
   * number without updating the sentence around it, so the component renders it
   * and the copy only refers to it.
   */
  period?: string;
}) {
  const container = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = container.current;
    if (!root) return;

    const nodes = Array.from(
      root.querySelectorAll<HTMLElement>("[data-stat-value]"),
    ).filter((node) => {
      const target = Number(node.dataset.statValue ?? "0");
      // Honour an explicit display value (e.g. "9–16") rather than counting.
      return Number.isFinite(target) && Number(node.dataset.statDecimals ?? "0") === 0;
    });
    if (nodes.length === 0) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Count each figure when it comes into view, once.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          const node = entry.target as HTMLElement;
          countTo(
            node,
            new Intl.NumberFormat(node.dataset.statLocale ?? "en-KE"),
            reduced,
          );
        }
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    for (const node of nodes) observer.observe(node);

    return () => observer.disconnect();
  }, [stats]);

  return (
    <section
      ref={container}
      aria-labelledby={headingId}
      className="bg-brand py-20 text-ink-inverse sm:py-24 relative mt-8 lg:mt-0"
    >
      <div className="absolute h-[150px] w-[150px] right-0 scale-x-[-1] bg-brand p-4 rounded-t-full" aria-hidden="true" style={{ top: "-80px"}}>
                {/*
          The corner shape is a static file, not inline markup.

          It was 33 KB of path data in the HTML of every page that carries the
          figures — and it was in the HTML twice, because a server component's
          output is written into the page and again into the flight payload.
          As a file it is fetched once, cached, and never re-parsed.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element -- an SVG the
            optimiser would refuse anyway, and it is decorative. */}
        <img
          src="/brand/stat-corner.svg"
          alt=""
          aria-hidden="true"
          width={150}
          height={150}
          className="h-full w-full object-contain"
        />
      </div>
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <h2
          id={headingId}
          className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          {heading}
        </h2>

        <p className="mt-3 max-w-xl text-base text-ink-inverse">{intro}</p>

        {period ? (
          <p className="mt-2 text-sm font-medium text-brand-100">
            Reporting period: {period}
          </p>
        ) : null}

        {/* Definition list: the value/label/period relationship is meaningful
            and should be exposed as such, not as loose divs. */}
        <dl className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.slug}
              className="border-t border-white/30 pt-6"
            >
              <dd className="tabular text-5xl font-semibold tracking-tight sm:text-6xl">
                <span
                  data-stat-value={stat.value}
                  data-stat-decimals="0"
                  data-stat-locale="en-KE"
                >
                  {new Intl.NumberFormat("en-KE").format(stat.value)}
                </span>
              </dd>
              <dt className="mt-3 text-base text-ink-inverse">
                {stat.label}
              </dt>
              <dd>
                <span className="mt-2 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-ink-inverse">
                  {stat.period}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/**
 * Move a number from zero to its value.
 *
 * The easing is the same shape the GSAP tween had — fast out of the gate,
 * settling at the end — written out in twenty lines rather than imported in
 * forty kilobytes. The value is written as a whole number, because a figure
 * that reads "13.349" on the way past is not a figure.
 */
function countTo(node: HTMLElement, format: Intl.NumberFormat, reduced: boolean) {
  const target = Number(node.dataset.statValue ?? "0");
  if (reduced || target === 0) {
    node.textContent = format.format(target);
    return;
  }

  const duration = 1200;
  const start = performance.now();
  let frame = 0;

  function tick(now: number) {
    const elapsed = Math.min(1, (now - start) / duration);
    // power2.out
    const eased = 1 - Math.pow(1 - elapsed, 2);
    node.textContent = format.format(Math.round(target * eased));
    if (elapsed < 1) frame = requestAnimationFrame(tick);
    else node.textContent = format.format(target);
  }

  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}
