import Link from "next/link";

import { Container } from "@/components/site/container";
import type { ProgrammeOutcome } from "@/lib/data/types";

/**
 * The programme's six-step structure.
 *
 * A bento rather than six identical cards: the first step is promoted because
 * "mentorship" is the emotional hook on every programme page, and a grid where
 * every cell is the same size is exactly the AI-monoculture the project rules
 * warn against.
 *
 * Renders nothing when there are no outcomes — a heading above an empty grid is
 * worse than no section.
 */
export function ProgrammeOutcomes({
  title,
  outcomes,
}: {
  title: string;
  outcomes: ProgrammeOutcome[];
}) {
  if (outcomes.length === 0) return null;

  const [lead, ...rest] = outcomes;

  return (
    <section aria-labelledby="outcomes-heading" className="py-section bg-surface-lilac">
      <Container>
        <div className="max-w-2xl">
          <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
            What we do
          </p>
          <h2
            id="outcomes-heading"
            className="mt-3 text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
          >
            {title}
          </h2>
        </div>

        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <li className="rounded-card border border-brand-600/30 bg-brand-600 p-6 text-brand-50 sm:col-span-2 lg:col-span-2">
            <div className="flex items-baseline gap-4">
              <span className="text-sm font-semibold tabular opacity-70" aria-hidden="true">
                01
              </span>
              <div>
                <h3 className="text-xl font-semibold text-brand-50">{lead.title}</h3>
                <p className="measure mt-2 text-brand-100">{lead.description}</p>
              </div>
            </div>
          </li>

          {rest.map((outcome, i) => (
            <li
              key={outcome.title}
              className="rounded-card border border-border bg-card p-6 transition-colors hover:border-brand-600/40"
            >
              <span className="text-sm font-semibold text-brand-600 tabular" aria-hidden="true">
                {String(i + 2).padStart(2, "0")}
              </span>
              <h3 className="mt-2 text-lg font-semibold text-ink">{outcome.title}</h3>
              <p className="measure mt-2 text-sm text-ink-muted">{outcome.description}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

/**
 * Impact figures for this programme.
 *
 * Renders only what is in `impact_stats`. Figures the roadmap marks "verify
 * before publishing" were deliberately never seeded, so they cannot appear here
 * by accident — an unsourced statistic on an education page is a liability in a
 * funder's due-diligence review.
 */
export function ProgrammeImpact({
  stats,
}: {
  stats: { slug: string; value: number; label: string; period: string }[];
}) {
  if (stats.length === 0) return null;

  return (
    <section aria-labelledby="impact-heading" className="bg-brand py-section">
      <Container>
        <div className="max-w-2xl">
          <h2
            id="impact-heading"
            className="text-3xl font-semibold tracking-tight text-ink-inverse sm:text-4xl"
          >
            What it has produced
          </h2>
          <p className="measure mt-4 text-lg text-brand-100">
            Every figure below carries the period it covers.
          </p>
        </div>

        <dl className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.slug} className="border-l-2 border-brand-100/40 pl-5">
              <dt className="text-sm text-brand-100">
                {stat.label}
                <span className="mt-2 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-ink-inverse">
                  {stat.period}
                </span>
              </dt>
              <dd className="tabular mt-2 text-5xl font-semibold text-ink-inverse">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}

/**
 * What a gift to this programme costs.
 *
 * Ties the page to the verified tiers in `giving_tiers` and to `/donate`. Amounts
 * are read from the database, never hardcoded — the roadmap's hard rule, and the
 * most common way a charity site ships stale payment details.
 */
export function ProgrammeCost({
  tiers,
  currencyFormatter,
}: {
  tiers: {
    slug: string;
    amount: number;
    outcomeLabel: string;
    cadence: "one_time" | "monthly";
  }[];
  currencyFormatter: (amount: number) => string;
}) {
  if (tiers.length === 0) return null;

  // Lead with the largest single gift: it is the clearest statement of what a
  // gift buys and the strongest single ask.
  const headline = [...tiers].sort((a, b) => b.amount - a.amount)[0];
  const others = tiers
    .filter((t) => t.slug !== headline.slug)
    .sort((a, b) => a.amount - b.amount);

  return (
    <section aria-labelledby="cost-heading" className="py-section bg-surface">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
              What it costs
            </p>
            <h2
              id="cost-heading"
              className="mt-3 text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
            >
              <span className="text-brand-600">{currencyFormatter(headline.amount)}</span>{" "}
              funds {headline.outcomeLabel}
            </h2>

            {others.length > 0 ? (
              <dl className="mt-8 divide-y divide-border border-y border-border">
                {others.map((tier) => (
                  <div
                    key={tier.slug}
                    className="flex flex-wrap items-baseline justify-between gap-2 py-3"
                  >
                    <dt className="font-semibold text-ink tabular">
                      {currencyFormatter(tier.amount)}
                      {tier.cadence === "monthly" ? (
                        <span className="text-sm font-normal text-ink-muted"> / month</span>
                      ) : null}
                    </dt>
                    <dd className="text-sm text-ink-muted">{tier.outcomeLabel}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>

          <div className="rounded-2xl border border-brand-600/30 bg-brand-50 p-8 sm:p-10">
            <h3 className="text-xl font-semibold text-brand-600">
              Fund a re-entry
            </h3>
            <p className="measure mt-3 text-ink-muted">
              Fees, materials, a year of mentorship and follow-through. Paid
              directly to the school, tracked to completion.
            </p>

            <Link
              href="/donate"
              className="mt-8 inline-flex min-h-13 items-center justify-center rounded-lg bg-gold px-8 text-base font-semibold text-gold-ink transition-colors hover:bg-gold/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
            >
              Give to this programme
            </Link>

            <p className="mt-6 text-sm text-ink-muted">
              Prefer M-Pesa? It is the fastest way to give in Kenya and costs you
              nothing extra.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
