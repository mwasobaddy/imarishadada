"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";

import type { ImpactStat } from "@/lib/data/types";

gsap.registerPlugin(ScrollTrigger);

/**
 * Custom rather than @magicui/number-ticker: we need locale-aware
 * Intl.NumberFormat, a mandatory period label, and reduced-motion parity.
 *
 * Counts a proxy object's value and writes to textContent — never animates
 * innerHTML or a layout property. Final value is already in the DOM so screen
 * readers and no-JS users get the real number, not zero.
 */
export function StatCounter({ stats }: { stats: ImpactStat[] }) {
  const container = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const nodes = gsap.utils.toArray<HTMLElement>("[data-stat-value]");

        nodes.forEach((node) => {
          const target = Number(node.dataset.statValue ?? "0");
          const decimals = Number(node.dataset.statDecimals ?? "0");
          const locale = node.dataset.statLocale ?? "en-KE";

          // Honour an explicit display value (e.g. "9–16") rather than counting.
          if (!Number.isFinite(target) || decimals > 0) return;

          const counter = { value: 0 };
          const format = new Intl.NumberFormat(locale);

          const tween = gsap.to(counter, {
            value: target,
            duration: 1.2,
            ease: "power2.out",
            onUpdate: () => {
              node.textContent = format.format(counter.value);
            },
          });

          ScrollTrigger.create({
            trigger: node,
            start: "top 85%",
            once: true,
            animation: tween,
          });
        });
      });

      return () => mm.revert();
    },
    { scope: container, dependencies: [stats] },
  );

  return (
    <section
      ref={container}
      aria-labelledby="impact-heading"
      className="bg-brand-900 py-20 text-ink-inverse sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <h2
          id="impact-heading"
          className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          Last year, in Kibera
        </h2>

        <p className="mt-3 max-w-xl text-base text-ink-inverse/70">
          Every figure below carries the period it covers.
        </p>

        {/* Definition list: the value/label/period relationship is meaningful
            and should be exposed as such, not as loose divs. */}
        <dl className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.slug} className="border-t border-ink-inverse/20 pt-6">
              <dd className="tabular text-5xl font-semibold tracking-tight sm:text-6xl">
                <span
                  data-stat-value={stat.value}
                  data-stat-decimals="0"
                  data-stat-locale="en-KE"
                >
                  {new Intl.NumberFormat("en-KE").format(stat.value)}
                </span>
              </dd>
              <dt className="mt-3 text-base text-ink-inverse/85">{stat.label}</dt>
              <dd>
                <span className="mt-2 inline-block rounded-full bg-ink-inverse/10 px-3 py-1 text-xs font-medium text-ink-inverse/70">
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