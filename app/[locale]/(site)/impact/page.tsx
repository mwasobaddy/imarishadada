import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { ImpactByProgramme } from "@/components/impact/by-programme";
import { ImpactGaps } from "@/components/impact/gaps";
import { ImpactMethodology } from "@/components/impact/methodology";
import { ImpactReports } from "@/components/impact/reports";
import { PageHero } from "@/components/site/page-hero";
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
        {isVisible(byProgrammeSection) ? (
          <ImpactByProgramme
            section={byProgrammeSection}
            programmes={programmes}
            stats={stats}
          />
        ) : null}

        {/* ---- Methodology ---- */}
        {isVisible(methodology) ? <ImpactMethodology section={methodology} /> : null}

        {/* ---- What we do not measure ---- */}
        {isVisible(gapsSection) ? (
          <ImpactGaps section={gapsSection} gaps={gaps} />
        ) : null}

        {/* ---- Reports and photographs ---- */}
        {isVisible(reports) ? <ImpactReports section={reports} /> : null}
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
