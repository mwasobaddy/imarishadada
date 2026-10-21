import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { PageHero } from "@/components/site/page-hero";
import {
  PartnerApply,
  PartnerCannot,
  PartnerDirect,
  PartnerDueDiligence,
  PartnerList,
  PartnerNeed,
} from "@/components/partner/sections";
import { getContactDetails } from "@/lib/data/contact";
import { getPartnerSections, getPublicPartners } from "@/lib/data/partner";
import { isVisible } from "@/lib/data/sections";
import { absoluteUrl, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";

/**
 * Partner — `/partner`.
 *
 * ## What was wrong
 *
 * A `ProseRoute` constant with no form, and a public API that would have served
 * any partner marked active, whether or not it was a test or had written
 * permission. See migration 0027 for the gate that now refuses both.
 *
 * ## Only publishable partners appear
 *
 * `getPublicPartners` returns active, non-test rows with written permission on
 * file, and the section is hidden when that list is empty. Until an organisation
 * has signed off, the page says so in words, not with empty logo boxes.
 *
 * ## What is not on this page yet
 *
 * The roadmap's cohort cost table and its \"ways to partner\" tabs. Cohort costs
 * wait for verified figures and an admin path to enter them; the giving-tiers
 * editor has no cohort option today. The tabs would publish offers the
 * organisation has not confirmed, such as matched giving and cause marketing.
 */

const TITLE = "Partner with us";
const DESCRIPTION =
  "Partner with Imarisha Dada on girls' education, school re-entry and economic empowerment in Kibera, Nairobi. How we work with funders, what we need, and what we cannot yet offer.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/partner",
    languages: { "en-KE": "/partner", "x-default": "/partner" },
  },
  openGraph: {
    type: "website",
    url: "/partner",
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

export default async function PartnerPage({ params }: PageProps<"/[locale]/partner">) {
  const { locale } = await params;

  // Pin the locale for static rendering. It must run in the page, not the layout,
  // because layouts execute after the page they wrap.
  setRequestLocale(locale);

  const [sections, partners, contact] = await Promise.all([
    getPartnerSections(),
    getPublicPartners(),
    getContactDetails(),
  ]);

  const hero = sections["partner-hero"];
  const need = sections["partner-need"];
  const cannot = sections["partner-cannot"];
  const dd = sections["partner-dd"];
  const partnersSection = sections["partner-partners"];
  const form = sections["partner-form"];
  const direct = sections["partner-direct"];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    url: absoluteUrl("/partner"),
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

        {isVisible(need) ? <PartnerNeed section={need} /> : null}

        {isVisible(cannot) ? <PartnerCannot section={cannot} /> : null}

        {isVisible(dd) ? <PartnerDueDiligence section={dd} /> : null}

        {/* Hidden entirely when no partner is publishable. See lib/data/partner.ts. */}
        {isVisible(partnersSection) ? (
          <PartnerList section={partnersSection} partners={partners} />
        ) : null}

        {isVisible(form) ? <PartnerApply section={form} /> : null}

        {isVisible(direct) ? (
          <PartnerDirect section={direct} contact={contact} />
        ) : null}
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            jsonLd,
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Partner with us", path: "/partner" },
            ]),
          ]),
        }}
      />
    </>
  );
}
