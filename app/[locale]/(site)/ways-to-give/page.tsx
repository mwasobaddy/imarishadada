import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { PageHero } from "@/components/site/page-hero";
import { ClosingCta } from "@/components/sections/closing-cta";
import { GivingWays } from "@/components/sections/giving-ways";
import {
  WaysOrganisation,
  WaysOther,
  WaysRails,
  WaysTransparency,
} from "@/components/sections/ways-to-give";
import {
  bankRailUsable,
  getBankDetails,
  getPaymentRails,
  getWaysToGiveSections,
  railStatuses,
} from "@/lib/data/donate";
import { getGivingTiers } from "@/lib/data/home";
import { isVisible } from "@/lib/data/sections";
import { breadcrumbJsonLd, jsonLdScript, absoluteUrl } from "@/lib/seo";

/**
 * Ways to give — `/ways-to-give`.
 *
 * The roadmap's framing: this page "captures giving modes the online form
 * cannot" — bank transfer for large gifts, corporate and foundation giving,
 * in-kind, fundraising on a donor's behalf. Without those it is a second copy of
 * the donate page's rails, which is what it had become.
 *
 * ## The rail statuses are derived, not written
 *
 * The page used to hardcode them, and one was **false on the live site**: it
 * printed "Card — Available now" while the card rail cannot complete a charge.
 * `settings.payment_rails.card.enabled` is `true`, but no payment adapter is
 * implemented, so `NEXT_PUBLIC_DONATE_MODE` is unset in production and every
 * card payment fails with "Payments are not configured yet".
 *
 * `railStatuses()` now combines the editorial switch with whether a provider can
 * actually take the money, so the labels cannot drift from the truth. When a
 * real adapter lands they flip on their own.
 *
 * ## Nothing on this page promises a mechanism that does not exist
 *
 * No paybill number, no Gift Aid claim, no fundraising tracker, no legacy
 * contact — see the note at the foot of migration 0021 for why each is absent.
 * A giving page that lists a rail you cannot use costs more trust than a
 * shorter page that lists three you can.
 */

export const metadata: Metadata = {
  title: "Ways to give",
  description:
    "Give by M-Pesa, card or bank transfer, or as an organisation. Every amount is tied to a specific outcome for a girl in Kibera, and every gift is reported against it.",
  alternates: {
    canonical: "/ways-to-give",
    languages: { "en-KE": "/ways-to-give", "x-default": "/ways-to-give" },
  },
  openGraph: {
    type: "website",
    url: "/ways-to-give",
    locale: "en_KE",
    images: ["/opengraph-image"],
    title: "Ways to give | Imarisha Dada",
    description:
      "Give by M-Pesa, card or bank transfer. Every amount funds a specific outcome.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ways to give | Imarisha Dada",
    description:
      "Give by M-Pesa, card or bank transfer. Every amount funds a specific outcome.",
  },
};

export default async function WaysToGivePage({
  params,
}: PageProps<"/[locale]/ways-to-give">) {
  const { locale } = await params;

  // Pin the locale for static rendering. Without this, `next-intl` resolves it
  // from the request, which is uncached data and fails the `cacheComponents`
  // build. It must run in the page, not the layout: layouts execute after the
  // page they wrap.
  setRequestLocale(locale);

  const [sections, tiers, rails, bank] = await Promise.all([
    getWaysToGiveSections(),
    getGivingTiers(),
    getPaymentRails(),
    getBankDetails(),
  ]);

  const hero = sections["ways-hero"];
  const ladder = sections["ways-ladder"];
  const railsSection = sections["ways-rails"];
  const transparency = sections["ways-transparency"];
  const organisation = sections["ways-organisation"];
  const other = sections["ways-other"];

  const bankReady = bankRailUsable(bank);
  const statuses = railStatuses(rails);

  const giveActionJsonLd = {
    "@context": "https://schema.org",
    "@type": "GiveAction",
    name: "Give to Imarisha Dada",
    url: absoluteUrl("/ways-to-give"),
    inLanguage: "en-KE",
    recipient: { "@id": absoluteUrl("/#organisation") },
    potentialAction: {
      "@type": "Offer",
      priceCurrency: "KES",
      price: "0",
      // Only the rails that can actually complete a gift are advertised in
      // structured data. Marking an unavailable rail as an offer would put a
      // claim in front of Google that the page itself does not make.
      availableLanguage: ["en"],
    },
  };

  return (
    <>
      <main id="main">
        {isVisible(hero) ? (
          <PageHero eyebrow={hero.eyebrow} heading={hero.heading} body={hero.body} />
        ) : null}

        {isVisible(ladder) ? (
          <GivingWays tiers={tiers} section={ladder} moreHref={null} />
        ) : null}

        {/* ---- How you can pay ---- */}
        {isVisible(railsSection) ? (
          <WaysRails
            section={railsSection}
            rails={rails}
            bank={bank}
            statuses={statuses}
            bankReady={bankReady}
          />
        ) : null}

        {/* ---- What happens after you press give ---- */}
        {isVisible(transparency) ? (
          <WaysTransparency section={transparency} />
        ) : null}

        {/* ---- Give as an organisation ---- */}
        {isVisible(organisation) ? (
          <WaysOrganisation section={organisation} />
        ) : null}

        {/* ---- Other ways to help ---- */}
        {isVisible(other) ? <WaysOther section={other} /> : null}
      </main>

      <ClosingCta />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            giveActionJsonLd,
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Ways to give", path: "/ways-to-give" },
            ]),
          ]),
        }}
      />
    </>
  );
}
