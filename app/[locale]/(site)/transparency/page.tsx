import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";

import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { FinancialTables } from "@/components/transparency/financial-tables";
import { GapTable } from "@/components/transparency/gap-table";
import {
  getFinancialBreakdown,
  getTransparencyGaps,
  getTransparencySections,
} from "@/lib/data/transparency";
import { isVisible } from "@/lib/data/sections";
import { breadcrumbJsonLd, jsonLdScript, absoluteUrl } from "@/lib/seo";
import type { SiteSection } from "@/lib/data/types";

/**
 * Transparency — `/transparency`.
 *
 * ## This is the first page to leave `ProseRoute`
 *
 * It used to render from `TRANSPARENCY_PAGE` in `lib/data/pages.ts`, with
 * `draft: true` — a live route, linked from the footer, showing an "In
 * preparation" banner. `ProseRoute`'s own comment says "Anything needing a
 * database row or an admin override does not belong there", and this page needs
 * both: the gaps come from `transparency_gaps` and an editor has to be able to
 * mark them done.
 *
 * ## The page's argument
 *
 * The roadmap: "For an organisation that has not yet been independently
 * examined, this page is mostly about publishing the gaps honestly — which reads
 * as more credible than a polished page implying controls that do not exist."
 *
 * So nothing here is invented. There are no financial figures because no
 * statement exists; the section says that instead of showing a placeholder. The
 * safeguarding officer is named as not yet appointed, which the policy page
 * already says. The registration number is listed as outstanding, which the
 * footer already says.
 *
 * ## The two gap lists come from one table
 *
 * `transparency_gaps` holds both, discriminated by `kind`. The measurement list
 * is the same rows `/impact` publishes — previously this page carried its own
 * hand-written copy of them, in different words, so the two pages would have
 * disagreed the moment anyone edited either.
 */

