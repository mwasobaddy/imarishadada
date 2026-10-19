import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { DonateFlow } from "@/components/donate/donate-flow";
import { MiniHeader } from "@/components/donate/mini-header";
import { Container } from "@/components/site/container";
import {
  bankRailUsable,
  getBankDetails,
  getPaymentRails,
  getTaxReceipt,
} from "@/lib/data/donate";
import { getGivingTiers } from "@/lib/data/home";
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

  const t = await getTranslations({ locale, namespace: "donate" });

  return (
    <>
      <MiniHeader />

      <main id="main" className="bg-surface py-section">
        <Container>
          <div className="max-w-2xl">
            <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
              Give
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-brand-600 sm:text-5xl">
              {t("title")}.
            </h1>
            <p className="measure mt-5 text-lg text-ink-muted">
              Every amount below is tied to a specific outcome. Give monthly and a
              mentor&rsquo;s continuity matters as much as a single emergency.
            </p>
          </div>

          {/* Payment config can be slow while Supabase warms; the shell renders
              immediately so the donor sees the page, not a spinner. */}
          <div className="mt-12">
            <Suspense
              fallback={
                <p className="text-ink-muted" role="status">
                  Loading giving options…
                </p>
              }
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
