import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { DonateFlow } from "@/components/donate/donate-flow";
import { ImpactBand } from "@/components/donate/impact-band";
import { GivingOptionsSkeleton } from "@/components/site/skeletons";
import { MiniHeader } from "@/components/donate/mini-header";
import { Container } from "@/components/site/container";
import {
  bankRailUsable,
  getBankDetails,
  getDonateSections,
  getPaymentRails,
  getTaxReceipt,
} from "@/lib/data/donate";
import { getGivingTiers } from "@/lib/data/home";
import { getAllImpactStats } from "@/lib/data/impact";
import { isVisible } from "@/lib/data/sections";
import { breadcrumbJsonLd, jsonLdScript, absoluteUrl } from "@/lib/seo";

/**
 * Dynamic, not static. The page reads payment configuration, bank details and
 * tier amounts, all of which an admin can change without a deploy — a prerender
 * would serve a stale paybill. The form itself is a client boundary.
 */

export const metadata: Metadata = {
  title: "Donate",
  description:
    "Donate by M-Pesa or card. KSh 50,000 gives one girl a full re-entry package: fees, materials and mentorship.",
  alternates: {
    canonical: "/donate",
    languages: { "en-KE": "/donate", "x-default": "/donate" },
  },
  openGraph: {
    type: "website",
    url: "/donate",
    title: "Donate | Imarisha Dada",
    description:
      "Donate by M-Pesa or card. KSh 50,000 gives one girl a full re-entry package: fees, materials and mentorship.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Donate | Imarisha Dada",
    description:
      "Donate by M-Pesa or card. KSh 50,000 gives one girl a full re-entry package: fees, materials and mentorship.",
  },
  // A charity that hides its donate page from search loses transactional
  // traffic. `noindex` is explicitly not appropriate here.
  robots: { index: true, follow: true },
};

const donateActionJsonLd = {
  "@context": "https://schema.org",
  "@type": "DonateAction",
  name: "Donate to Imarisha Dada",
  url: absoluteUrl("/donate"),
  recipient: {
    "@type": "NGO",
    name: "Imarisha Dada",
    url: absoluteUrl("/"),
  },
  potentialAction: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "KES",
    eligibility: "Global",
    availableLanguage: ["en", "sw", "fr", "de", "pt"],
  },
};

async function DonateForm() {
  const [tiers, rails, bank, tax] = await Promise.all([
    getGivingTiers(),
    getPaymentRails(),
    getBankDetails(),
    getTaxReceipt(),
  ]);

  return (
    <DonateFlow
      tiers={tiers}
      rails={rails}
      bank={bank}
      tax={tax}
      bankUsable={bankRailUsable(bank)}
    />
  );
}

export default async function DonatePage({
  params,
}: PageProps<"/[locale]/donate">) {
  const { locale } = await params;

  // Pin the locale for static rendering. Without this, `next-intl` resolves it
  // from the request, which is uncached data and fails the `cacheComponents`
  // build. It must run in the page, not the layout: layouts execute after the
  // page they wrap.
  setRequestLocale(locale);

  const [sections, stats] = await Promise.all([
    getDonateSections(),
    getAllImpactStats(),
  ]);

  const hero = sections["donate-hero"];
  const impact = sections["donate-impact"];

  // The first active stat by `sort_order`. An editor chooses which figure leads
  // by reordering at /admin/impact — see the note in migration 0020.
  const headlineStat = stats[0] ?? null;

  return (
    <>
      <MiniHeader />

      <main id="main" className="bg-surface py-section">
        <Container>
          <div className="max-w-2xl">
            {isVisible(hero) ? (
              <>
                {hero.eyebrow ? (
                  <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
                    {hero.eyebrow}
                  </p>
                ) : null}
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-brand-600 sm:text-5xl">
                  {hero.heading}
                </h1>
                {hero.body ? (
                  <p className="measure mt-5 text-lg text-ink-muted">{hero.body}</p>
                ) : null}
              </>
            ) : null}
          </div>

          {isVisible(impact) ? (
            <ImpactBand stat={headlineStat} section={impact} />
          ) : null}

          {/* Payment config can be slow while Supabase warms; the shell renders
              immediately so the donor sees the page, not a spinner. */}
          <div className="mt-12">
            <Suspense
              // The shape of the amount picker, so the form does not jump
              // when the tiers arrive.
              fallback={<GivingOptionsSkeleton />}
            >
              <DonateForm />
            </Suspense>
          </div>
        </Container>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            donateActionJsonLd,
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Donate", path: "/donate" },
            ]),
          ]),
        }}
      />
    </>
  );
}
