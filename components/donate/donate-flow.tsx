"use client";

import { useTranslations } from "next-intl";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { DonorDetails } from "@/components/donate/donor-details";
import { OrderSummary } from "@/components/donate/order-summary";
import { PaymentMethod } from "@/components/donate/payment-method";
import { TierSelector } from "@/components/donate/tier-selector";
import { submitDonation } from "@/app/[locale]/donate/actions";
import type { BankDetails, PaymentRails, TaxReceipt } from "@/lib/data/donate";
import {
  calculateFee,
  convertAmount,
  DonationError,
  SETTLEMENT_CURRENCY,
  totalCharge,
  validateDonorDetails,
  type Cadence,
  type CurrencyCode,
  type PaymentRail,
  type Tier,
} from "@/lib/donate/money";

/**
 * Client orchestrator for the donation flow.
 *
 * The preview maths here duplicates `resolveDonation` deliberately: the
 * summary must update live as the donor picks, without a round trip. It is a
 * *preview only*. The authoritative amount is re-derived in the Server Action
 * from `giving_tiers`, so a tampered client cannot change what is charged — the
 * preview and the charge agreeing is a convenience, never the security
 * boundary.
 */
export function DonateFlow({
  tiers,
  rails,
  bank,
  tax,
  bankUsable,
}: {
  tiers: Tier[];
  rails: PaymentRails;
  bank: BankDetails;
  tax: TaxReceipt;
  bankUsable: boolean;
}) {
  const t = useTranslations("donate");
  // Validation messages live in a top-level `errors` namespace.
  const te = useTranslations("errors");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [cadence, setCadence] = useState<Cadence>("one_time");
  const [currency, setCurrency] = useState<CurrencyCode>("KES");
  const [selectedSlug, setSelectedSlug] = useState<string>(tiers[0]?.slug ?? "");
  const [customAmount, setCustomAmount] = useState("");
  const [rail, setRail] = useState<PaymentRail | null>(
    rails.card.enabled ? "card" : rails.bank.enabled ? "bank" : null,
  );

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consentRecurring, setConsentRecurring] = useState(false);
  const [consentUpdates, setConsentUpdates] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [payError, setPayError] = useState<string | null>(null);

  const showPhoneHint = rail === "mpesa";

  // ---- Live preview -------------------------------------------------
  const preview = useMemo(() => {
    const tier = tiers.find((t) => t.slug === selectedSlug);
    const settlementAmount =
      selectedSlug === "custom"
        ? Math.round(Number(customAmount) || 0)
        : (tier?.amount ?? 0);

    if (settlementAmount <= 0) {
      return {
        amount: 0,
        fee: 0,
        total: 0,
        outcomeLabel: "",
        valid: false,
      };
    }

    const amount = convertAmount(settlementAmount, SETTLEMENT_CURRENCY, currency);
    const effectiveRail = rail ?? "mpesa";
    return {
      amount,
      fee: calculateFee(amount, effectiveRail),
      total: totalCharge(amount, effectiveRail),
      outcomeLabel:
        selectedSlug === "custom" ? t("outcome.whereNeededMost") : (tier?.outcomeLabel ?? ""),
      valid: true,
    };
    // `t` is included: the outcome label is locale-dependent, so a
    // locale change must recompute the preview. `useTranslations` returns a
    // new function identity per locale, so this is not a spurious dependency.
  }, [tiers, selectedSlug, customAmount, currency, rail, t]);

  const canPay = Boolean(rail) && preview.valid && preview.total > 0 && !isPending;

  function handlePay() {
    setPayError(null);

    // Client-side validation first, purely to save a round trip. The Server
    // Action re-validates everything regardless.
    const check = validateDonorDetails({
      email,
      name,
      phone,
      cadence,
      consentRecurring,
      consentUpdates,
    });

    if (!check.valid) {
      setErrors(check.errors);
      // Move focus to the first problem so a keyboard or screen reader user is
      // not left guessing which field broke.
      const first = document.querySelector<HTMLElement>("[aria-invalid='true']");
      first?.focus();
      return;
    }

    setErrors({});

    startTransition(async () => {
      try {
        const result = await submitDonation({
          tierSlug: selectedSlug,
          customAmount:
            selectedSlug === "custom" ? Number(customAmount) : undefined,
          cadence,
          currency,
          rail: rail!,
          email,
          name,
          phone,
          consentRecurring,
          consentUpdates,
        });

        if (result.status === "invalid") {
          setErrors(result.errors);
          const first = document.querySelector<HTMLElement>("[aria-invalid='true']");
          first?.focus();
          return;
        }

        if (result.status === "failed") {
          setPayError(result.message);
          return;
        }

        // `pending` and `completed` both leave the page, but only `completed`
        // may reach the success page — which independently re-reads the ledger.
        router.push(result.redirectTo);
      } catch (error) {
        if (error instanceof DonationError) {
          setErrors({ amount: "amountInvalid" });
          return;
        }
        setPayError(
          t("errors.generic"),
        );
      }
    });
  }

  const bankUnavailableReason = bankUsable
    ? undefined
    : t("bank.notReady");

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
      <div className="space-y-10">
        <TierSelector
          tiers={tiers}
          cadence={cadence}
          onCadenceChange={(c) => {
            setCadence(c);
            // Switching cadence invalidates the selected tier; fall back to the
            // first tier of the new cadence rather than leaving nothing chosen.
            const first = tiers
              .filter((t) => t.cadence === c)
              .sort((a, b) => a.sortOrder - b.sortOrder)[0];
            if (first && !tiers.some((t) => t.slug === selectedSlug && t.cadence === c)) {
              setSelectedSlug(first.slug);
            }
          }}
          currency={currency}
          onCurrencyChange={setCurrency}
          selectedSlug={selectedSlug}
          onSelect={setSelectedSlug}
          customAmount={customAmount}
          onCustomAmountChange={setCustomAmount}
          errorId={errors.amount ? "amount-error" : undefined}
        />

        {errors.amount ? (
          <p id="amount-error" className="-mt-6 text-sm text-brand-600">
            {te(errors.amount)}
          </p>
        ) : null}

        <PaymentMethod
          rails={rails}
          selected={rail}
          onSelect={setRail}
          bankUnavailableReason={bankUnavailableReason}
          errorId={errors.rail ? "rail-error" : undefined}
        />

        {errors.rail ? (
          <p id="rail-error" className="-mt-6 text-sm text-brand-600">
            {te(errors.rail)}
          </p>
        ) : null}

        {rail === "bank" && bankUsable ? (
          <div className="rounded-xl border border-border bg-surface-lilac p-5 text-sm">
            <h3 className="font-semibold text-ink">{t("bank.heading")}</h3>
            <dl className="mt-3 space-y-1 text-ink-muted">
              <div className="flex gap-2">
                <dt>{t("bank.accountName")}</dt>
                <dd className="font-medium text-ink">{bank.accountName}</dd>
              </div>
              <div className="flex gap-2">
                <dt>{t("bank.bank")}</dt>
                <dd className="font-medium text-ink">{bank.bankName}</dd>
              </div>
              <div className="flex gap-2">
                <dt>{t("bank.accountNumber")}</dt>
                <dd className="font-medium text-ink tabular">{bank.accountNumber}</dd>
              </div>
              {bank.branch ? (
                <div className="flex gap-2">
                  <dt>{t("bank.branch")}</dt>
                  <dd className="font-medium text-ink">{bank.branch}</dd>
                </div>
              ) : null}
            </dl>
            {bank.instructions ? (
              <p className="mt-3 text-ink-muted">{bank.instructions}</p>
            ) : null}
          </div>
        ) : null}

        <DonorDetails
          email={email}
          name={name}
          phone={phone}
          onEmailChange={setEmail}
          onNameChange={setName}
          onPhoneChange={setPhone}
          cadence={cadence}
          consentRecurring={consentRecurring}
          consentUpdates={consentUpdates}
          onConsentRecurringChange={setConsentRecurring}
          onConsentUpdatesChange={setConsentUpdates}
          showPhoneHint={showPhoneHint}
          errors={errors}
        />
      </div>

      {/* Sticky so the total and Pay stay reachable on a long form. */}
      <div className="lg:sticky lg:top-8 lg:self-start">
        <OrderSummary
          amount={preview.amount}
          currency={currency}
          fee={preview.fee}
          total={preview.total}
          cadence={cadence}
          outcomeLabel={preview.outcomeLabel}
          rail={rail}
          tax={tax}
          status={isPending ? "pending" : payError ? "error" : "idle"}
          pendingLabel={t("summary.pending")}
          error={payError}
          onPay={handlePay}
          canPay={canPay}
        />

        {!canPay && !isPending ? (
          <p className="mt-3 text-sm text-ink-muted">
            Choose an amount and a payment method to continue.
          </p>
        ) : null}
      </div>
    </div>
  );
}
