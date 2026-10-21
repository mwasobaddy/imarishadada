import Link from "next/link";

import { Container } from "@/components/site/container";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import type { BankDetails, PaymentRails, RailStatus } from "@/lib/data/donate";
import type { PaymentRail } from "@/lib/donate/money";
import type { SiteSection } from "@/lib/data/types";

/**
 * The sections of `/ways-to-give` that are not the giving ladder.
 *
 * ## Why they are components
 *
 * They were written in the page file, which meant the admin's live preview —
 * which renders the *real* components — had nothing to call for four of the
 * six sections on the page. Now the page and the preview render the same
 * code, so the preview is the page.
 *
 * ## Why the rail status is passed in rather than derived here
 *
 * `railStatuses()` combines the editorial switch with whether a payment
 * provider can actually take the money, and that second half is an
 * environment fact the browser cannot know. The server derives it and hands
 * over the answer, so the preview says "Available now" only when the site can
 * really take the money.
 */

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

/** How you can pay. */
export function WaysRails({
  section,
  rails,
  bank,
  statuses,
  bankReady,
}: {
  section: SiteSection;
  rails: PaymentRails;
  bank: BankDetails;
  /** Whether a provider can complete a charge, per rail. */
  statuses: Record<PaymentRail, RailStatus>;
  /** Whether the published bank details are complete enough to use. */
  bankReady: boolean;
}) {
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

  return (
    <section aria-labelledby="rails-heading" className="py-section bg-surface-lilac">
      <Container>
        <div className="max-w-2xl">
          <h2
            id="rails-heading"
            className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
          >
            {section.heading}
          </h2>
          {section.body ? (
            <p className="measure mt-4 text-lg text-ink-muted">{section.body}</p>
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
                  available ? "border-border bg-card" : "border-border bg-surface"
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
                  // rather than an image, so it is readable by a screen reader
                  // and copyable in one selection.
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
                    Account details are being confirmed. We would rather show this
                    than publish a number we cannot verify.
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

        {section.ctaLabel && section.ctaHref ? (
          <div className="mt-12">
            <InteractiveHoverButton
              href={section.ctaHref}
              className="min-h-13 w-fit rounded-full bg-gold px-8 text-base font-semibold text-gold-ink"
            >
              {section.ctaLabel}
            </InteractiveHoverButton>
          </div>
        ) : null}
      </Container>
    </section>
  );
}

/** What happens after you press give. */
export function WaysTransparency({ section }: { section: SiteSection }) {
  return (
    <section aria-labelledby="wtg-trust-heading" className="bg-surface py-section">
      <Container>
        <div className="max-w-2xl">
          <h2
            id="wtg-trust-heading"
            className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
          >
            {section.heading}
          </h2>
          {section.body ? (
            <p className="measure mt-4 text-lg text-ink-muted">{section.body}</p>
          ) : null}

          <StepList steps={section.steps ?? []} />

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
  );
}

/** Give as an organisation. */
export function WaysOrganisation({ section }: { section: SiteSection }) {
  return (
    <section aria-labelledby="wtg-org-heading" className="bg-surface-lilac py-section">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <h2
              id="wtg-org-heading"
              className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
            >
              {section.heading}
            </h2>
            {section.body ? (
              <p className="measure mt-4 text-lg text-ink-muted">{section.body}</p>
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
            {section.ctaLabel && section.ctaHref ? (
              <Link
                href={section.ctaHref}
                className="mt-6 inline-flex min-h-11 w-fit items-center text-sm font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-700"
              >
                {section.ctaLabel} →
              </Link>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}

/** Other ways to help. */
export function WaysOther({ section }: { section: SiteSection }) {
  return (
    <section aria-labelledby="wtg-other-heading" className="bg-surface py-section">
      <Container>
        <div className="max-w-2xl">
          <h2
            id="wtg-other-heading"
            className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl"
          >
            {section.heading}
          </h2>
          {section.body ? (
            <p className="measure mt-4 text-lg text-ink-muted">{section.body}</p>
          ) : null}

          <StepList steps={section.steps ?? []} />

          <p className="mt-8 text-sm text-ink-muted">
            <Link
              href="/contact"
              className="font-medium text-brand-600 underline decoration-brand-600/40 underline-offset-4 hover:decoration-brand-700"
            >
              Get in touch
            </Link>{" "}
            about any of these and we will tell you what is actually useful right
            now.
          </p>
        </div>
      </Container>
    </section>
  );
}
