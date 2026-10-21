import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";

import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/site/container";
import { ClosingCta } from "@/components/sections/closing-cta";
import { GivingWays } from "@/components/sections/giving-ways";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
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
import type { PaymentRail } from "@/lib/donate/money";

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

const RAIL_ORDER: PaymentRail[] = ["mpesa", "card", "bank"];

/**
 * The four promises, and the non-financial asks.
 *
 * Both are `[{title, description}]` — the same shape as the programmes pathway
 * and the impact methodology, so an editor meets the same widget rather than a
 * third variation of the same idea.
 */
function StepList({ steps }: { steps: { title: string; description: string }[] }) {
  return (
    <ul className="mt-8 space-y-5">
      {steps.map((step) => (
        <li key={step.title} className="border-l-2 border-brand-600/30 pl-5">
          <p className="font-semibold text-ink">{step.title}</p>
          <p className="measure mt-1 leading-relaxed text-ink-muted">
            {step.description}
          </p>
        </li>
      ))}
    </ul>
  );
}

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

  // A rail with no real account details is "being set up" whatever the adapter
  // situation is — the donor cannot complete a transfer to an account we have
  // not published.
  const statusFor = (rail: PaymentRail) =>
    rail === "bank" && !bankReady ? "coming_soon" : statuses[rail];

  const statusLabel = (rail: PaymentRail) =>
    statusFor(rail) === "available" ? "Available now" : "Being set up";

  /**
   * The rail's short name, for the card heading.
   *
   * `settings.payment_rails` stores a full label ("Pay with card") because it is
   * used as a button label on `/donate`. This page needs the noun. Deriving it
   * rather than hardcoding keeps the name editable, and capitalising matters:
   * `"card"` as a heading looked like a typo.
   */
  const railName = (rail: PaymentRail) => {
    const short = rails[rail].label.replace(/^pay with\s+/i, "").trim();
    return short.charAt(0).toUpperCase() + short.slice(1);
  };

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
          <section aria-labelledby="rails-heading" className="py-section bg-surface-lilac">
            <Container>
              <div className="max-w-2xl">
                <h2
                  id="rails-heading"
                  className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
                >
                  {railsSection.heading}
                </h2>
                {railsSection.body ? (
                  <p className="measure mt-4 text-lg text-ink-muted">
                    {railsSection.body}
                  </p>
                ) : null}
              </div>

              <ul className="mt-10 grid gap-5 sm:grid-cols-3">
                {RAIL_ORDER.map((rail) => {
                  const config = rails[rail];
                  const available = statusFor(rail) === "available";

                  return (
                    <li
                      key={rail}
                      className={`rounded-card border p-6 ${
                        available
                          ? "border-border bg-card"
                          : "border-border bg-surface"
                      }`}
                    >
                      <h3 className="text-lg font-semibold text-brand-600">
                        {railName(rail)}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                        {config.hint}
                      </p>

                      {rail === "bank" && available ? (
                        // Real `<dl>` rather than a styled block, and plain text
                        // rather than an image, so it is readable by a screen
                        // reader and copyable in one selection.
                        <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
                          <div className="flex gap-2">
                            <dt className="text-ink-muted">Bank</dt>
                            <dd className="font-medium break-all text-ink">
                              {bank.bankName}
                            </dd>
                          </div>
                          <div className="flex gap-2">
                            <dt className="text-ink-muted">Account</dt>
                            <dd className="font-medium break-all text-ink">
                              {bank.accountName}
                            </dd>
                          </div>
                          <div className="flex gap-2">
                            <dt className="text-ink-muted">Number</dt>
                            <dd className="tabular font-medium break-all text-ink">
                              {bank.accountNumber}
                            </dd>
                          </div>
                          {bank.branch ? (
                            <div className="flex gap-2">
                              <dt className="text-ink-muted">Branch</dt>
                              <dd className="font-medium break-all text-ink">
                                {bank.branch}
                              </dd>
                            </div>
                          ) : null}
                        </dl>
                      ) : null}

                      {rail === "bank" && !available ? (
                        <p className="mt-4 rounded-lg border-2 border-dashed border-brand-600/30 bg-card p-3 text-xs leading-relaxed text-ink-muted">
                          Account details are being confirmed. We would rather show
                          this than publish a number we cannot verify.
                        </p>
                      ) : null}

                      <p
                        className={`mt-4 text-xs font-medium ${
                          available ? "text-brand-600" : "text-ink-muted"
                        }`}
                      >
                        {statusLabel(rail)}
                      </p>
                    </li>
                  );
                })}
              </ul>

              {railsSection.ctaLabel && railsSection.ctaHref ? (
                <div className="mt-12">
                  <InteractiveHoverButton
                    href={railsSection.ctaHref}
                    className="min-h-13 w-fit rounded-full bg-gold px-8 text-base font-semibold text-gold-ink"
                  >
                    {railsSection.ctaLabel}
                  </InteractiveHoverButton>
                </div>
              ) : null}
            </Container>
          </section>
        ) : null}

        {/* ---- What happens after you press give ---- */}
        {isVisible(transparency) ? (
          <section
            aria-labelledby="wtg-trust-heading"
            className="bg-surface py-section"
          >
            <Container>
              <div className="max-w-2xl">
                <h2
                  id="wtg-trust-heading"
                  className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
                >
                  {transparency.heading}
                </h2>
                {transparency.body ? (
                  <p className="measure mt-4 text-lg text-ink-muted">
                    {transparency.body}
                  </p>
                ) : null}

                <StepList steps={transparency.steps ?? []} />

                <p className="mt-8 text-sm text-ink-muted">
                  Read the{" "}
                  <Link
                    href="/legal/terms"
                    className="font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-700"
                  >
                    terms on donations
                  </Link>{" "}
                  before you ask. We do not claim tax treatment we cannot deliver.
                </p>
              </div>
            </Container>
          </section>
        ) : null}

        {/* ---- Give as an organisation ---- */}
        {isVisible(organisation) ? (
          <section aria-labelledby="wtg-org-heading" className="bg-surface-lilac py-section">
            <Container>
              <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
                <div>
                  <h2
                    id="wtg-org-heading"
                    className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
                  >
                    {organisation.heading}
                  </h2>
                  {organisation.body ? (
                    <p className="measure mt-4 text-lg text-ink-muted">
                      {organisation.body}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col justify-center rounded-card border border-border bg-card p-8">
                  <ul className="space-y-3 text-ink-muted">
                    <li>
                      <strong className="text-ink">Matched giving.</strong> Your staff
                      match your donation.
                    </li>
                    <li>
                      <strong className="text-ink">Cause marketing.</strong> Align your
                      brand with girls&rsquo; education.
                    </li>
                    <li>
                      <strong className="text-ink">Grants.</strong> Multi-year programme
                      funding, reported against outcomes.
                    </li>
                  </ul>
                  {organisation.ctaLabel && organisation.ctaHref ? (
                    <Link
                      href={organisation.ctaHref}
                      className="mt-6 inline-flex min-h-11 w-fit items-center text-sm font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-700"
                    >
                      {organisation.ctaLabel} →
                    </Link>
                  ) : null}
                </div>
              </div>
            </Container>
          </section>
        ) : null}

        {/* ---- Other ways to help ---- */}
        {isVisible(other) ? (
          <section aria-labelledby="wtg-other-heading" className="bg-surface py-section">
            <Container>
              <div className="max-w-2xl">
                <h2
                  id="wtg-other-heading"
                  className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
                >
                  {other.heading}
                </h2>
                {other.body ? (
                  <p className="measure mt-4 text-lg text-ink-muted">{other.body}</p>
                ) : null}

                <StepList steps={other.steps ?? []} />

                <p className="mt-8 text-sm text-ink-muted">
                  <Link
                    href="/contact"
                    className="font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-700"
                  >
                    Get in touch
                  </Link>{" "}
                  about any of these and we will tell you what is actually useful
                  right now.
                </p>
              </div>
            </Container>
          </section>
        ) : null}
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
