import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";

import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { JourneySnake } from "@/components/sections/journey-snake";
import { StatCounter } from "@/components/sections/stat-counter";
import {
  REPORTING_PERIOD,
  getAllImpactStats,
  getImpactSections,
  getMeasurementGaps,
} from "@/lib/data/impact";
import { getProgrammes } from "@/lib/data/home";
import { isVisible } from "@/lib/data/sections";
import { absoluteUrl, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";

/**
 * Impact — `/impact`.
 *
 * The credibility page. Everything on it is either a dated figure from
 * `impact_stats`, an explicit statement about what we do not yet know, or
 * editor-managed copy from `site_sections`.
 *
 * Reuses `StatCounter` from the homepage rather than rebuilding the count-up,
 * as the spec requires.
 *
 * ## The reporting period is rendered, never written
 *
 * It appears six times on this page and must agree with the per-row `period` on
 * every figure. Written into editable copy it would drift the first time
 * someone updated a number without updating the sentence around it — and this
 * is the one page where a figure covering the wrong period is not a typo, it is
 * the whole argument failing. So `REPORTING_PERIOD` stays a code constant, the
 * copy refers to it ("the reporting period stated below"), and the components
 * render it. See the note at the foot of migration `0018`.
 */

const PERIOD_LABEL = `${REPORTING_PERIOD.from} – ${REPORTING_PERIOD.to}`;

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

  const [sections, gaps, stats, programmes] = await Promise.all([
    getImpactSections(),
    getMeasurementGaps(),
    getAllImpactStats(),
    getProgrammes(),
  ]);

  const hero = sections["impact-hero"];
  const headline = sections["impact-headline"];
  const byProgrammeSection = sections["impact-by-programme"];
  const methodology = sections["impact-methodology"];
  const gapsSection = sections["impact-gaps"];
  const reports = sections["impact-reports"];

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
        {isVisible(hero) ? (
          <PageHero
            eyebrow={hero.eyebrow}
            heading={hero.heading}
            body={hero.body}
          >
            {/*
              Rendered, not written into `body`. The dates are a fact about the
              figures, not a sentence an editor should be able to mistype.
            */}
            <p className="inline-flex flex-wrap items-baseline gap-x-2 rounded-full bg-brand-50 px-4 py-2 text-sm text-brand-600">
              <span className="font-semibold">Reporting period</span>
              <time>{PERIOD_LABEL}</time>
            </p>
          </PageHero>
        ) : null}

        {/* ---- Headline figures. Reused from the homepage. ---- */}
        {isVisible(headline) ? (
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
            heading={headline.heading}
            intro={headline.body ?? undefined}
            period={PERIOD_LABEL}
          />
        ) : null}

        {/* ---- Impact by programme ---- */}
        {isVisible(byProgrammeSection) && byProgramme.length > 0 ? (
          <section aria-labelledby="by-programme-heading" className="py-section bg-surface">
            <Container>
              <h2
                id="by-programme-heading"
                className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
              >
                {byProgrammeSection.heading}
              </h2>

              {byProgrammeSection.body ? (
                <p className="measure mt-4 text-lg text-ink-muted">
                  {byProgrammeSection.body}
                </p>
              ) : null}

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
        {isVisible(methodology) ? (
          <section aria-labelledby="method-heading" className="bg-surface-lilac py-section">
            <Container>
              <div className="max-w-2xl">
                {methodology.eyebrow ? (
                  <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
                    {methodology.eyebrow}
                  </p>
                ) : null}
                <h2
                  id="method-heading"
                  className="mt-3 text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
                >
                  {methodology.heading}
                </h2>
                {methodology.body ? (
                  <p className="measure mt-4 text-lg text-ink-muted">
                    {methodology.body}
                  </p>
                ) : null}
              </div>

              {/* The definitions are read in order, top to bottom, so they get a
                  spine — a list device. Not a snake: a snake would claim these
                  are stages of a process, and they are definitions, not stages. */}
              <dl className="mt-12">
                <JourneySnake
                  variant="spine"
                  pinRing="surface-lilac"
                  items={(methodology.steps ?? []).map((step) => ({
                    title: step.title,
                    card: (
                      <div className="rounded-card border border-border bg-card p-6">
                        <dt className="text-lg font-semibold text-brand-600">
                          {step.title}
                        </dt>
                        <dd className="measure mt-1 text-ink-muted">
                          {step.description}
                        </dd>
                      </div>
                    ),
                  }))}
                />
              </dl>

              <p className="mt-8 text-sm text-ink-muted">
                <strong className="text-ink">Reporting period:</strong>{" "}
                {REPORTING_PERIOD.from} to {REPORTING_PERIOD.to}.
              </p>
            </Container>
          </section>
        ) : null}

        {/* ---- What we do not measure ---- */}
        {isVisible(gapsSection) ? (
          <section aria-labelledby="gaps-heading" className="py-section bg-surface">
            <Container>
              <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-16">
                <div>
                  <h2
                    id="gaps-heading"
                    className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
                  >
                    {gapsSection.heading}
                  </h2>
                  {gapsSection.body ? (
                    <p className="measure mt-4 text-lg text-ink-muted">
                      {gapsSection.body}
                    </p>
                  ) : null}
                </div>

                {/*
                  From `transparency_gaps`, not from a constant in this file and
                  not from a second list on the transparency page. The same four
                  gaps were written twice, in two phrasings; migration 0018
                  settled on one and both pages read it.
                */}
                <ul className="space-y-4">
                  {gaps.map((gap) => (
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
        ) : null}

        {/* ---- Reports and photographs ---- */}
        {isVisible(reports) ? (
          <section aria-labelledby="reports-heading" className="bg-brand py-section">
            <Container>
              <div className="max-w-2xl">
                <h2
                  id="reports-heading"
                  className="text-3xl font-semibold tracking-tight text-ink-inverse sm:text-4xl"
                >
                  {reports.heading}
                </h2>
                {reports.body ? (
                  <p className="measure mt-4 text-lg text-brand-100">
                    {reports.body}
                  </p>
                ) : null}
              </div>

              {/* Photography.
                  A number with no picture behind it is an assertion. The
                  figures on this page are the organisation's own, and putting a
                  face to "19 young mothers back in school" is what makes the
                  number mean something to a donor who has never heard of
                  Kibera.

                  Every photograph here is consented and credited in
                  doc/image-review.md. */}
              {(reports.images ?? []).length > 0 ? (
                <ul className="mt-12 grid gap-5 sm:grid-cols-2">
                  {(reports.images ?? []).map((photo) => (
                    <li
                      key={photo.path}
                      className="overflow-hidden rounded-card bg-brand-100/10"
                    >
                      <Image
                        src={photo.path}
                        alt={photo.alt}
                        width={1400}
                        height={933}
                        sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 560px"
                        className="aspect-[3/2] w-full object-cover"
                      />
                      {photo.caption ? (
                        <p className="px-5 py-3 text-sm text-brand-100">
                          {photo.caption}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}

              {/*
                The two documents stay in code for now, and that is deliberate.

                A document is a row in a table — title, description, file URL,
                published date — not a paragraph of page copy, and the annual
                report's title is derived from the reporting period above, so it
                has to move with the figures. Putting either into `site_sections`
                would freeze the period into prose and give the safeguarding
                policy a second, unversioned home when it already has a route.

                The `documents` table is the next piece of work, not this one.
              */}
              <h3 className="mt-12 text-sm font-semibold tracking-wide text-brand-100 uppercase">
                The written record
              </h3>
              <ul className="mt-5 space-y-3">
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
        ) : null}
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
