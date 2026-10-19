import Link from "next/link";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";

import type { GivingTier } from "@/lib/data/types";

function formatKsh(amount: number, locale = "en-KE"): string {
  return `KSh ${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount)}`;
}

/**
 * The giving ladder — the highest-leverage pattern in the whole competitive
 * benchmark. Every tier maps an amount to a concrete outcome, which removes the
 * "how much should I give?" decision.
 *
 * Amounts come from `giving_tiers`, never from this file. Editing a figure in
 * Supabase changes the page with no redeploy.
 */
export function GivingWays({ tiers }: { tiers: GivingTier[] }) {
  // The query already filters `active = true`; the fallback seed has no flag.
  const active = tiers;
  if (active.length === 0) return null;

  const monthlyAvailable = active.some((t) => t.cadence === "monthly");

  return (
    <section aria-labelledby="giving-heading" className="bg-surface py-section">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium tracking-wide text-accent uppercase">
            Ways to give
          </p>
          <h2
            id="giving-heading"
            className="mt-3 text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
          >
            What your gift actually does
          </h2>
          <p className="measure mt-4 text-lg text-ink-muted">
            Every amount below is tied to a specific outcome. Give monthly and a
            mentor’s continuity matters as much as a single emergency.
          </p>
        </div>

        {/* Static list, not a marquee: this is conversion copy. A moving band
            is harder to read, harder to translate, and worse for a screen
            reader. Marquees belong on decorative rails only. */}
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((tier) => (
            <li key={tier.slug}>
              <Link
                href="/donate"
                className="group flex h-full flex-col rounded-card border border-brand/20 bg-card p-6 transition-colors hover:border-secondary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
              >
                <span className="tabular text-2xl font-semibold tracking-tight text-brand-600">
                  {formatKsh(tier.amount)}
                </span>
                <span className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                  → {tier.outcomeLabel}
                </span>
                {tier.cadence === "monthly" ? (
                  <span className="mt-4 inline-block w-fit rounded-full bg-accent-50 px-3 py-1 text-xs font-medium text-accent">
                    Available monthly
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <InteractiveHoverButton
            href="/donate"
            className="min-h-12 rounded-full bg-gold px-7 text-base font-semibold text-gold-ink"
          >
            Donate
          </InteractiveHoverButton>
          <Link
            href="/ways-to-give"
            className="inline-flex min-h-12 items-center rounded-lg px-2 text-base font-medium text-brand-600 underline decoration-brand-600/30 underline-offset-4 hover:decoration-brand-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
          >
            All ways to give
          </Link>
          {monthlyAvailable ? (
            <p className="text-sm text-ink-muted">
              Every amount above can be given monthly.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}