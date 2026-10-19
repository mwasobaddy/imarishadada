import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";

import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { GivingWays } from "@/components/sections/giving-ways";
import { getBankDetails, bankRailUsable } from "@/lib/data/donate";
import { getGivingTiers } from "@/lib/data/home";
import { breadcrumbJsonLd, jsonLdScript, absoluteUrl } from "@/lib/seo";

/**
 * Ways to give — `/ways-to-give`.
 *
 * Shows every rail side by side rather than sending a donor to `/donate` to
 * discover their options. Amounts come from `giving_tiers` and bank details from
 * `settings`, so nothing here is hardcoded.
 *
 * Bank transfer renders a labelled placeholder until real account details exist:
 * a rail that takes a donor's money and then says "we will email you the
 * details" is worse than not offering it.
 */

export const metadata: Metadata = {
  title: "Ways to give",
  description:
    "Give by M-Pesa, card or bank transfer. Every amount is tied to a specific outcome for a girl in Kibera.",
  alternates: {
    canonical: "/ways-to-give",
    languages: { "en-KE": "/ways-to-give", "x-default": "/ways-to-give" },
  },
  openGraph: {
    type: "website",
    url: "/ways-to-give",
    locale: "en_KE",
    title: "Ways to give | Imarisha Dada",
    description: "Give by M-Pesa, card or bank transfer. Every amount funds a specific outcome.",
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

  const [tiers, bank] = await Promise.all([getGivingTiers(), getBankDetails()]);

  const bankReady = bankRailUsable(bank);

  return (
    <>
      <main id="main">
        <PageHero
          eyebrow="Ways to give"
          heading="Choose what your gift does."
          body="Give monthly and a mentor's continuity matters as much as a single emergency. Give once and a girl gets materials for a term."
        />

        <GivingWays tiers={tiers} />

        {/* ---- Rail comparison ---- */}
        <section aria-labelledby="rails-heading" className="py-section bg-surface">
          <Container>
            <h2
              id="rails-heading"
              className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
            >
              Three ways to pay
            </h2>
            <p className="measure mt-4 text-lg text-ink-muted">
              M-Pesa is recommended because it is cheaper and faster for you in
              Kenya — not because we prefer it.
            </p>

            <ul className="mt-10 grid gap-5 sm:grid-cols-3">
              <li className="rounded-card border border-brand-600/30 bg-brand-50 p-6">
                <h3 className="text-lg font-semibold text-brand-600">M-Pesa</h3>
                <p className="mt-2 text-sm text-ink-muted">
                  Cheapest and fastest in Kenya. The payment prompt arrives on your
                  phone — no app switching, no paybill to type.
                </p>
                <p className="mt-3 text-xs font-medium text-brand-600">
                  Being set up — coming soon
                </p>
              </li>

              <li className="rounded-card border border-border bg-card p-6">
                <h3 className="text-lg font-semibold text-ink">Card</h3>
                <p className="mt-2 text-sm text-ink-muted">
                  Visa and Mastercard, processed securely. Choose your currency at
                  checkout and we record both amounts.
                </p>
                <p className="mt-3 text-xs font-medium text-brand-600">Available now</p>
              </li>

              <li className="rounded-card border border-border bg-card p-6">
                <h3 className="text-lg font-semibold text-ink">Bank transfer</h3>
                {bankReady ? (
                  <p className="mt-2 text-sm text-ink-muted">
                    Best for larger gifts. Transfer to {bank.bankName}, account{" "}
                    {bank.accountNumber}.
                  </p>
                ) : (
                  <div className="mt-2">
                    <p className="text-sm text-ink-muted">
                      Best for larger gifts.
                    </p>
                    <p className="mt-2 rounded-lg border-2 border-dashed border-brand-600/30 bg-surface-lilax p-3 text-xs text-ink-muted">
                      Placeholder — bank details are being confirmed. We would rather
                      show this than publish an account number we cannot verify.
                    </p>
                  </div>
                )}
                <p className="mt-3 text-xs font-medium text-brand-600">
                  {bankReady ? "Available now" : "Being set up"}
                </p>
              </li>
            </ul>

            <div className="mt-12">
              <Link
                href="/donate"
                className="inline-flex min-h-13 items-center justify-center rounded-lg bg-gold px-8 text-base font-semibold text-gold-ink transition-colors hover:bg-gold/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink-inverse"
              >
                Give now
              </Link>
            </div>
          </Container>
        </section>

        {/* ---- Transparency ---- */}
        <section aria-labelledby="wtg-trust-heading" className="bg-surface-lilac py-section">
          <Container>
            <div className="max-w-2xl">
              <h2
                id="wtg-trust-heading"
                className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
              >
                What happens after you press give
              </h2>
              <ul className="mt-8 space-y-4 leading-relaxed text-ink-muted">
                <li>
                  <strong className="text-ink">You see the fee first.</strong> The
                  total that leaves your account is on screen before you pay, never a
                  surprise at confirmation.
                </li>
                <li>
                  <strong className="text-ink">A receipt goes out by email</strong>{" "}
                  once the payment provider confirms.
                </li>
                <li>
                  <strong className="text-ink">Restricted gifts are reported
                  against their outcome.</strong> If you fund a re-entry package, that
                  is what we report against.
                </li>
                <li>
                  <strong className="text-ink">We do not claim tax treatment we
                  cannot deliver.</strong> Read the{" "}
                  <Link
                    href="/legal/terms"
                    className="font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4"
                  >
                    terms on donations
                  </Link>{" "}
                  before you ask.
                </li>
              </ul>
            </div>
          </Container>
        </section>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            {
              "@context": "https://schema.org",
              "@type": "WebPage",
              name: "Ways to give",
              url: absoluteUrl("/ways-to-give"),
              inLanguage: "en-KE",
            },
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
