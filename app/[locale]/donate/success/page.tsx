import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";

import { Container } from "@/components/site/container";
import { formatMoney, type CurrencyCode } from "@/lib/donate/money";
import { createServiceClient, isServiceRoleConfigured } from "@/lib/supabase/client";
import { WHATSAPP_LINK } from "@/lib/contact/channels";

export const metadata: Metadata = {
  title: "Thank you",
  description: "Your donation to Imarisha Dada.",
  robots: { index: false, follow: false },
};

/**
 * Thank-you page.
 *
 * ## The one rule this page exists to enforce
 *
 * It renders success only when the LEDGER says the donation is `completed`.
 * Not because the URL says so, not because a cookie was set, and not because
 * the client navigated here — the client can do all of those and be lying.
 *
 * So the row is re-read server-side and the status checked. A pending donation
 * lands here too, and renders "we are confirming" rather than "thank you". A
 * donor who sees thanks for a payment that failed will not give again, and will
 * tell everyone they know.
 */
type Row = {
  status: string;
  reference: string;
  display_amount: number | string;
  display_currency: CurrencyCode;
  cadence: "one_time" | "monthly";
  outcome_label: string;
  donor_name: string | null;
};

async function loadDonation(reference: string | undefined): Promise<Row | null> {
  if (!reference || !isServiceRoleConfigured()) return null;

  const { data, error } = await createServiceClient()
    .from("donations")
    .select(
      "status, reference, display_amount, display_currency, cadence, outcome_label, donor_name",
    )
    .eq("reference", reference)
    .maybeSingle();

  if (error) {
    console.error("[donate/success] ledger read failed:", error.message);
    return null;
  }

  return (data as Row | null) ?? null;
}

/** Reads `searchParams`, so it must sit behind a Suspense boundary. */
async function DonationOutcome({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const reference = typeof params.ref === "string" ? params.ref : undefined;
  const donation = await loadDonation(reference);
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "donate" });

  // ---- Not in the ledger at all ------------------------------------
  // Either the reference is wrong, or the service role / migrations are not in
  // place. Do not congratulate anyone.
  if (!donation) {
    return (
      <div className="measure mx-auto max-w-xl">
        <h1 className="text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl">
          We could not find that donation.
        </h1>
        <p className="mt-4 text-lg text-ink-muted">
          If you have already been charged, contact us and we will confirm it straight
          away. Please do not pay again.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={WHATSAPP_LINK}
            className="inline-flex min-h-13 items-center justify-center rounded-lg bg-gold px-8 text-base font-semibold text-gold-ink"
          >
            WhatsApp us
          </a>
          <Link
            href="/"
            className="inline-flex min-h-13 items-center justify-center rounded-lg border border-border bg-card px-8 text-base font-medium text-brand-600"
          >
            Back to the site
          </Link>
        </div>
      </div>
    );
  }

  // ---- Accepted but not yet confirmed ------------------------------
  // Honest wording beats premature celebration. The donor must not be told it
  // succeeded, and must not be left thinking they need to pay again.
  if (donation.status !== "completed") {
    return (
      <div
        className="measure mx-auto max-w-xl"
        role="status"
        aria-live="polite"
      >
        <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
          Confirming
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl">
          We are confirming your gift.
        </h1>
        <p className="mt-4 text-lg text-ink-muted">
          Your payment has been accepted and is waiting on confirmation from your
          bank or M-Pesa. This usually takes a few minutes. You do not need to pay
          again, and we will email your receipt as soon as it clears.
        </p>
        <p className="mt-4 text-sm text-ink-muted">
          Reference <span className="tabular">{donation.reference}</span>, quote this
          if you contact us.
        </p>
      </div>
    );
  }

  // ---- Confirmed in the ledger -------------------------------------
  const firstName = donation.donor_name?.trim().split(/\s+/)[0] ?? null;
  const amount = Number(donation.display_amount);

  return (
    <div className="measure mx-auto max-w-xl">
      <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
        Received
      </p>

      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-600 sm:text-4xl">
        {t("success.title")}{firstName ? `, ${firstName}` : ""}.
      </h1>

      <p className="measure mt-4 text-lg text-ink-muted">
        {t("success.body", {
          amount: `${formatMoney(amount, donation.display_currency)}${
            donation.cadence === "monthly" ? t("success.monthlySuffix") : ""
          }`,
          outcome: donation.outcome_label,
        })}
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <a
          href={`mailto:?subject=${encodeURIComponent(t("success.shareSubject"))}&body=${encodeURIComponent(t("success.shareBody"))}`}
          className="inline-flex min-h-13 items-center justify-center rounded-lg bg-gold px-8 text-base font-semibold text-gold-ink transition-colors hover:bg-gold/90"
        >
          {t("success.share")}
        </a>
        <Link
          href="/"
          className="inline-flex min-h-13 items-center justify-center rounded-lg border border-border bg-card px-8 text-base font-medium text-brand-600 transition-colors hover:border-brand-600/40"
        >
          {t("success.backToSite")}
        </Link>
      </div>

      <p className="mt-8 text-lg text-ink">{t("success.sisterhood")}</p>
      <p className="mt-2 text-sm text-ink-muted">
        {t("success.reference", { reference: donation.reference })}
      </p>
    </div>
  );
}

export default async function DonateSuccessPage({
  params,
  searchParams,
}: PageProps<"/[locale]/donate/success">) {
  const { locale } = await params;

  // Pins the locale for static rendering. `next-intl` otherwise reads it from
  // the request, which is uncached data and fails the `cacheComponents` build.
  setRequestLocale(locale);

  return (
    <>
      <main id="main" className="flex min-h-[70vh] items-center bg-surface">
        <Container>
          <Suspense
            // Deliberately neutral. "Loading" here would be misleading — the
            // donor already paid, we are only checking.
            fallback={
              <p className="text-ink-muted" role="status">
                Checking your donation…
              </p>
            }
          >
            <DonationOutcome searchParams={searchParams} />
          </Suspense>
        </Container>
      </main>
    </>
  );
}