const TITLE = "Transparency";
const DESCRIPTION =
  "How Imarisha Dada is run: where the money goes, how we are governed, our safeguarding position, how to raise a concern, and the things we have not yet done.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/transparency",
    languages: { "en-KE": "/transparency", "x-default": "/transparency" },
  },
  openGraph: {
    type: "website",
    url: "/transparency",
    locale: "en_KE",
    images: ["/opengraph-image"],
    title: `${TITLE} | Imarisha Dada`,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | Imarisha Dada`,
    description: DESCRIPTION,
  },
};

/** A prose section with a heading, body and optional second paragraph. */
function ProseSection({
  id,
  section,
  children,
}: {
  id: string;
  section: SiteSection;
  children?: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-2xl font-semibold tracking-tight text-brand-600 sm:text-3xl">
        {section.heading}
      </h2>
      {section.body ? (
        <p className="measure mt-4 leading-relaxed text-ink-muted">{section.body}</p>
      ) : null}
      {children}
      {section.bodySecondary ? (
        <p className="measure mt-6 border-l-2 border-brand-600/30 pl-5 text-sm leading-relaxed text-ink-muted">
          {section.bodySecondary}
        </p>
      ) : null}
      {section.ctaLabel && section.ctaHref ? (
        <Link
          href={section.ctaHref}
          className="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
        >
          {section.ctaLabel} →
        </Link>
      ) : null}
    </section>
  );
}

export default async function TransparencyPage({
  params,
}: PageProps<"/[locale]/transparency">) {
  const { locale } = await params;

  // Pin the locale for static rendering. Without this, `next-intl` resolves it
  // from the request, which is uncached data and fails the `cacheComponents`
  // build. It must run in the page, not the layout: layouts execute after the
  // page they wrap.
  setRequestLocale(locale);

  const [sections, governance, measurement, financials] = await Promise.all([
    getTransparencySections(),
    getTransparencyGaps("governance"),
    getTransparencyGaps("measurement"),
    getFinancialBreakdown(),
  ]);

  const hero = sections["transparency-hero"];
  const gaps = sections["transparency-gaps"];
  const measure = sections["transparency-measure"];
  const money = sections["transparency-money"];
  const moneyStatus = sections["transparency-money-status"];
  const governanceSection = sections["transparency-governance"];
  const safeguarding = sections["transparency-safeguarding"];
  const complaints = sections["transparency-complaints"];

  // The in-page nav is built from what actually renders, so a hidden section
  // does not leave a link to an anchor that is not there.
  const contents = [
    { id: "gaps", label: gaps.heading, show: isVisible(gaps) && governance.length > 0 },
    { id: "measure", label: measure.heading, show: isVisible(measure) && measurement.length > 0 },
    { id: "money", label: money.heading, show: isVisible(money) },
    { id: "governance", label: governanceSection.heading, show: isVisible(governanceSection) },
    { id: "safeguarding", label: safeguarding.heading, show: isVisible(safeguarding) },
    { id: "complaints", label: complaints.heading, show: isVisible(complaints) },
  ].filter((c) => c.show);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Transparency",
    url: absoluteUrl("/transparency"),
    inLanguage: "en-KE",
    description: DESCRIPTION,
    isPartOf: { "@type": "WebSite", name: "Imarisha Dada", url: absoluteUrl("/") },
  };

  return (
    <>
      <main id="main">
        {isVisible(hero) ? (
          <PageHero eyebrow={hero.eyebrow} heading={hero.heading} body={hero.body} />
        ) : null}

        <Container className="py-section">
          <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
            <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
              <p className="text-sm font-semibold tracking-wide text-ink uppercase">
                On this page
              </p>
              <ol className="mt-4 space-y-2">
                {contents.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="text-sm text-brand-600 underline decoration-brand-600/30 underline-offset-4 hover:decoration-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="max-w-2xl space-y-14">
              {/* ---- What we have not yet done ------------------------- */}
              {isVisible(gaps) ? (
                <ProseSection id="gaps" section={gaps}>
                  <GapTable
                    gaps={governance}
                    caption="Things Imarisha Dada has not yet put in place, with their current status."
                    itemHeading="Not yet in place"
                  />
                </ProseSection>
              ) : null}

              {/* ---- What we cannot yet measure ------------------------ */}
              {isVisible(measure) ? (
                <ProseSection id="measure" section={measure}>
                  <GapTable
                    gaps={measurement}
                    caption="Things about Imarisha Dada's work that cannot yet be measured, with their current status."
                    itemHeading="Not yet measured"
                  />
                </ProseSection>
              ) : null}

              {/* ---- Where the money goes ------------------------------ */}
              {isVisible(money) ? (
                <ProseSection id="money" section={money}>
                  {/* Renders nothing while `financial_breakdown` is empty. */}
                  <FinancialTables lines={financials} />
                </ProseSection>
              ) : null}

              {isVisible(moneyStatus) ? (
                <section aria-labelledby="money-status-heading">
                  <h3
                    id="money-status-heading"
                    className="text-lg font-semibold text-brand-600"
                  >
                    {moneyStatus.heading}
                  </h3>
                  {moneyStatus.body ? (
                    <p className="measure mt-3 leading-relaxed text-ink-muted">
                      {moneyStatus.body}
                    </p>
                  ) : null}
                </section>
              ) : null}

              {/* ---- Governance ---------------------------------------- */}
              {isVisible(governanceSection) ? (
                <ProseSection id="governance" section={governanceSection} />
              ) : null}

              {/* ---- Safeguarding -------------------------------------- */}
              {isVisible(safeguarding) ? (
                <ProseSection id="safeguarding" section={safeguarding} />
              ) : null}

              {/*
                The `complaints` id is load-bearing: the footer's "Raise a
                concern" link points at /transparency#complaints. Removing or
                renaming this section breaks a live link.
              */}
              {isVisible(complaints) ? (
                <ProseSection id="complaints" section={complaints} />
              ) : null}
            </div>
          </div>
        </Container>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            jsonLd,
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Transparency", path: "/transparency" },
            ]),
          ]),
        }}
      />
    </>
  );
}
