import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import {
  ProgrammesMeasure,
  ProgrammesPathway,
  ProgrammesUnrestricted,
} from "@/components/programmes/sections";
import { ProgrammeCard } from "@/components/sections/programme-card";
import { getProgrammes } from "@/lib/data/home";
import { getProgrammeSections } from "@/lib/data/programmes";
import { isVisible } from "@/lib/data/sections";
import { absoluteUrl, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";

/**
 * Programmes index — `/programmes`.
 *
 * This is the hub the header nav and the footer both link to, and the
 * breadcrumb parent for every programme detail page. It existed as a link long
 * before it existed as a route, which meant the primary navigation sent visitors
 * to a 404.
 *
 * Prerendered: the programme list is content, not a per-request read.
 */

export const metadata: Metadata = {
  title: "Our programmes",
  description:
    "Four programmes in Kibera, Nairobi: school re-entry for young mothers, economic empowerment, Dada Space for girls aged 9–16, and the Community Hub.",
  alternates: {
    canonical: "/programmes",
    languages: { "en-KE": "/programmes", "x-default": "/programmes" },
  },
  openGraph: {
    type: "website",
    url: "/programmes",
    locale: "en_KE",
      images: ["/opengraph-image"],
    title: "Our programmes | Imarisha Dada",
    description:
      "Four programmes in Kibera, Nairobi: school re-entry for young mothers, economic empowerment, Dada Space for girls aged 9–16, and the Community Hub.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Our programmes | Imarisha Dada",
    description:
      "Four programmes in Kibera, Nairobi: school re-entry for young mothers, economic empowerment, Dada Space for girls aged 9–16, and the Community Hub.",
  },
};

/**
 * How the four programmes connect, presented as an intended pathway.
 *
 * ⚠️ UNVERIFIED — needs programme staff sign-off before this is published.
 *
 * The roadmap is explicit that this sequence is a claim, not a description: "If
 * Dada Space participants do not in practice feed into re-entry and economic
 * programmes, do not imply a pipeline. Donors will ask."
 *
 * It is rendered because the section carries real weight on the page, but it is
 * marked with a visible caveat rather than asserted as fact. Confirm how the
 * programmes actually connect, then delete `unverified` and the note below.
 */
export default async function ProgrammesPage({
  params,
}: PageProps<"/[locale]/programmes">) {
  const { locale } = await params;

  // Pin the locale for static rendering. Without this, `next-intl` resolves it
  // from the request, which is uncached data and fails the `cacheComponents`
  // build. It must run in the page, not the layout: layouts execute after the
  // page they wrap.
  setRequestLocale(locale);

  const [programmes, sections] = await Promise.all([
    getProgrammes(),
    getProgrammeSections(),
  ]);

  const hero = sections["programmes-hero"];
  const pathway = sections["programmes-pathway"];
  const measure = sections["programmes-measure"];
  const unrestricted = sections["programmes-unrestricted"];

  const listJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Imarisha Dada programmes",
    url: absoluteUrl("/programmes"),
    numberOfItems: programmes.length,
    itemListElement: programmes.map((programme, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/programmes/${programme.slug}`),
      name: programme.title,
    })),
  };

  return (
    <>
      <main id="main">
        {isVisible(hero) ? (
          <PageHero
            eyebrow={hero.eyebrow ?? undefined}
            heading={hero.heading}
            body={hero.body ?? undefined}
          />
        ) : null}

        <section aria-labelledby="programmes-list-heading" className="py-section bg-surface">
          <Container>
            <h2
              id="programmes-list-heading"
              className="sr-only"
            >
              All programmes
            </h2>

            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {programmes.map((programme) => (
                <li key={programme.slug} className="flex">
                  <ProgrammeCard programme={programme} />
                </li>
              ))}
            </ul>
          </Container>
        </section>

        {/* ---- How they fit together ------------------------------------ */}
        {isVisible(pathway) ? <ProgrammesPathway section={pathway} /> : null}

        {/* ---- How we measure ------------------------------------------- */}
        {isVisible(measure) ? <ProgrammesMeasure section={measure} /> : null}

        {/* ---- Support all of them -------------------------------------- */}
        {isVisible(unrestricted) ? (
          <ProgrammesUnrestricted section={unrestricted} />
        ) : null}
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            listJsonLd,
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Programmes", path: "/programmes" },
            ]),
          ]),
        }}
      />
    </>
  );
}
