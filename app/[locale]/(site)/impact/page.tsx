import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";

import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { StatCounter } from "@/components/sections/stat-counter";
import {
  METHODOLOGY,
  MEASUREMENT_GAPS,
  REPORTING_PERIOD,
  getAllImpactStats,
} from "@/lib/data/impact";
import { getProgrammes } from "@/lib/data/home";
import { absoluteUrl, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";

/**
 * Impact — `/impact`.
 *
 * The credibility page. Everything on it is either a dated figure from
 * `impact_stats` or an explicit statement about what we do not yet know.
 *
 * Reuses `StatBand` from the homepage rather than rebuilding the count-up, as
 * the spec requires.
 */

export const metadata: Metadata = {
  title: "Our impact",
  description: `Every figure we publish is dated and we say how it was counted. Reporting period ${REPORTING_PERIOD.label}.`,
  alternates: {
    canonical: "/impact",
    languages: { "en-KE": "/impact", "x-default": "/impact" },
  },
  openGraph: {
    type: "article",
    url: "/impact",
    locale: "en_KE",
      images: ["/opengraph-image"],
    title: "Our impact | Imarisha Dada",
    description: "Every figure we publish is dated, and we say how it was counted.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Our impact | Imarisha Dada",
    description: "Every figure we publish is dated, and we say how it was counted.",
  },
};

export default async function ImpactPage({
  params,
}: PageProps<"/[locale]/impact">) {
  const { locale } = await params;

  // Pin the locale for static rendering. Without this, `next-intl` resolves it
  // from the request, which is uncached data and fails the `cacheComponents`
  // build. It must run in the page, not the layout: layouts execute after the
  // page they wrap.
  setRequestLocale(locale);

  const [stats, programmes] = await Promise.all([getAllImpactStats(), getProgrammes()]);

  // Group the figures by programme so each programme can be argued on its own.
  const byProgramme = programmes
    .map((programme) => ({
      programme,
      stats: stats.filter((s) => s.programmeSlug === programme.slug),
    }))
    .filter((entry) => entry.stats.length > 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Imarisha Dada impact figures",
    description: `Impact figures for the reporting period ${REPORTING_PERIOD.label}.`,
    url: absoluteUrl("/impact"),
    inLanguage: "en-KE",
    creator: { "@type": "NGO", name: "Imarisha Dada" },
    temporalCoverage: REPORTING_PERIOD.label,
    variableMeasured: stats.map((s) => ({
      "@type": "PropertyValue",
      name: s.label,
      value: s.value,
      description: `Reporting period: ${s.period}`,
    })),
  };

  return (
    <>
      <main id="main">
        <PageHero
          eyebrow="Our impact"
          heading="Numbers, and how we got them."
          body={`Every figure on this page covers ${REPORTING_PERIOD.from} to ${REPORTING_PERIOD.to}. Where we do not have a number, we say so rather than estimate.`}
        />

        {/* ---- Headline figures. Reused from the homepage. ---- */}
        <StatCounter
          stats={stats.map((s) => ({
            slug: s.slug,
            value: s.value,
            label: s.label,
            period: s.period,
            programmeSlug: s.programmeSlug,
            sortOrder: s.sortOrder,
          }))}
          headingId="impact-headline-heading"
          heading="The headline numbers"
          intro={`Reporting period ${REPORTING_PERIOD.from} to ${REPORTING_PERIOD.to}. Every figure below carries the period it covers.`}
        />

        {/* ---- Impact by programme ---- */}
        {byProgramme.length > 0 ? (
          <section aria-labelledby="by-programme-heading" className="py-section bg-surface">
            <Container>
              <h2
                id="by-programme-heading"
                className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
              >
                By programme
              </h2>

              <div className="mt-12 space-y-5">
                {byProgramme.map(({ programme, stats: rows }) => (
                  <article
                    key={programme.slug}
                    className="rounded-card border border-border bg-card p-6 sm:p-8"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <h3 className="text-xl font-semibold text-brand-600">
                        {programme.title}
                      </h3>
                      <Link
                        href={`/programmes/${programme.slug}`}
                        className="text-sm font-medium text-brand-600 underline decoration-brand-600/30 underline-offset-4 hover:decoration-brand-700"
                      >
                        About this programme
                      </Link>
                    </div>

                    <dl className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {rows.map((row) => (
                        <div key={row.slug}>
                          <dt className="text-sm text-ink-muted">
                            {row.label}
                            <span className="mt-2 inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600">
                              {row.period}
                            </span>
                          </dt>
                          <dd className="tabular mt-1 text-4xl font-semibold text-brand-600">
                            {row.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </article>
                ))}
              </div>
            </Container>
          </section>
        ) : null}

        {/* ---- Methodology ---- */}
        <section aria-labelledby="method-heading" className="bg-surface-lilac py-section">
          <Container>
            <div className="max-w-2xl">
              <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
                Methodology
              </p>
              <h2
                id="method-heading"
                className="mt-3 text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
              >
                How we count
              </h2>
              <p className="measure mt-4 text-lg text-ink-muted">
                A number without a definition is a claim. These are ours.
              </p>
            </div>

            <dl className="mt-12 grid gap-6 sm:grid-cols-2">
              {METHODOLOGY.map((item) => (
                <div
                  key={item.term}
                  className="rounded-card border border-border bg-card p-6"
                >
                  <dt className="text-lg font-semibold text-brand-600">{item.term}</dt>
                  <dd className="measure mt-2 text-ink-muted">{item.definition}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-8 text-sm text-ink-muted">
              <strong className="text-ink">Reporting period:</strong>{" "}
              {REPORTING_PERIOD.from} to {REPORTING_PERIOD.to}.
            </p>
          </Container>
        </section>

        {/* ---- What we do not measure ---- */}
        <section aria-labelledby="gaps-heading" className="py-section bg-surface">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-16">
              <div>
                <h2
                  id="gaps-heading"
                  className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
                >
                  What we do not yet measure
                </h2>
                <p className="measure mt-4 text-lg text-ink-muted">
                  Anyone can publish a percentage. These are the things we cannot
                  claim, and a funder should be able to see them without asking.
                </p>
              </div>

              <ul className="space-y-4" aria-hidden="false">
                {MEASUREMENT_GAPS.map((gap) => (
                  <li
                    key={gap}
                    className="flex gap-4 rounded-card border-2 border-dashed border-brand-600/30 bg-surface-lilac p-5"
                  >
                    <span aria-hidden="true" className="text-brand-600">
                      ✕
                    </span>
                    <span className="text-ink-muted">{gap}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </section>

        {/* ---- Reports ---- */}
        <section aria-labelledby="reports-heading" className="bg-brand py-section">
          <Container>
            <div className="max-w-2xl">
              <h2
                id="reports-heading"
                className="text-3xl font-semibold tracking-tight text-ink-inverse sm:text-4xl"
              >
                Reports and documents
              </h2>
              <p className="measure mt-4 text-lg text-brand-100">
                The written record behind the numbers.
              </p>
            </div>

            <ul className="mt-10 space-y-3">
              <li className="rounded-card border border-brand-100/30 bg-brand-100/10 p-5">
                <p className="font-semibold text-ink-inverse">
                  Annual Report {REPORTING_PERIOD.label}
                </p>
                <p className="mt-1 text-sm text-brand-100">
                  In preparation. Published once it is complete and signed off.
                </p>
              </li>
              <li className="rounded-card border border-brand-100/30 bg-brand-100/10 p-5">
                <p className="font-semibold text-ink-inverse">Safeguarding policy</p>
                <p className="mt-1 text-sm text-brand-100">
                  How we protect the children and young women we work with.
                </p>
                <Link
                  href="/legal/safeguarding"
                  className="mt-2 inline-block text-sm font-medium text-brand-100 underline decoration-brand-100/40 underline-offset-4 hover:decoration-brand-100"
                >
                  Read the policy
                </Link>
              </li>
            </ul>
          </Container>
        </section>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            jsonLd,
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Impact", path: "/impact" },
            ]),
          ]),
        }}
      />
    </>
  );
}
